import { execFile, spawn } from 'child_process';
import { SubmissionStatus } from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DEFAULT_TIME_LIMIT = 10 * 1000;
const JAVA_MAIN_CLASS = "Main";

export const EXECUTABLE_NAME = "main";

// Define ExecutionMode enum
export enum ExecutionMode {
    Interprete = 'interprete',
    Compiled = 'compiled'
}

export type ExecutionPhase = "compile" | "run";

// Define ExecutionResult interface for named tuple
export interface ExecutionResult {
    succeeded: boolean;
    executionTime: number;
    // Cross-platform child-process memory tracking is not implemented yet.
    executionMemoryKb: number;
    output: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    phase: ExecutionPhase;
    status: SubmissionStatus;
}

export interface JudgeTestCase {
    input: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
}

interface JudgeOptions {
    code: string;
    fileSuffix: string;
    interpretCmd?: string;
    compileCmd?: string;
    runCmd?: string;
    executable?: string;
    testCases: Array<string | JudgeTestCase>;
}

interface CommandSpec {
    command: string;
    args: string[];
    includesSource: boolean;
}

const MEMORY_POLL_INTERVAL_MS = 50;

export class JudgeExecutionSetupError extends Error {
    readonly phase: ExecutionPhase;
    readonly status: SubmissionStatus;

    constructor(message: string, phase: ExecutionPhase, status: SubmissionStatus) {
        super(message);
        this.phase = phase;
        this.status = status;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

function normalizeSuffix(fileSuffix: string) {
    const normalized = fileSuffix.replace(/^\.+/, "");
    return normalized || "txt";
}

function tokenizeCommand(command: string): string[] {
    const matches = command.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
    return matches.map((token) => {
        if (
            (token.startsWith('"') && token.endsWith('"')) ||
            (token.startsWith("'") && token.endsWith("'"))
        ) {
            return token.slice(1, -1);
        }
        return token;
    });
}

function replacePlaceholders(token: string, replacements: Record<string, string>) {
    return token.replace(/\{(\w+)\}/g, (_, key: string) => replacements[key] ?? "");
}

function buildCommand(template: string, replacements: Record<string, string>): CommandSpec {
    const tokens = tokenizeCommand(template);
    const includesSource = tokens.some((token) => token.includes("{source}"));
    const replaced = tokens.map((token) => replacePlaceholders(token, replacements));

    if (replaced.length === 0) {
        throw new Error("Execution command cannot be empty.");
    }

    return {
        command: replaced[0],
        args: replaced.slice(1),
        includesSource,
    };
}

function normalizeTestCase(testCase: string | JudgeTestCase): JudgeTestCase {
    if (typeof testCase === "string") {
        return { input: testCase };
    }
    return testCase;
}

function normalizeStreamOutput(stream: string) {
    return stream.replace(/\r\n/g, "\n").trimEnd();
}

function formatOutput(stdout: string, stderr: string) {
    const normalizedStdout = normalizeStreamOutput(stdout);
    const normalizedStderr = normalizeStreamOutput(stderr);
    return normalizedStdout.length > 0 ? normalizedStdout : normalizedStderr;
}

function readCommandOutput(command: string, args: string[]) {
    return new Promise<string>((resolve, reject) => {
        execFile(command, args, { encoding: "utf8" }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr ? new Error(stderr.trim()) : error);
                return;
            }
            resolve(stdout);
        });
    });
}

async function sampleProcessMemoryKb(pid: number) {
    try {
        if (process.platform === "win32") {
            const output = await readCommandOutput("powershell", [
                "-NoProfile",
                "-Command",
                `(Get-Process -Id ${pid}).WorkingSet64`,
            ]);
            const bytes = Number.parseInt(output.trim(), 10);
            return Number.isFinite(bytes) ? Math.ceil(bytes / 1024) : null;
        }

        const output = await readCommandOutput("ps", ["-o", "rss=", "-p", String(pid)]);
        const rssKb = Number.parseInt(output.trim(), 10);
        return Number.isFinite(rssKb) ? rssKb : null;
    } catch {
        return null;
    }
}

async function runProcess(
    command: string,
    args: string[],
    options: {
        cwd: string;
        input?: string;
        timeoutMs?: number;
        memoryLimitMb?: number;
        failureStatus: SubmissionStatus;
        phase: ExecutionPhase;
    }
): Promise<ExecutionResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIME_LIMIT;
    const startTime = Date.now();
    const memoryLimitKb =
        options.memoryLimitMb != null ? options.memoryLimitMb * 1024 : null;

    return await new Promise<ExecutionResult>((resolve) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            stdio: "pipe",
        });

        let stdout = "";
        let stderr = "";
        let finished = false;
        let peakMemoryKb = 0;
        let memoryTimer: NodeJS.Timeout | undefined;

        const finish = (result: ExecutionResult) => {
            if (finished) {
                return;
            }
            finished = true;
            clearTimeout(timer);
            if (memoryTimer) {
                clearInterval(memoryTimer);
            }
            resolve(result);
        };

        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            const timeoutMessage = "time limit exceeded";
            finish({
                succeeded: false,
                executionTime: timeoutMs,
                executionMemoryKb: peakMemoryKb,
                output: formatOutput(stdout, timeoutMessage),
                stdout: normalizeStreamOutput(stdout),
                stderr: timeoutMessage,
                exitCode: null,
                timedOut: true,
                phase: options.phase,
                status: SubmissionStatus.TIME_LIMIT_EXCEEDED
            });
        }, timeoutMs);

        const monitorMemory = async () => {
            if (finished || memoryLimitKb == null || child.pid == null) {
                return;
            }

            const currentMemoryKb = await sampleProcessMemoryKb(child.pid);
            if (currentMemoryKb == null) {
                return;
            }

            peakMemoryKb = Math.max(peakMemoryKb, currentMemoryKb);

            if (currentMemoryKb > memoryLimitKb) {
                const memoryMessage = `memory limit exceeded (${options.memoryLimitMb} MB)`;
                child.kill("SIGKILL");
                finish({
                    succeeded: false,
                    executionTime: Date.now() - startTime,
                    executionMemoryKb: currentMemoryKb,
                    output: formatOutput(stdout, memoryMessage),
                    stdout: normalizeStreamOutput(stdout),
                    stderr: memoryMessage,
                    exitCode: null,
                    timedOut: false,
                    phase: options.phase,
                    status: options.failureStatus,
                });
            }
        };

        if (memoryLimitKb != null) {
            memoryTimer = setInterval(() => {
                void monitorMemory();
            }, MEMORY_POLL_INTERVAL_MS);
            void monitorMemory();
        }

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error) => {
            const errorMessage = normalizeStreamOutput(error.message);
            finish({
                succeeded: false,
                executionTime: Date.now() - startTime,
                executionMemoryKb: peakMemoryKb,
                output: errorMessage,
                stdout: normalizeStreamOutput(stdout),
                stderr: errorMessage,
                exitCode: null,
                timedOut: false,
                phase: options.phase,
                status: options.failureStatus,
            });
        });

        child.on("close", (code, signal) => {
            if (signal === "SIGKILL") {
                const timeoutMessage = "time limit exceeded";
                finish({
                    succeeded: false,
                    executionTime: timeoutMs,
                    executionMemoryKb: peakMemoryKb,
                    output: formatOutput(stdout, timeoutMessage),
                    stdout: normalizeStreamOutput(stdout),
                    stderr: timeoutMessage,
                    exitCode: code ?? null,
                    timedOut: true,
                    phase: options.phase,
                    status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
                });
                return;
            }

            const normalizedStdout = normalizeStreamOutput(stdout);
            const normalizedStderr = normalizeStreamOutput(stderr);
            const output = formatOutput(stdout, stderr);
            if (code === 0) {
                finish({
                    succeeded: true,
                    executionTime: Date.now() - startTime,
                    executionMemoryKb: peakMemoryKb,
                    output,
                    stdout: normalizedStdout,
                    stderr: normalizedStderr,
                    exitCode: code,
                    timedOut: false,
                    phase: options.phase,
                    status: SubmissionStatus.ACCEPTED,
                });
                return;
            }

            finish({
                succeeded: false,
                executionTime: Date.now() - startTime,
                executionMemoryKb: peakMemoryKb,
                output: output || `Process exited with code ${code ?? "unknown"}`,
                stdout: normalizedStdout,
                stderr: normalizedStderr,
                exitCode: code ?? null,
                timedOut: false,
                phase: options.phase,
                status: options.failureStatus,
            });
        });

        if (options.input !== undefined) {
            child.stdin.write(options.input);
        }
        child.stdin.end();
    });
}

async function interprete(
    interpretCmd: string,
    cwd: string,
    codeFile: string,
    testCase: JudgeTestCase,
    replacements: Record<string, string>
): Promise<ExecutionResult> {
    let spec: CommandSpec;
    try {
        spec = buildCommand(interpretCmd, replacements);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Interpreter command could not be resolved.";
        throw new JudgeExecutionSetupError(
            message,
            "run",
            SubmissionStatus.RUNTIME_ERROR
        );
    }
    if (!spec.includesSource) {
        spec.args.push(codeFile);
    }

    return runProcess(spec.command, spec.args, {
        cwd,
        input: testCase.input,
        timeoutMs: testCase.timeLimitMs,
        memoryLimitMb: testCase.memoryLimitMb,
        failureStatus: SubmissionStatus.RUNTIME_ERROR,
        phase: "run",
    });
}

async function compile(
    compileCmd: string,
    cwd: string,
    codeFile: string,
    replacements: Record<string, string>
): Promise<ExecutionResult> {
    let spec: CommandSpec;
    try {
        spec = buildCommand(compileCmd, replacements);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Compile command could not be resolved.";
        throw new JudgeExecutionSetupError(
            message,
            "compile",
            SubmissionStatus.COMPILE_ERROR
        );
    }
    if (!spec.includesSource) {
        spec.args.push(codeFile);
    }

    return runProcess(spec.command, spec.args, {
        cwd,
        failureStatus: SubmissionStatus.COMPILE_ERROR,
        phase: "compile",
    });
}

async function runExecutable(
    cwd: string,
    runCmd: string | undefined,
    executablePath: string,
    testCase: JudgeTestCase,
    replacements: Record<string, string>
): Promise<ExecutionResult> {
    if (!runCmd) {
        return runProcess(executablePath, [], {
            cwd,
            input: testCase.input,
            timeoutMs: testCase.timeLimitMs,
            memoryLimitMb: testCase.memoryLimitMb,
            failureStatus: SubmissionStatus.RUNTIME_ERROR,
            phase: "run",
        });
    }

    let spec: CommandSpec;
    try {
        spec = buildCommand(runCmd, replacements);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Run command could not be resolved.";
        throw new JudgeExecutionSetupError(
            message,
            "run",
            SubmissionStatus.RUNTIME_ERROR
        );
    }
    return runProcess(spec.command, spec.args, {
        cwd,
        input: testCase.input,
        timeoutMs: testCase.timeLimitMs,
        memoryLimitMb: testCase.memoryLimitMb,
        failureStatus: SubmissionStatus.RUNTIME_ERROR,
        phase: "run",
    });
}

export async function judgeSolution(
    mode: ExecutionMode,
    options: JudgeOptions
): Promise<Array<ExecutionResult>> {
    const results: Array<ExecutionResult> = [];
    const normalizedSuffix = normalizeSuffix(options.fileSuffix);
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "judge-"));
    const sourceBaseName = normalizedSuffix === "java" ? JAVA_MAIN_CLASS : EXECUTABLE_NAME;
    const sourceFile = path.join(workDir, `${sourceBaseName}.${normalizedSuffix}`);
    const executableBaseName = options.executable || EXECUTABLE_NAME;
    const executableName =
        process.platform === "win32" ? `${executableBaseName}.exe` : executableBaseName;
    const executablePath = path.join(workDir, executableName);
    const replacements = {
        source: sourceFile,
        sourceName: path.basename(sourceFile),
        sourceBase: sourceBaseName,
        executable: executableName,
        executablePath,
        mainClass: sourceBaseName,
    };

    fs.writeFileSync(sourceFile, options.code);

    try {
        if (mode === ExecutionMode.Interprete) {
            if (!options.interpretCmd) 
                throw new JudgeExecutionSetupError(
                    "interpretCmd is required for interprete mode.",
                    "run",
                    SubmissionStatus.RUNTIME_ERROR
                );
            for (const testCase of options.testCases) {
                const output = await interprete(
                    options.interpretCmd,
                    workDir,
                    sourceFile,
                    normalizeTestCase(testCase),
                    replacements
                );
                results.push(output);
            }
        } else if (mode === ExecutionMode.Compiled) {
            if (!options.compileCmd) {
                throw new JudgeExecutionSetupError(
                    "compileCmd is required for compiled mode.",
                    "compile",
                    SubmissionStatus.COMPILE_ERROR
                );
            }

            const compileResult = await compile(
                options.compileCmd,
                workDir,
                sourceFile,
                replacements
            );
            if (!compileResult.succeeded) {
                results.push(compileResult);
                return results;
            }

            for (const testCase of options.testCases) {
                const output = await runExecutable(
                    workDir,
                    options.runCmd,
                    executablePath,
                    normalizeTestCase(testCase),
                    replacements
                );
                results.push(output);
            }
        }
    } finally {
        if (fs.existsSync(workDir)) {
            fs.rmSync(workDir, { recursive: true, force: true });
        }
    }
    return results;
}

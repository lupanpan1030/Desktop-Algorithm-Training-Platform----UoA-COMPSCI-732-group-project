import { spawn } from 'child_process';
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

async function runProcess(
    command: string,
    args: string[],
    options: {
        cwd: string;
        input?: string;
        timeoutMs?: number;
        failureStatus: SubmissionStatus;
        phase: ExecutionPhase;
    }
): Promise<ExecutionResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIME_LIMIT;
    const startTime = Date.now();

    return await new Promise<ExecutionResult>((resolve) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            stdio: "pipe",
        });

        let stdout = "";
        let stderr = "";
        let finished = false;

        const finish = (result: ExecutionResult) => {
            if (finished) {
                return;
            }
            finished = true;
            clearTimeout(timer);
            resolve(result);
        };

        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            const timeoutMessage = "time limit exceeded";
            finish({
                succeeded: false,
                executionTime: timeoutMs,
                executionMemoryKb: 0,
                output: formatOutput(stdout, timeoutMessage),
                stdout: normalizeStreamOutput(stdout),
                stderr: timeoutMessage,
                exitCode: null,
                timedOut: true,
                phase: options.phase,
                status: SubmissionStatus.TIME_LIMIT_EXCEEDED
            });
        }, timeoutMs);

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
                executionMemoryKb: 0,
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
                    executionMemoryKb: 0,
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
                    executionMemoryKb: 0,
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
                executionMemoryKb: 0,
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
    const spec = buildCommand(interpretCmd, replacements);
    if (!spec.includesSource) {
        spec.args.push(codeFile);
    }

    return runProcess(spec.command, spec.args, {
        cwd,
        input: testCase.input,
        timeoutMs: testCase.timeLimitMs,
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
    const spec = buildCommand(compileCmd, replacements);
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
            failureStatus: SubmissionStatus.RUNTIME_ERROR,
            phase: "run",
        });
    }

    const spec = buildCommand(runCmd, replacements);
    return runProcess(spec.command, spec.args, {
        cwd,
        input: testCase.input,
        timeoutMs: testCase.timeLimitMs,
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
                throw new Error("interpretCmd is required for interprete mode.");
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
                throw new Error("compileCmd is required for compiled mode.");
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

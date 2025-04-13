import { exec } from 'child_process';
import { promisify } from 'util';
import { SubmissionStatus } from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

const TIME_LIMIT = 10 * 1000;

// Define ExecutionMode enum
export enum ExecutionMode {
    Interprete = 'interprete',
    Compiled = 'compiled'
}

// Define ExecutionResult interface for named tuple
export interface ExecutionResult {
    succeeded: boolean;
    executionTime: number;
    executionMemoryKb: number; // new field for memory in KB
    output: string;
    status: SubmissionStatus;
}

interface JudgeOptions {
    code: string;
    fileSuffix: string;
    interpretCmd?: string;
    compileCmd?: string;
    executable?: string;
    testCases: string[];
}

// Utility function to run a command with platform consideration, timeout, and tuple error handling
async function runCommand(command: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    // Adjust command for Windows
    if (process.platform === 'win32') {
        command = `cmd.exe /c "${command}"`;
    }
    try {
        const { stdout, stderr } = await execAsync(command, { timeout: TIME_LIMIT });
        const elapsed = Date.now() - startTime;
        const memoryKb = Math.round(process.memoryUsage().rss / 1024); // record memory usage
        return {
            succeeded: true,
            executionTime: elapsed,
            executionMemoryKb: memoryKb,
            output: stdout || stderr,
            status: SubmissionStatus.ACCEPTED
        };
    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        const memoryKb = Math.round(process.memoryUsage().rss / 1024); // record memory usage
        if (error.killed) {
            return {
                succeeded: false,
                executionTime: TIME_LIMIT,
                executionMemoryKb: memoryKb,
                output: 'time limit exceed',
                status: SubmissionStatus.TIME_LIMIT_EXCEEDED
            };
        }
        return {
            succeeded: false,
            executionTime: elapsed,
            executionMemoryKb: memoryKb,
            output: error.message,
            status: SubmissionStatus.RUNTIME_ERROR
        };
    }
}

// Function to interpret a script with test case input piped in
async function interprete(interpretCmd: string, code: string, testCase: string): Promise<ExecutionResult> {
    const command = `echo "${testCase}" | ${interpretCmd} ${code}`;
    return runCommand(command);
}

// Function to compile a source file
async function compile(compileCmd: string, code: string): Promise<void> {
    const command = `${compileCmd} ${code}`;
    await runCommand(command);
}

// Function to run a compiled executable with test case input piped in
async function runExecutable(executable: string, testCase: string): Promise<ExecutionResult> {
    const command = `echo "${testCase}" | ${executable}`;
    return runCommand(command);
}

// Judge function to run several test cases.
// Depending on mode, it uses the interpreter directly,
// or compiles once and then runs the executable for each test case.
export async function judgeSolution(
    mode: ExecutionMode,
    options: JudgeOptions
): Promise<Array<ExecutionResult>> {
    const results: Array<ExecutionResult> = [];
    // Create a temporary source file using code and fileSuffix.
    const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.${options.fileSuffix}`);
    fs.writeFileSync(tempFile, options.code);
    try {
        if (mode === ExecutionMode.Interprete) {
            if (!options.interpretCmd) 
                throw new Error("interpretCmd is required for interprete mode.");
            for (const testCase of options.testCases) {
                const output = await interprete(options.interpretCmd, tempFile, testCase);
                results.push(output);
            }
        } else if (mode === ExecutionMode.Compiled) {
            if (!options.compileCmd || !options.executable){
                throw new Error("compileCmd and executable are required for compiled mode.");
            }
            // Compile using the temporary file.
            await compile(options.compileCmd, tempFile);
            for (const testCase of options.testCases) {
                const output = await runExecutable(options.executable, testCase);
                results.push(output);
            }
            // Cleanup the executable after running.
            if (fs.existsSync(options.executable)) {
                fs.unlinkSync(options.executable);
            }
        }
    } finally {
        // Cleanup the temporary source file.
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
    return results;
}

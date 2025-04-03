import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const TIME_LIMIT = 10 * 1000;

// Define ExecutionMode enum
export enum ExecutionMode {
    Interprete = 'interprete',
    Compiled = 'compiled'
}

// Define JudgeOptions interface
interface JudgeOptions {
    file: string;
    interpretCmd?: string;
    compileCmd?: string;
    executable?: string;
    testCases: string[];
}

// Utility function to run a command with platform consideration, timeout, and tuple error handling
async function runCommand(command: string): Promise<[boolean, number, string]> {
    const startTime = Date.now();
    // Adjust command for Windows
    if (process.platform === 'win32') {
        command = `cmd.exe /c "${command}"`;
    }
    try {
        const { stdout, stderr } = await execAsync(command, { timeout: TIME_LIMIT });
        const elapsed = Date.now() - startTime;
        return [true, elapsed, stdout || stderr];
    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        if (error.killed) {
            return [false, TIME_LIMIT, 'time limit exceed'];
        }
        return [false, elapsed, error.message];
    }
}

// Function to interpret a script with test case input piped in
async function interprete(interpretCmd: string, file: string, testCase: string): Promise<[boolean, number, string]> {
    const command = `echo "${testCase}" | ${interpretCmd} ${file}`;
    return runCommand(command);
}

// Function to compile a source file
async function compile(compileCmd: string, file: string): Promise<void> {
    const command = `${compileCmd} ${file}`;
    const [success, , msg] = await runCommand(command);
    if (!success) {
        throw new Error(msg);
    }
}

// Function to run a compiled executable with test case input piped in
async function runExecutable(executable: string, testCase: string): Promise<[boolean, number, string]> {
    const command = `echo "${testCase}" | ${executable}`;
    return runCommand(command);
}

// Judge function to run several test cases.
// Depending on mode, it uses the interpreter directly,
// or compiles once and then runs the executable for each test case.
export async function judgeSolution(
    mode: ExecutionMode,
    options: JudgeOptions
): Promise<Array<[boolean, number, string]>> {
    const results: Array<[boolean, number, string]> = [];
    if (mode === ExecutionMode.Interprete) {
        if (!options.interpretCmd) 
            throw new Error("interpretCmd is required for interprete mode.");
        for (const testCase of options.testCases) {
            const output = await interprete(options.interpretCmd, options.file, testCase);
            results.push(output);
        }
    } else if (mode === ExecutionMode.Compiled) {
        if (!options.compileCmd || !options.executable) 
            throw new Error("compileCmd and executable are required for compiled mode.");
        // Compile once.
        await compile(options.compileCmd, options.file);
        for (const testCase of options.testCases) {
            const output = await runExecutable(options.executable, testCase);
            results.push(output);
        }
    }
    return results;
}

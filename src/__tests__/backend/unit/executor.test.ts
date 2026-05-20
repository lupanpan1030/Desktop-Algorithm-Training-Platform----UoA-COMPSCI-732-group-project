import { SubmissionStatus } from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { judgeSolution, ExecutionMode, EXECUTABLE_NAME } from '../../../backend/services/judge/executor';

function isProcessAlive(pid: number) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return !(
			error instanceof Error &&
			'code' in error &&
			error.code === 'ESRCH'
		);
	}
}

async function waitForProcessExit(pid: number, timeoutMs = 1500) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		if (!isProcessAlive(pid)) {
			return true;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	return !isProcessAlive(pid);
}

describe('judgeSolution', () => {

	// Test for interprete mode using python3.
	it('should add two numbers using Python interpreter', async () => {
		const pythonCode = `
import sys
def main():
    try:
        a, b = map(int, sys.stdin.read().strip().split())
        print(a+b)
    except Exception as e:
        print("error")
if __name__ == '__main__':
    main()
		`.trim();
		const testCases = ['2 3'];
		const options = {
			code: pythonCode,
			fileSuffix: 'py',
			interpretCmd: 'python3',
			testCases
		};
		const results = await judgeSolution(ExecutionMode.Interprete, options);
		expect(results.length).toBe(1);
		const result = results[0];
		expect(result.succeeded).toBe(true);
		expect(result.output).toBe("5");
		expect(result.stdout).toBe("5");
		expect(result.stderr).toBe("");
		expect(result.phase).toBe("run");
		expect(result.timedOut).toBe(false);
	});

	// Test for compiled mode using gcc.
	it('should add two ints using C compiled executable', async () => {
		const cCode = `
#include <stdio.h>
#include <stdlib.h>

int main() {
	char input[100];
	int a, b;
	if (fgets(input, sizeof(input), stdin) != NULL) {
		if (sscanf(input, "%d %d", &a, &b) == 2) {
			printf("%d", a + b); // Remove newline for strict output match
		}
	}
	return 0;
}
		`.trim();
		const testCases = ['4 5'];
		const options = {
			code: cCode,
			fileSuffix: 'c',
			compileCmd: `gcc -o main`,
			executable: EXECUTABLE_NAME,
			testCases
		};
		const results = await judgeSolution(ExecutionMode.Compiled, options);
		expect(results.length).toBe(1);
		const result = results[0];
		// Debug output for troubleshooting
		if (!result.succeeded) {
			console.error('C code execution failed:', result);
		}
		expect(result.succeeded).toBe(true);
		expect(result.output).toBe("9");
		expect(result.stdout).toBe("9");
		expect(result.stderr).toBe("");
		expect(result.phase).toBe("run");
		expect(result.exitCode).toBe(0);
	}, 20000);

	it('runs compiled binaries through an explicit {executablePath} run command', async () => {
		const cCode = `
#include <stdio.h>

int main() {
	int value;
	if (scanf("%d", &value) == 1) {
		printf("%d", value * 3);
	}
	return 0;
}
		`.trim();

		const results = await judgeSolution(ExecutionMode.Compiled, {
			code: cCode,
			fileSuffix: '.c',
			compileCmd: 'gcc -o {executable} {source}',
			runCmd: '{executablePath}',
			executable: 'triple',
			testCases: ['7'],
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			succeeded: true,
			status: SubmissionStatus.ACCEPTED,
			output: '21',
			phase: 'run',
			exitCode: 0,
		});
	}, 20000);

	it('captures compile diagnostics for invalid C code', async () => {
		const invalidCCode = `
#include <stdio.h>

int main() {
	printf("oops")
	return 0;
}
		`.trim();
		const options = {
			code: invalidCCode,
			fileSuffix: 'c',
			compileCmd: 'gcc -o main',
			executable: EXECUTABLE_NAME,
			testCases: [''],
		};

		const results = await judgeSolution(ExecutionMode.Compiled, options);
		expect(results).toHaveLength(1);
		const result = results[0];
		expect(result.succeeded).toBe(false);
		expect(result.status).toBe(SubmissionStatus.COMPILE_ERROR);
		expect(result.phase).toBe('compile');
		expect(result.stderr.length).toBeGreaterThan(0);
		expect(result.output).toContain('error');
		expect(result.timedOut).toBe(false);
	});

	it('captures runtime diagnostics for interpreter errors', async () => {
		const pythonCode = `
print(10 / int(input().strip()))
		`.trim();
		const options = {
			code: pythonCode,
			fileSuffix: 'py',
			interpretCmd: 'python3',
			testCases: ['0'],
		};

		const results = await judgeSolution(ExecutionMode.Interprete, options);
		expect(results).toHaveLength(1);
		const result = results[0];
		expect(result.succeeded).toBe(false);
		expect(result.status).toBe(SubmissionStatus.RUNTIME_ERROR);
		expect(result.phase).toBe('run');
		expect(result.stderr).toContain('ZeroDivisionError');
		expect(result.exitCode).not.toBe(0);
		expect(result.timedOut).toBe(false);
	});

	it('marks timeouts with phase and timeout metadata', async () => {
		const pythonCode = `
import time
time.sleep(0.2)
print("done")
		`.trim();
		const options = {
			code: pythonCode,
			fileSuffix: 'py',
			interpretCmd: 'python3',
			testCases: [{ input: '', timeLimitMs: 50 }],
		};

		const results = await judgeSolution(ExecutionMode.Interprete, options);
		expect(results).toHaveLength(1);
		const result = results[0];
		expect(result.succeeded).toBe(false);
		expect(result.status).toBe(SubmissionStatus.TIME_LIMIT_EXCEEDED);
		expect(result.phase).toBe('run');
		expect(result.timedOut).toBe(true);
		expect(result.stderr).toBe('time limit exceeded');
	});

	it('enforces testcase memory limits for interpreter runs', async () => {
		if (process.platform === 'win32') {
			return;
		}

		const pythonCode = `
import time
data = bytearray(64 * 1024 * 1024)
time.sleep(0.3)
print(len(data))
		`.trim();
		const options = {
			code: pythonCode,
			fileSuffix: 'py',
			interpretCmd: 'python3',
			testCases: [{ input: '', timeLimitMs: 1000, memoryLimitMb: 16 }],
		};

		const results = await judgeSolution(ExecutionMode.Interprete, options);
		expect(results).toHaveLength(1);
		const result = results[0];
		expect(result.succeeded).toBe(false);
		expect(result.status).toBe(SubmissionStatus.RUNTIME_ERROR);
		expect(result.phase).toBe('run');
		expect(result.stderr).toContain('memory limit exceeded');
		expect(result.executionMemoryKb).toBeGreaterThan(16 * 1024);
	}, 15000);

	it('cleans up spawned child processes when a run times out', async () => {
		if (process.platform === 'win32') {
			return;
		}

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-timeout-tree-'));
		const markerPath = path.join(tempDir, 'sleeper.pid');
		const childScript = `
import os
import pathlib
import time
pathlib.Path(${JSON.stringify(markerPath)}).write_text(str(os.getpid()), encoding="utf8")
time.sleep(10)
		`.trim();
		const pythonCode = `
import pathlib
import subprocess
import sys
import time

marker = pathlib.Path(${JSON.stringify(markerPath)})
subprocess.Popen([sys.executable, "-c", ${JSON.stringify(childScript)}])
deadline = time.time() + 2
while not marker.exists() and time.time() < deadline:
    time.sleep(0.01)
time.sleep(10)
		`.trim();

		try {
			const results = await judgeSolution(ExecutionMode.Interprete, {
				code: pythonCode,
				fileSuffix: 'py',
				interpretCmd: 'python3',
				testCases: [{ input: '', timeLimitMs: 250 }],
			});

			expect(results).toHaveLength(1);
			expect(results[0].status).toBe(SubmissionStatus.TIME_LIMIT_EXCEEDED);
			expect(fs.existsSync(markerPath)).toBe(true);

			const childPid = Number.parseInt(fs.readFileSync(markerPath, 'utf8'), 10);
			expect(Number.isInteger(childPid)).toBe(true);
			await expect(waitForProcessExit(childPid)).resolves.toBe(true);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	}, 10000);

	it('samples memory across spawned child processes', async () => {
		if (process.platform === 'win32') {
			return;
		}

		const pythonCode = `
import subprocess
import sys
import time

child_script = "data = bytearray(64 * 1024 * 1024); time.sleep(10)"
subprocess.Popen([sys.executable, "-c", child_script])
time.sleep(10)
		`.trim();

		const results = await judgeSolution(ExecutionMode.Interprete, {
			code: pythonCode,
			fileSuffix: 'py',
			interpretCmd: 'python3',
			testCases: [{ input: '', timeLimitMs: 3000, memoryLimitMb: 32 }],
		});

		expect(results).toHaveLength(1);
		expect(results[0].succeeded).toBe(false);
		expect(results[0].status).toBe(SubmissionStatus.RUNTIME_ERROR);
		expect(results[0].stderr).toContain('memory limit exceeded');
		expect(results[0].executionMemoryKb).toBeGreaterThan(32 * 1024);
	}, 15000);

	it('normalizes dotted suffixes and honors explicit {source} interpreter placeholders', async () => {
		const pythonCode = `
import pathlib
import sys
print(pathlib.Path(sys.argv[0]).suffix)
		`.trim();

		const results = await judgeSolution(ExecutionMode.Interprete, {
			code: pythonCode,
			fileSuffix: '.py',
			interpretCmd: 'python3 {source}',
			testCases: [''],
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			succeeded: true,
			status: SubmissionStatus.ACCEPTED,
			output: '.py',
			phase: 'run',
			exitCode: 0,
		});
	});

	it('rejects missing interpreter and compiler commands before running child processes', async () => {
		await expect(
			judgeSolution(ExecutionMode.Interprete, {
				code: 'print("x")',
				fileSuffix: 'py',
				testCases: [''],
			})
		).rejects.toMatchObject({
			phase: 'run',
			status: SubmissionStatus.RUNTIME_ERROR,
			message: 'interpretCmd is required for interprete mode.',
		});

		await expect(
			judgeSolution(ExecutionMode.Compiled, {
				code: 'int main() { return 0; }',
				fileSuffix: 'c',
				testCases: [''],
			})
		).rejects.toMatchObject({
			phase: 'compile',
			status: SubmissionStatus.COMPILE_ERROR,
			message: 'compileCmd is required for compiled mode.',
		});
	});
});

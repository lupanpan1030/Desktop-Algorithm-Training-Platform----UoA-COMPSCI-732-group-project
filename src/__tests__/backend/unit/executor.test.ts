import { SubmissionStatus } from '@prisma/client';
import { describe, it, expect } from 'vitest';
import { judgeSolution, ExecutionMode, EXECUTABLE_NAME } from '../../../backend/services/judge/executor';

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
});

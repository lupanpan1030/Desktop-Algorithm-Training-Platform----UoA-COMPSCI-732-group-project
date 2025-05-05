import { describe, it, expect } from 'vitest';
import { judgeSolution, ExecutionMode, EXECUTABLE_NAME } from '../../../backend/services/judge/executor';
import * as os from 'os';
import * as path from 'path';

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
	}, 20000);
});

import { describe, it, expect } from 'vitest';
import { judgeSolution, ExecutionMode } from '../../backend/services/judge/executor';
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
		expect(result.output.trim()).toBe("5");
	});

	// Test for compiled mode using rustc.
	it('should add two ints using Rust compiled executable', async () => {
		const rustCode = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let nums: Vec<i32> = input.split_whitespace()
                              .filter_map(|s| s.parse().ok())
                              .collect();
    if nums.len() >= 2 {
        println!("{}", nums[0] + nums[1]);
    }
}
		`.trim();
		const testCases = ['4 5'];
		// Create a temporary executable path.
		const tempExecutable = path.join(os.tmpdir(), `temp_exec_${Date.now()}`);
		const options = {
			code: rustCode,
			fileSuffix: 'rs',
			compileCmd: `rustc -o ${tempExecutable}`,
			executable: tempExecutable,
			testCases
		};
		const results = await judgeSolution(ExecutionMode.Compiled, options);
		expect(results.length).toBe(1);
		const result = results[0];
		expect(result.succeeded).toBe(true);
		expect(result.output.trim()).toBe("9");
	});
});

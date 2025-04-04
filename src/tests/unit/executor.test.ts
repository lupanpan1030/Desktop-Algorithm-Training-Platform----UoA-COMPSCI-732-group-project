import { describe, it, expect } from 'vitest';
import { judgeSolution, ExecutionMode } from '../../backend/services/judge/executor';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

describe('judgeSolution', () => {

	// Test for interprete mode using python3.
	it('should add two numbers using Python interpreter', async () => {
		// Create a temporary Python file
		const tempPyFile = path.join(os.tmpdir(), `temp_${Date.now()}.py`);
		fs.writeFileSync(
			tempPyFile,
			`
import sys
def main():
    try:
        a, b = map(int, sys.stdin.read().strip().split())
        print(a+b)
    except Exception as e:
        print("error")
if __name__ == '__main__':
    main()
			`.trim()
		);
		const testCases = ['2 3'];
		const options = {
			file: tempPyFile,
			interpretCmd: 'python3',
			testCases
		};
		const results = await judgeSolution(ExecutionMode.Interprete, options);
		// Cleanup temporary file
		fs.unlinkSync(tempPyFile);
		expect(results.length).toBe(1);
		const [success, , output] = results[0];
		expect(success).toBe(true);
		expect(output.trim()).toBe("5");
	});

	// Test for compiled mode using rustc.
	it('should add two ints using Rust compiled executable', async () => {
		// Create a temporary Rust source file and designate an output executable path.
		const tempRsFile = path.join(os.tmpdir(), `temp_${Date.now()}.rs`);
		const tempExecutable = path.join(os.tmpdir(), `temp_exec_${Date.now()}`);
		fs.writeFileSync(
			tempRsFile,
			`
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
			`.trim()
		);
		const testCases = ['4 5'];
		// The compileCmd includes the -o flag to specify the output executable.
		const options = {
			file: tempRsFile,
			compileCmd: `rustc -o ${tempExecutable}`,
			executable: tempExecutable,
			testCases
		};
		const results = await judgeSolution(ExecutionMode.Compiled, options);
		// Cleanup temporary files
		fs.unlinkSync(tempRsFile);
		fs.unlinkSync(tempExecutable);
		expect(results.length).toBe(1);
		const [success, , output] = results[0];
		expect(success).toBe(true);
		expect(output.trim()).toBe("9");
	});
});

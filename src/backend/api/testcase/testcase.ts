// This file defines the types and interfaces used in the testcase API.

export interface TestCase {
  testcaseId: number;
  input: string;
  expectedOutput: string;
  timeLimit: number;
  memoryLimit: number;
}

export class CreateTestCaseParams {
  /**
   * @minLength 1
   */
  input!: string;

    /**
     * @minLength 1
     */
  expectedOutput!: string;

    /**
     * @minimum 1
     * @maximum 10
     */
  timeLimit!: number;

    /**
     * @minimum 16
     * @maximum 1024
     */
  memoryLimit!: number;
}

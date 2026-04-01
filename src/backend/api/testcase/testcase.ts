// This file defines the types and interfaces used in the testcase API.

export interface TestCase {
  testcaseId: number;
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
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
     * @minimum 100
     * @maximum 10000
     */
  timeLimitMs!: number;

    /**
     * @minimum 16
     * @maximum 1024
     */
  memoryLimitMb!: number;
}

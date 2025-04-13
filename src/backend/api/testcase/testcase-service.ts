// This file contains the TestCaseService class, which provides methods to interact with test cases in the database.

import { TestCase } from "./testcase";
import { CreateTestCaseParams } from "./testcase";
import { TestCaseDao } from "./testcase-dao";

export class TestCaseService {
  /**
   * Retrieves the list of test cases for a given problem.
   * @param problemId The ID of the problem.
   */
  public async getTestCases(problemId: number): Promise<TestCase[]> {
    const testcases = await TestCaseDao.getTestCasesByProblem(problemId);
    return testcases.map((tc) => ({
      testcaseId: tc.testcase_id,
      input: tc.input_data,
      expectedOutput: tc.expected_output,
      timeLimit: tc.time_limit,
      memoryLimit: tc.memory_limit,
    }));
  }

  /**
   * Creates a new test case for a given problem.
   * @param problemId The ID of the problem.
   * @param params The test case details.
   */
  public async createTestCase(
    problemId: number,
    params: CreateTestCaseParams
  ): Promise<TestCase> {
    const testcase = await TestCaseDao.createTestCase(problemId, params);
    return {
      testcaseId: testcase.testcase_id,
      input: testcase.input_data,
      expectedOutput: testcase.expected_output,
      timeLimit: testcase.time_limit,
      memoryLimit: testcase.memory_limit,
    };
  }

  /**
   * Deletes a test case by its ID for a given problem.
   * @param problemId The ID of the problem.
   * @param testcaseId The ID of the test case to delete.
   */
  public async deleteTestCase(
    problemId: number,
    testcaseId: number
  ): Promise<void> {
    await TestCaseDao.deleteTestCase(problemId, testcaseId);
  }
}

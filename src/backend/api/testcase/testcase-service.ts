// This file contains the TestCaseService class, which provides methods to interact with test cases in the database.

import { CreateTestCaseParams, TestCase, UpdateTestCaseParams } from "./testcase";
import { TestCaseDao } from "./testcase-dao";
import { ProblemsDao } from "../problem/problem-dao";
import { NotFoundError } from "../../utils/errors/not-found-error";

export class TestCaseService {
  private mapTestCase(tc: {
    testcase_id: number;
    input_data: string;
    expected_output: string;
    time_limit_ms: number;
    memory_limit_mb: number;
    is_sample: boolean;
  }): TestCase {
    return {
      testcaseId: tc.testcase_id,
      input: tc.input_data,
      expectedOutput: tc.expected_output,
      timeLimitMs: tc.time_limit_ms,
      memoryLimitMb: tc.memory_limit_mb,
      isSample: tc.is_sample,
    };
  }

  /**
   * Retrieves the list of test cases for a given problem.
   * @param problemId The ID of the problem.
   */
  public async getTestCases(problemId: number): Promise<TestCase[]> {
    const testcases = await TestCaseDao.getTestCasesByProblem(problemId);
    return testcases.map((tc) => this.mapTestCase(tc));
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
    await ProblemsDao.syncJudgeReadiness(problemId);
    return this.mapTestCase(testcase);
  }

  public async updateTestCase(
    problemId: number,
    testcaseId: number,
    params: UpdateTestCaseParams
  ): Promise<TestCase> {
    const testcase = await TestCaseDao.updateTestCase(problemId, testcaseId, params);
    if (!testcase) {
      throw new NotFoundError("Test case not found");
    }

    await ProblemsDao.syncJudgeReadiness(problemId);
    return this.mapTestCase(testcase);
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
    await ProblemsDao.syncJudgeReadiness(problemId);
  }
}

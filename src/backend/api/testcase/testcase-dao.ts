// This file interacts with the database to perform CRUD operations on test cases.

import { PrismaClient, TestCase } from '@prisma/client';

const prisma = new PrismaClient();

export class TestCaseDao {
  /**
   * Retrieves all test cases for a given problem.
   * @param problemId The problem ID.
   */
  public static async getTestCasesByProblem(problemId: number): Promise<TestCase[]> {
    return prisma.testCase.findMany({
      where: { problem_id: problemId },
    });
  }

  /**
   * Creates a new test case for a given problem.
   * @param problemId The ID of the problem.
   * @param params The test case parameters.
   */
  public static async createTestCase(
    problemId: number,
    params: { input: string; expectedOutput: string; timeLimit: number; memoryLimit: number }
  ): Promise<TestCase> {
    return prisma.testCase.create({
      data: {
        input_data: params.input,
        expected_output: params.expectedOutput,
        time_limit: params.timeLimit,
        memory_limit: params.memoryLimit,
        problem: {
          connect: { problem_id: problemId },
        },
      },
    });
  }

  /**
   * Deletes a test case for a given problem.
   * @param problemId The ID of the problem.
   * @param testcaseId The ID of the test case to delete.
   */
  public static async deleteTestCase(problemId: number, testcaseId: number): Promise<void> {
    // Using deleteMany to ensure the test case belongs to the specified problem
    await prisma.testCase.deleteMany({
      where: {
        testcase_id: testcaseId,
        problem_id: problemId,
      },
    });
  }
}

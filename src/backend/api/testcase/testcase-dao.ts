// This file interacts with the database to perform CRUD operations on test cases.

import type { PrismaClient, TestCase } from '@prisma/client';
import { getPrisma } from '../../db/prisma/prisma';

export class TestCaseDao {
  /**
   * Retrieves all test cases for a given problem.
   * @param problemId The problem ID.
   */
  public static async getTestCasesByProblem(problemId: number): Promise<TestCase[]> {
    const prisma: PrismaClient = getPrisma();
    return prisma.testCase.findMany({
      where: { problem_id: problemId },
      orderBy: [
        { is_sample: 'desc' },
        { testcase_id: 'asc' },
      ],
    });
  }

  /**
   * Creates a new test case for a given problem.
   * @param problemId The ID of the problem.
   * @param params The test case parameters.
   */
  public static async createTestCase(
    problemId: number,
    params: {
      input: string;
      expectedOutput: string;
      timeLimitMs: number;
      memoryLimitMb: number;
      isSample?: boolean;
    }
  ): Promise<TestCase> {
    const prisma: PrismaClient = getPrisma();
    return prisma.testCase.create({
      data: {
        input_data: params.input,
        expected_output: params.expectedOutput,
        time_limit_ms: params.timeLimitMs,
        memory_limit_mb: params.memoryLimitMb,
        is_sample: params.isSample ?? false,
        problem: {
          connect: { problem_id: problemId },
        },
      },
    });
  }

  public static async updateTestCase(
    problemId: number,
    testcaseId: number,
    params: {
      input?: string;
      expectedOutput?: string;
      timeLimitMs?: number;
      memoryLimitMb?: number;
      isSample?: boolean;
    }
  ): Promise<TestCase | null> {
    const prisma: PrismaClient = getPrisma();
    const existing = await prisma.testCase.findFirst({
      where: {
        testcase_id: testcaseId,
        problem_id: problemId,
      },
    });

    if (!existing) {
      return null;
    }

    return prisma.testCase.update({
      where: {
        testcase_id: testcaseId,
      },
      data: {
        input_data: params.input,
        expected_output: params.expectedOutput,
        time_limit_ms: params.timeLimitMs,
        memory_limit_mb: params.memoryLimitMb,
        is_sample: params.isSample,
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
    const prisma: PrismaClient = getPrisma();
    await prisma.testCase.deleteMany({
      where: {
        testcase_id: testcaseId,
        problem_id: problemId,
      },
    });
  }
}

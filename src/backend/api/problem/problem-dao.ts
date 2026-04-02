// This file interacts with the database to perform CRUD operations on problems.

import { Difficulty } from "@prisma/client";
import { ProblemWithCounts, ProblemWithStatuses } from "./problem";
import { getPrisma } from "../../db/prisma/prisma";


export class ProblemsDao {
  /** Always returns the current Prisma Client (allows tests to inject). */
  private static get db() {
    return getPrisma();
  }

  /**
   * Retrieves all problems including their associated tags.
   */
  public static async getAllProblems(): Promise<ProblemWithStatuses[]> {
    return this.db.problem.findMany({
      include: {
        submissions: {
          select: { status: true },
        },
        _count: {
          select: {
            test_cases: true,
          },
        },
      },
      orderBy: { problem_id: 'asc' },
    });
  }

  /**
   * Retrieves a single problem by its ID including its tags.
   * @param problemId The ID of the problem.
   */
  public static async getProblemById(
    problemId: number
  ): Promise<ProblemWithCounts | null> {
    return this.db.problem.findUnique({
      where: {
        problem_id: problemId,
      },
      include: {
        _count: {
          select: {
            test_cases: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new problem.
   * @param params The parameters for creating the problem.
   */
  public static async createProblem(params: {
    title: string;
    description: string;
    difficulty: Difficulty;
  }): Promise<ProblemWithCounts> {
    return this.db.problem.create({
      data: {
        title: params.title,
        description: params.description,
        difficulty: params.difficulty,
        judge_ready: false,
      },
      include: {
        _count: {
          select: {
            test_cases: true,
          },
        },
      },
    });
  }

  /**
   * Updates an existing problem.
   * @param problemId The ID of the problem to update.
   * @param params The fields to update.
   */
  public static async updateProblem(
    problemId: number,
    params: {
      title?: string;
      description?: string;
      difficulty?: Difficulty;
    }
  ): Promise<ProblemWithCounts | null> {
    try {
      return await this.db.problem.update({
        where: { problem_id: problemId },
        data: {
          title: params.title,
          description: params.description,
          difficulty: params.difficulty,
        },
        include: {
          _count: {
            select: {
              test_cases: true,
            },
          },
        },
      });
    } catch (error) {
      return null; // Return null if the problem is not found
    }
  }

  /**
   * Deletes a problem.
   * @param problemId The ID of the problem to delete.
   */
  public static async deleteProblem(problemId: number): Promise<void> {
    try {
      await this.db.problem.delete({
        where: { problem_id: problemId },
      });
    } catch (error) {
      // Do nothing because a not existing problem does not need to be deleted
      return;
    }
  }

  public static async syncJudgeReadiness(problemId: number): Promise<void> {
    const testcaseCount = await this.db.testCase.count({
      where: {
        problem_id: problemId,
      },
    });

    await this.db.problem.updateMany({
      where: { problem_id: problemId },
      data: {
        judge_ready: testcaseCount > 0,
      },
    });
  }
}

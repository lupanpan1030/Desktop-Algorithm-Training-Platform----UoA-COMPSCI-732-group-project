// This file interacts with the database to perform CRUD operations on problems.

import { PrismaClient, Problem, Difficulty, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class ProblemsDao {
  /**
   * Retrieves all problems including their associated tags.
   */
  public static async getAllProblems(): Promise<Problem[]> {
    return prisma.problem.findMany();
  }

  /**
   * Retrieves a single problem by its ID including its tags.
   * @param problemId The ID of the problem.
   */
  public static async getProblemById(
    problemId: number
  ): Promise<Problem | null> {
    return prisma.problem.findUnique({
      where: {
        problem_id: problemId,
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
  }): Promise<Problem> {
    return prisma.problem.create({
      data: {
        title: params.title,
        description: params.description,
        difficulty: params.difficulty,
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
  ): Promise<Problem | null> {
    try {
      return await prisma.problem.update({
        where: { problem_id: problemId },
        data: {
          title: params.title,
          description: params.description,
          difficulty: params.difficulty,
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
      await prisma.problem.delete({
        where: { problem_id: problemId },
      });
    } catch (error) {
      // Do nothing because a not existing problem does not need to be deleted
      return;
    }
  }
}

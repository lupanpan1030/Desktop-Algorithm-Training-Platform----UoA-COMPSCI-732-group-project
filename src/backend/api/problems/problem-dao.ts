// problem-dao.ts
import { PrismaClient, Problem, Difficulty as PrismaDifficulty } from '@prisma/client';

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
  public static async getProblemById(problemId: number): Promise<Problem | null> {
    return prisma.problem.findUnique({
      where: {
        problem_id: problemId,
      },
    });
  }
}

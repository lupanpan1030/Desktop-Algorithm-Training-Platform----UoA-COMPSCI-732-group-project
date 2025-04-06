// problem.ts
import { ProblemsDao } from "./problem-dao";
import { Difficulty } from '@prisma/client';

// Summary view of a problem (for listing purposes)
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: Difficulty;
}

// Detailed view of a problem (for getting a single problem's details)
export interface ProblemDetails extends ProblemSummary {
  description: string;
  createdAt: string; // ISO8601 format
}


export class ProblemsService {
  /**
   * Retrieves a list of all problems with summary information.
   */
  public async getAllProblems(): Promise<ProblemSummary[]> {
    const problems = await ProblemsDao.getAllProblems();
    return problems.map(problem => ({
      problemId: problem.problem_id,
      title: problem.title,
      difficulty: problem.difficulty,
    }));
  }

  /**
   * Retrieves the detailed information of a problem by its ID.
   * @param problemId The ID of the problem.
   */
  public async getProblem(problemId: number): Promise<ProblemDetails> {
    const problem = await ProblemsDao.getProblemById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }
    return {
      problemId: problem.problem_id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      createdAt: problem.created_at.toISOString(),
    };
  }


}

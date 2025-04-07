// This file contains the ProblemsService class, which provides methods to interact with problems in the database.

import { ProblemsDao } from "./problem-dao";
import {
  ProblemSummary,
  ProblemDetails,
  CreateProblemParams,
  UpdateProblemParams,
} from "./problem";
import { NotFoundError } from "../../utils/errors/not-found-error";

export class ProblemsService {
  /**
   * Retrieves a list of all problems with summary information.
   */
  public async getAllProblems(): Promise<ProblemSummary[]> {
    const problems = await ProblemsDao.getAllProblems();
    return problems.map((problem) => ({
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
      throw new NotFoundError("Problem not found");
    }
    return {
      problemId: problem.problem_id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      createdAt: problem.created_at.toISOString(),
    };
  }

  /**
   * Creates a new problem and returns its detailed information.
   * @param params The parameters for creating the problem.
   */
  public async createProblem(
    params: CreateProblemParams
  ): Promise<ProblemDetails> {
    console.log("createProblem");
    const problem = await ProblemsDao.createProblem(params);
    return {
      problemId: problem.problem_id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      createdAt: problem.created_at.toISOString(),
    };
  }

  /**
   * Updates an existing problem and returns the updated details.
   * @param problemId The ID of the problem to update.
   * @param params The update parameters (all optional).
   */
  public async updateProblem(
    problemId: number,
    params: UpdateProblemParams
  ): Promise<ProblemDetails> {
    const problem = await ProblemsDao.updateProblem(problemId, params);
    if (!problem) {
      throw new NotFoundError("Problem not found");
    }
    return {
      problemId: problem.problem_id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      createdAt: problem.created_at.toISOString(),
    };
  }

  /**
   * Deletes a problem by its ID and returns (204 No Content).
   * @param problemId The ID of the problem to delete.
   */
  public async deleteProblem(problemId: number): Promise<void> {
    await ProblemsDao.deleteProblem(problemId);
  }
}

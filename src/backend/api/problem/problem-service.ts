// This file contains the ProblemsService class, which provides methods to interact with problems in the database.

import { ProblemsDao } from "./problem-dao";
import {
  ProblemSummary,
  ProblemDetails,
  CompletionState,
  CreateProblemParams,
  UpdateProblemParams,
  ProblemWithCounts,
} from "./problem";
import type { SubmissionStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors/not-found-error";
import {
  DEFAULT_PROBLEM_LOCALE,
  listAvailableProblemLocales,
  normalizeProblemLocale,
  resolveProblemLocalization,
} from "../../db/problem-catalog/problem-localization";

const deriveState = (statuses: SubmissionStatus[]): CompletionState => {
  if (statuses.some(s => s === 'ACCEPTED')) return 'Completed';
  if (statuses.length > 0) return 'Attempted';
  return 'Unattempted';
};

export class ProblemsService {
  private ensureLocaleAvailable(
    availableLocales: string[],
    preferredLocale?: string | null,
    strictLocale = false
  ) {
    if (!strictLocale || !preferredLocale) {
      return;
    }

    const normalizedLocale = normalizeProblemLocale(preferredLocale);
    if (!availableLocales.includes(normalizedLocale)) {
      throw new NotFoundError("Problem not available in the requested locale");
    }
  }

  private mapProblemDetails(
    problem: ProblemWithCounts,
    preferredLocale = DEFAULT_PROBLEM_LOCALE,
    strictLocale = false
  ): ProblemDetails {
    const selectedLocalization = resolveProblemLocalization(problem, preferredLocale);
    const availableLocales = listAvailableProblemLocales(problem);
    this.ensureLocaleAvailable(availableLocales, preferredLocale, strictLocale);

    return {
      problemId: problem.problem_id,
      title: selectedLocalization.title,
      description: selectedLocalization.description,
      difficulty: problem.difficulty,
      createdAt: problem.created_at.toISOString(),
      source: problem.source,
      locale: selectedLocalization.locale,
      defaultLocale: normalizeProblemLocale(problem.locale),
      availableLocales,
      sourceSlug: problem.source_slug,
      externalProblemId: problem.external_problem_id,
      judgeReady: problem.judge_ready,
      testcaseCount: problem._count.test_cases,
      sampleTestcase: problem.sample_testcase,
    };
  }

  /**
   * Retrieves a list of all problems with summary information.
   */
  public async getAllProblems(
    preferredLocale = DEFAULT_PROBLEM_LOCALE,
    strictLocale = false
  ): Promise<ProblemSummary[]> {
    const problems = await ProblemsDao.getAllProblems();
    const normalizedLocale = normalizeProblemLocale(preferredLocale);

    return problems
      .filter((problem) => {
        if (!strictLocale) {
          return true;
        }

        return listAvailableProblemLocales(problem).includes(normalizedLocale);
      })
      .map((problem) => {
      const selectedLocalization = resolveProblemLocalization(problem, preferredLocale);

      return {
      problemId: problem.problem_id,
      title: selectedLocalization.title,
      difficulty: problem.difficulty,
      completionState: deriveState(
        problem.submissions.map((s) => s.status)
      ),
      source: problem.source,
      locale: selectedLocalization.locale,
      defaultLocale: normalizeProblemLocale(problem.locale),
      availableLocales: listAvailableProblemLocales(problem),
      sourceSlug: problem.source_slug,
      externalProblemId: problem.external_problem_id,
      judgeReady: problem.judge_ready,
      testcaseCount: problem._count.test_cases,
    };
    });
  }

  /**
   * Retrieves the detailed information of a problem by its ID.
   * @param problemId The ID of the problem.
   */
  public async getProblem(
    problemId: number,
    preferredLocale = DEFAULT_PROBLEM_LOCALE,
    strictLocale = false
  ): Promise<ProblemDetails> {
    const problem = await ProblemsDao.getProblemById(problemId);
    if (!problem) {
      throw new NotFoundError("Problem not found");
    }
    return this.mapProblemDetails(problem, preferredLocale, strictLocale);
  }

  /**
   * Creates a new problem and returns its detailed information.
   * @param params The parameters for creating the problem.
   */
  public async createProblem(
    params: CreateProblemParams
  ): Promise<ProblemDetails> {
    const problem = await ProblemsDao.createProblem(params);
    return this.mapProblemDetails(problem, params.locale);
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
    return this.mapProblemDetails(problem, params.locale);
  }

  /**
   * Deletes a problem by its ID and returns (204 No Content).
   * @param problemId The ID of the problem to delete.
   */
  public async deleteProblem(problemId: number): Promise<void> {
    await ProblemsDao.deleteProblem(problemId);
  }
}

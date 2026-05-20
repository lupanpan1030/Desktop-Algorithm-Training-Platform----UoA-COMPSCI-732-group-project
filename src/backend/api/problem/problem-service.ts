// This file contains the ProblemsService class, which provides methods to interact with problems in the database.

import { ProblemsDao } from "./problem-dao";
import {
  ProblemSummary,
  ProblemDetails,
  CompletionState,
  CreateProblemParams,
  UpdateProblemParams,
  ProblemWithCounts,
  ProblemWithStatuses,
  ProblemReadinessStatus,
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

const summarizeTestcases = (
  problem: Pick<ProblemWithCounts, "test_cases"> | Pick<ProblemWithStatuses, "test_cases">
) => {
  const sampleCaseCount = problem.test_cases.filter(
    (testCase: { is_sample: boolean }) => testCase.is_sample
  ).length;
  const unreviewedCaseCount = problem.test_cases.filter(
    (testCase: { review_status: string }) => testCase.review_status === "NEEDS_REVIEW"
  ).length;
  return {
    sampleCaseCount,
    hiddenCaseCount: problem.test_cases.length - sampleCaseCount,
    unreviewedCaseCount,
  };
};

function summarizeReadiness(input: {
  sampleCaseCount: number;
  hiddenCaseCount: number;
  unreviewedCaseCount: number;
  sampleReferenceAvailable: boolean;
}): {
  status: ProblemReadinessStatus;
  label: string;
  reason: string;
  canRunSample: boolean;
  canSubmit: boolean;
} {
  if (input.hiddenCaseCount > 0 && input.unreviewedCaseCount === 0) {
    return {
      status: "REVIEWED",
      label: "Reviewed",
      reason: "Sample and hidden testcase coverage is present and all saved cases are reviewed.",
      canRunSample: input.sampleCaseCount > 0,
      canSubmit: true,
    };
  }

  if (input.hiddenCaseCount > 0) {
    return {
      status: "SUBMIT_READY",
      label: "Submit ready",
      reason: "Hidden testcase coverage is present, but at least one saved case still needs review.",
      canRunSample: input.sampleCaseCount > 0,
      canSubmit: true,
    };
  }

  if (input.sampleCaseCount > 0) {
    return {
      status: "SAMPLE_RUNNABLE",
      label: "Sample runnable",
      reason: "Sample testcase coverage is present, so Run can execute examples, but Submit still lacks hidden coverage.",
      canRunSample: true,
      canSubmit: false,
    };
  }

  if (input.sampleReferenceAvailable) {
    return {
      status: "SAMPLE_REFERENCE",
      label: "Sample reference",
      reason: "Imported sample text is available but has not been converted into runnable testcases.",
      canRunSample: false,
      canSubmit: false,
    };
  }

  return {
    status: "STATEMENT_ONLY",
    label: "Statement only",
    reason: "Only the problem statement and metadata are available.",
    canRunSample: false,
    canSubmit: false,
  };
}

const listProblemTags = (
  problem: Pick<ProblemWithCounts, "problem_tags"> | Pick<ProblemWithStatuses, "problem_tags">
) : string[] =>
  [...new Set(problem.problem_tags.map((problemTag) => problemTag.tag.name))]
    .sort((left: string, right: string) => left.localeCompare(right));

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
    const { sampleCaseCount, hiddenCaseCount, unreviewedCaseCount } = summarizeTestcases(problem);
    const readiness = summarizeReadiness({
      sampleCaseCount,
      hiddenCaseCount,
      unreviewedCaseCount,
      sampleReferenceAvailable: Boolean(problem.sample_testcase),
    });
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
      judgeReady: readiness.canSubmit,
      readinessStatus: readiness.status,
      readinessLabel: readiness.label,
      readinessReason: readiness.reason,
      canRunSample: readiness.canRunSample,
      canSubmit: readiness.canSubmit,
      testcaseCount: problem._count.test_cases,
      sampleReferenceAvailable: Boolean(problem.sample_testcase),
      sampleTestcase: problem.sample_testcase,
      sampleCaseCount,
      hiddenCaseCount,
      unreviewedCaseCount,
      tags: listProblemTags(problem),
      starterCodes: problem.starter_codes
        .map((starterCode) => ({
          languageSlug: starterCode.language_slug,
          languageName: starterCode.language_name,
          template: starterCode.template,
        }))
        .sort((left, right) => left.languageName.localeCompare(right.languageName)),
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
      const { sampleCaseCount, hiddenCaseCount, unreviewedCaseCount } = summarizeTestcases(problem);
      const readiness = summarizeReadiness({
        sampleCaseCount,
        hiddenCaseCount,
        unreviewedCaseCount,
        sampleReferenceAvailable: Boolean(problem.sample_testcase),
      });

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
      judgeReady: readiness.canSubmit,
      readinessStatus: readiness.status,
      readinessLabel: readiness.label,
      readinessReason: readiness.reason,
      canRunSample: readiness.canRunSample,
      canSubmit: readiness.canSubmit,
      testcaseCount: problem._count.test_cases,
      sampleCaseCount,
      hiddenCaseCount,
      unreviewedCaseCount,
      sampleReferenceAvailable: Boolean(problem.sample_testcase),
      tags: listProblemTags(problem),
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

// This file interacts with the database to perform CRUD operations on problems.

import { Difficulty } from "@prisma/client";
import { ProblemWithCounts, ProblemWithStatuses } from "./problem";
import { getPrisma } from "../../db/prisma/prisma";
import {
  normalizeProblemLocale,
  syncProblemPrimaryLocalization,
  upsertProblemTranslation,
} from "../../db/problem-catalog/problem-localization";


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
        translations: {
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
        test_cases: {
          select: {
            is_sample: true,
          },
        },
        problem_tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
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
        translations: {
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
        test_cases: {
          select: {
            is_sample: true,
          },
        },
        problem_tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        starter_codes: {
          select: {
            language_slug: true,
            language_name: true,
            template: true,
          },
        },
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
    locale?: string;
  }): Promise<ProblemWithCounts> {
    const locale = normalizeProblemLocale(params.locale);

    const created = await this.db.problem.create({
      data: {
        title: params.title,
        description: params.description,
        difficulty: params.difficulty,
        judge_ready: false,
        locale,
        translations: {
          create: {
            locale,
            title: params.title,
            description: params.description,
          },
        },
      },
      select: {
        problem_id: true,
      },
    });

    await syncProblemPrimaryLocalization(this.db, created.problem_id);
    return (await this.getProblemById(created.problem_id)) as ProblemWithCounts;
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
      locale?: string;
    }
  ): Promise<ProblemWithCounts | null> {
    try {
      const targetProblem = await this.db.problem.findUnique({
        where: { problem_id: problemId },
        select: {
          problem_id: true,
          locale: true,
          title: true,
          description: true,
          translations: {
            select: {
              locale: true,
              title: true,
              description: true,
            },
          },
        },
      });

      if (!targetProblem) {
        return null;
      }

      const locale = normalizeProblemLocale(params.locale ?? targetProblem.locale);
      const currentTranslation =
        locale === targetProblem.locale
          ? {
              locale: targetProblem.locale,
              title: targetProblem.title,
              description: targetProblem.description,
            }
          : targetProblem.translations.find(
              (translation) => translation.locale === locale
            ) ?? null;

      await this.db.problem.update({
        where: { problem_id: problemId },
        data: {
          difficulty: params.difficulty,
          ...(locale === targetProblem.locale
            ? {
                title: params.title,
                description: params.description,
              }
            : {}),
        },
      });

      await upsertProblemTranslation(this.db, problemId, {
        locale,
        title: params.title ?? currentTranslation?.title ?? targetProblem.title,
        description:
          params.description ??
          currentTranslation?.description ??
          targetProblem.description,
      });

      await syncProblemPrimaryLocalization(this.db, problemId);
      return await this.getProblemById(problemId);
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

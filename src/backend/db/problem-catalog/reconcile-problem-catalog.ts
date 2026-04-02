import type { Prisma, PrismaClient } from "@prisma/client";
import { getPrisma } from "../prisma/prisma";
import { seedProblemIdentities } from "./seed-problem-identities";

type DbClient = PrismaClient | Prisma.TransactionClient;

type ProblemIdentityRow = {
  problem_id: number;
  title: string;
  source: string;
  locale: string;
  source_slug: string | null;
  external_problem_id: string | null;
  import_key: string | null;
  sample_testcase: string | null;
  judge_ready: boolean;
};

function chooseCanonicalProblem(problems: ProblemIdentityRow[]) {
  return [...problems].sort((left, right) => {
    const score = (problem: ProblemIdentityRow) => {
      let total = 0;

      if (problem.locale === "zh-CN") {
        total += 8;
      }
      if (problem.import_key) {
        total += 4;
      }
      if (problem.judge_ready) {
        total += 2;
      }
      if (problem.source === "LEETCODE") {
        total += 1;
      }

      return total;
    };

    const scoreDelta = score(right) - score(left);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return left.problem_id - right.problem_id;
  })[0];
}

async function backfillSeedProblemIdentities(db: DbClient) {
  for (const identity of seedProblemIdentities) {
    await db.problem.updateMany({
      where: {
        problem_id: identity.problemId,
      },
      data: {
        source: "LEETCODE",
        locale: "en",
        source_slug: identity.sourceSlug,
        external_problem_id: identity.externalProblemId,
      },
    });
  }
}

async function moveProblemTags(
  db: DbClient,
  fromProblemId: number,
  toProblemId: number
) {
  const rows = await db.problemTag.findMany({
    where: {
      problem_id: fromProblemId,
    },
  });

  for (const row of rows) {
    await db.problemTag.upsert({
      where: {
        problem_id_tag_id: {
          problem_id: toProblemId,
          tag_id: row.tag_id,
        },
      },
      create: {
        problem_id: toProblemId,
        tag_id: row.tag_id,
      },
      update: {},
    });
  }
}

async function moveStarterCodes(
  db: DbClient,
  fromProblemId: number,
  toProblemId: number
) {
  const rows = await db.problemStarterCode.findMany({
    where: {
      problem_id: fromProblemId,
    },
  });

  for (const row of rows) {
    await db.problemStarterCode.upsert({
      where: {
        problem_id_language_slug: {
          problem_id: toProblemId,
          language_slug: row.language_slug,
        },
      },
      create: {
        problem_id: toProblemId,
        language_slug: row.language_slug,
        language_name: row.language_name,
        template: row.template,
      },
      update: {},
    });
  }
}

async function mergeDuplicateProblemGroup(
  db: DbClient,
  problems: ProblemIdentityRow[]
) {
  if (problems.length <= 1) {
    return { merged: 0, canonicalProblemId: problems[0]?.problem_id ?? null };
  }

  const canonical = chooseCanonicalProblem(problems);
  const duplicates = problems.filter(
    (problem) => problem.problem_id !== canonical.problem_id
  );

  for (const duplicate of duplicates) {
    await moveProblemTags(db, duplicate.problem_id, canonical.problem_id);
    await moveStarterCodes(db, duplicate.problem_id, canonical.problem_id);

    await db.testCase.updateMany({
      where: {
        problem_id: duplicate.problem_id,
      },
      data: {
        problem_id: canonical.problem_id,
      },
    });

    await db.submission.updateMany({
      where: {
        problem_id: duplicate.problem_id,
      },
      data: {
        problem_id: canonical.problem_id,
      },
    });

    if (!canonical.sample_testcase && duplicate.sample_testcase) {
      await db.problem.update({
        where: {
          problem_id: canonical.problem_id,
        },
        data: {
          sample_testcase: duplicate.sample_testcase,
        },
      });
    }

    await db.problem.delete({
      where: {
        problem_id: duplicate.problem_id,
      },
    });
  }

  return {
    merged: duplicates.length,
    canonicalProblemId: canonical.problem_id,
  };
}

export async function reconcileProblemCatalog(
  prisma: PrismaClient = getPrisma()
) {
  await backfillSeedProblemIdentities(prisma);

  const knownProblems = await prisma.problem.findMany({
    where: {
      OR: [
        {
          external_problem_id: {
            not: null,
          },
        },
        {
          source_slug: {
            not: null,
          },
        },
      ],
    },
    select: {
      problem_id: true,
      title: true,
      source: true,
      locale: true,
      source_slug: true,
      external_problem_id: true,
      import_key: true,
      sample_testcase: true,
      judge_ready: true,
    },
  });

  const groupedProblems = new Map<string, ProblemIdentityRow[]>();

  for (const problem of knownProblems) {
    const groupKey = problem.external_problem_id
      ? `external:${problem.external_problem_id}`
      : `slug:${problem.source_slug}`;

    if (!groupedProblems.has(groupKey)) {
      groupedProblems.set(groupKey, []);
    }

    groupedProblems.get(groupKey)?.push(problem);
  }

  let mergedProblems = 0;

  for (const problems of groupedProblems.values()) {
    const result = await prisma.$transaction(async (tx) => {
      return mergeDuplicateProblemGroup(tx, problems);
    });

    mergedProblems += result.merged;

    if (result.canonicalProblemId != null) {
      const testcaseCount = await prisma.testCase.count({
        where: {
          problem_id: result.canonicalProblemId,
        },
      });

      await prisma.problem.updateMany({
        where: {
          problem_id: result.canonicalProblemId,
        },
        data: {
          judge_ready: testcaseCount > 0,
        },
      });
    }
  }

  return {
    mergedProblems,
  };
}

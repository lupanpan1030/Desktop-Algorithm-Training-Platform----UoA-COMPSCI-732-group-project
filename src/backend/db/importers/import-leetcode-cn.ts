import "dotenv/config";
import fs from "fs/promises";
import { Prisma, PrismaClient } from "@prisma/client";
import { initializeDatabase } from "../prisma/initialize-database";
import { toSqliteFileUrl } from "../prisma/bootstrap-sqlite";
import {
  syncProblemPrimaryLocalization,
  upsertProblemTranslation,
} from "../problem-catalog/problem-localization";
import { reconcileProblemCatalog } from "../problem-catalog/reconcile-problem-catalog";
import {
  getImportUsage,
  loadLeetCodeCnProblems,
  parseImportCliArgs,
  type NormalizedImportedProblem,
} from "./leetcode-cn-importer";

function formatPreview(problem: NormalizedImportedProblem) {
  const label = problem.externalProblemId
    ? `#${problem.externalProblemId} ${problem.title}`
    : problem.title;
  return `${label} (${problem.difficulty})`;
}

function buildProblemMatchConditions(problem: NormalizedImportedProblem) {
  const legacyImportKeys = problem.translations.map(
    (translation) => `${problem.source}:${translation.locale}:${problem.sourceSlug}`
  );
  const conditions: Prisma.ProblemWhereInput[] = [
    {
      import_key: problem.importKey,
    },
    {
      import_key: {
        in: legacyImportKeys,
      },
    },
    {
      source_slug: problem.sourceSlug,
    },
  ];

  if (problem.externalProblemId) {
    conditions.push({
      external_problem_id: problem.externalProblemId,
    });
  }

  return conditions;
}

function isExistingMatch(
  problem: NormalizedImportedProblem,
  existingProblem: {
    import_key: string | null;
    source_slug: string | null;
    external_problem_id: string | null;
  }
) {
  const legacyImportKeys = problem.translations.map(
    (translation) => `${problem.source}:${translation.locale}:${problem.sourceSlug}`
  );

  return (
    existingProblem.import_key === problem.importKey ||
    legacyImportKeys.includes(existingProblem.import_key ?? "") ||
    existingProblem.source_slug === problem.sourceSlug ||
    (problem.externalProblemId != null &&
      existingProblem.external_problem_id === problem.externalProblemId)
  );
}

async function main() {
  const options = parseImportCliArgs(process.argv.slice(2));

  if (options.help) {
    console.log(getImportUsage());
    return;
  }

  await fs.access(options.sourcePath);

  if (options.databasePath) {
    process.env.DATABASE_URL = toSqliteFileUrl(options.databasePath);
  }

  await initializeDatabase();

  const prisma = new PrismaClient();

  try {
    await reconcileProblemCatalog(prisma);

    const { problems, stats } = await loadLeetCodeCnProblems(options.sourcePath);
    const selectedProblems = options.limit ? problems.slice(0, options.limit) : problems;

    if (selectedProblems.length === 0) {
      console.log("No importable LeetCode CN problems were found.");
      return;
    }

    const importKeys = selectedProblems.map((problem) => problem.importKey);
    const sourceSlugs = [...new Set(selectedProblems.map((problem) => problem.sourceSlug))];
    const externalProblemIds = [
      ...new Set(
        selectedProblems
          .map((problem) => problem.externalProblemId)
          .filter((value): value is string => Boolean(value))
      ),
    ];
    const tagNames = [...new Set(selectedProblems.flatMap((problem) => problem.tags.map((tag) => tag.name)))];

    const [existingProblems, existingTags] = await Promise.all([
      prisma.problem.findMany({
        where: {
          OR: [
            {
              import_key: { in: importKeys },
            },
            {
              source_slug: { in: sourceSlugs },
            },
            ...(externalProblemIds.length > 0
              ? [
                  {
                    external_problem_id: { in: externalProblemIds },
                  },
                ]
              : []),
          ],
        },
        select: {
          import_key: true,
          source_slug: true,
          external_problem_id: true,
        },
      }),
      tagNames.length > 0
        ? prisma.tag.findMany({
            where: {
              name: { in: tagNames },
            },
            select: {
              name: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const matchedExistingProblems = selectedProblems.filter((problem) =>
      existingProblems.some((existingProblem) => isExistingMatch(problem, existingProblem))
    );
    const existingTagNames = new Set(existingTags.map((tag) => tag.name));
    const createCount = selectedProblems.length - matchedExistingProblems.length;
    const updateCount = selectedProblems.length - createCount;
    const newTagCount = tagNames.filter((tagName) => !existingTagNames.has(tagName)).length;
    const starterCodeCount = selectedProblems.reduce(
      (count, problem) => count + problem.starterCodes.length,
      0
    );

    console.log(`Scanned ${stats.scannedFiles} files from ${options.sourcePath}`);
    console.log(
      `Normalized ${stats.importedCandidates} problems, skipped ${stats.skippedMissingContent} without usable content and ${stats.skippedInvalidPayload} invalid payloads.`
    );
    console.log(
      `${options.dryRun ? "Would import" : "Importing"} ${selectedProblems.length} problems (${createCount} new, ${updateCount} existing updates).`
    );
    console.log(
      `${options.dryRun ? "Would touch" : "Touching"} ${tagNames.length} tags (${newTagCount} new) and ${starterCodeCount} starter-code snippets.`
    );

    if (options.verbose) {
      console.log("Preview:");
      selectedProblems.slice(0, 10).forEach((problem) => {
        console.log(`- ${formatPreview(problem)} from ${problem.sourceFile}`);
      });
    }

    if (options.dryRun) {
      return;
    }

    for (const tagName of tagNames) {
      await prisma.tag.upsert({
        where: {
          name: tagName,
        },
        create: {
          name: tagName,
        },
        update: {},
      });
    }

    const tagRows = tagNames.length > 0
      ? await prisma.tag.findMany({
          where: {
            name: { in: tagNames },
          },
          select: {
            tag_id: true,
            name: true,
          },
        })
      : [];
    const tagIdByName = new Map(tagRows.map((tag) => [tag.name, tag.tag_id]));

    for (const problem of selectedProblems) {
      await prisma.$transaction(async (tx) => {
        const matchedProblem = await tx.problem.findFirst({
          where: {
            OR: buildProblemMatchConditions(problem),
          },
        });

        const savedProblem = matchedProblem
          ? await tx.problem.update({
              where: {
                problem_id: matchedProblem.problem_id,
              },
              data: {
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                source: problem.source,
                source_slug: problem.sourceSlug,
                external_problem_id: problem.externalProblemId,
                import_key: problem.importKey,
                locale: problem.locale,
                sample_testcase: problem.sampleTestcase,
              },
            })
          : await tx.problem.create({
              data: {
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                source: problem.source,
                source_slug: problem.sourceSlug,
                external_problem_id: problem.externalProblemId,
                import_key: problem.importKey,
                locale: problem.locale,
                judge_ready: false,
                sample_testcase: problem.sampleTestcase,
              },
            });

        for (const translation of problem.translations) {
          await upsertProblemTranslation(tx, savedProblem.problem_id, translation);
        }

        await syncProblemPrimaryLocalization(tx, savedProblem.problem_id);

        for (const snippet of problem.starterCodes) {
          await tx.problemStarterCode.upsert({
            where: {
              problem_id_language_slug: {
                problem_id: savedProblem.problem_id,
                language_slug: snippet.languageSlug,
              },
            },
            create: {
              problem_id: savedProblem.problem_id,
              language_slug: snippet.languageSlug,
              language_name: snippet.languageName,
              template: snippet.template,
            },
            update: {
              language_name: snippet.languageName,
              template: snippet.template,
            },
          });
        }

        for (const tag of problem.tags) {
          const tagId = tagIdByName.get(tag.name);
          if (!tagId) {
            continue;
          }

          await tx.problemTag.upsert({
            where: {
              problem_id_tag_id: {
                problem_id: savedProblem.problem_id,
                tag_id: tagId,
              },
            },
            create: {
              problem_id: savedProblem.problem_id,
              tag_id: tagId,
            },
            update: {},
          });
        }
      });
    }

    const reconciliation = await reconcileProblemCatalog(prisma);

    console.log(
      `Import complete. ${selectedProblems.length} problems are now available in the local database.`
    );
    if (reconciliation.mergedProblems > 0) {
      console.log(
        `Merged ${reconciliation.mergedProblems} duplicate localized problem entries after import.`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to import LeetCode CN problems:", error);
  process.exit(1);
});

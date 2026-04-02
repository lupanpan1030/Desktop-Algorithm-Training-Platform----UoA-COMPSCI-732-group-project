import "dotenv/config";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";
import { initializeDatabase } from "../prisma/initialize-database";
import { toSqliteFileUrl } from "../prisma/bootstrap-sqlite";
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
    const { problems, stats } = await loadLeetCodeCnProblems(options.sourcePath);
    const selectedProblems = options.limit ? problems.slice(0, options.limit) : problems;

    if (selectedProblems.length === 0) {
      console.log("No importable LeetCode CN problems were found.");
      return;
    }

    const importKeys = selectedProblems.map((problem) => problem.importKey);
    const tagNames = [...new Set(selectedProblems.flatMap((problem) => problem.tags.map((tag) => tag.name)))];

    const [existingProblems, existingTags] = await Promise.all([
      prisma.problem.findMany({
        where: {
          import_key: { in: importKeys },
        },
        select: {
          import_key: true,
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

    const existingProblemKeys = new Set(existingProblems.map((problem) => problem.import_key).filter(Boolean));
    const existingTagNames = new Set(existingTags.map((tag) => tag.name));
    const createCount = selectedProblems.filter((problem) => !existingProblemKeys.has(problem.importKey)).length;
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
        const savedProblem = await tx.problem.upsert({
          where: {
            import_key: problem.importKey,
          },
          create: {
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
          update: {
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            source: problem.source,
            source_slug: problem.sourceSlug,
            external_problem_id: problem.externalProblemId,
            locale: problem.locale,
            sample_testcase: problem.sampleTestcase,
          },
        });

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

    console.log(`Import complete. ${selectedProblems.length} problems are now available in the local database.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to import LeetCode CN problems:", error);
  process.exit(1);
});

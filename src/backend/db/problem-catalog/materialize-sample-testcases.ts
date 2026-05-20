import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { initializeDatabase } from "../prisma/initialize-database";
import {
  dedupeSampleTestcases,
  extractSampleTestcasesFromText,
} from "./sample-testcase-extraction";

type CliOptions = {
  dryRun: boolean;
  limit?: number;
  source?: string;
  verbose: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    verbose: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--limit":
        options.limit = Number.parseInt(argv[index + 1] ?? "", 10);
        index += 1;
        break;
      case "--source":
        options.source = argv[index + 1];
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit <= 0)) {
    throw new Error("--limit must be a positive integer.");
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await initializeDatabase();

  const prisma = new PrismaClient();
  try {
    const problems = await prisma.problem.findMany({
      where: options.source
        ? {
            source: options.source,
          }
        : undefined,
      include: {
        translations: {
          select: {
            locale: true,
            description: true,
          },
        },
        test_cases: {
          select: {
            input_data: true,
            expected_output: true,
            is_sample: true,
          },
        },
      },
      orderBy: {
        problem_id: "asc",
      },
      take: options.limit,
    });

    let extracted = 0;
    let created = 0;
    let skippedDuplicates = 0;
    let touchedProblems = 0;

    for (const problem of problems) {
      const existingSignatures = new Set(
        problem.test_cases
          .filter((testcase) => testcase.is_sample)
          .map((testcase) => `${testcase.input_data}::${testcase.expected_output}`)
      );

      const candidates = dedupeSampleTestcases([
        ...extractSampleTestcasesFromText(problem.sample_testcase, "sample reference"),
        ...extractSampleTestcasesFromText(problem.description, "problem description"),
        ...problem.translations.flatMap((translation) =>
          extractSampleTestcasesFromText(translation.description, "problem description")
        ),
      ]);
      extracted += candidates.length;

      const newCandidates = candidates.filter((candidate) => {
        const signature = `${candidate.input}::${candidate.expectedOutput}`;
        if (existingSignatures.has(signature)) {
          skippedDuplicates += 1;
          return false;
        }
        existingSignatures.add(signature);
        return true;
      });

      if (newCandidates.length === 0) {
        continue;
      }

      touchedProblems += 1;
      if (options.verbose) {
        console.log(
          `Problem ${problem.problem_id} ${problem.title}: ${newCandidates.length} sample testcase(s)`
        );
      }

      if (!options.dryRun) {
        await prisma.testCase.createMany({
          data: newCandidates.map((candidate) => ({
            problem_id: problem.problem_id,
            input_data: candidate.input,
            expected_output: candidate.expectedOutput,
            time_limit_ms: 1000,
            memory_limit_mb: 128,
            is_sample: true,
            source: "IMPORTED_SAMPLE",
            review_status: "REVIEWED",
          })),
        });
      }

      created += newCandidates.length;
    }

    console.log(
      `${options.dryRun ? "Would materialize" : "Materialized"} ${created} sample testcase(s) across ${touchedProblems} problem(s).`
    );
    console.log(
      `Extracted ${extracted} candidate pair(s), skipped ${skippedDuplicates} existing sample duplicate(s).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to materialize sample testcases:", error);
  process.exit(1);
});

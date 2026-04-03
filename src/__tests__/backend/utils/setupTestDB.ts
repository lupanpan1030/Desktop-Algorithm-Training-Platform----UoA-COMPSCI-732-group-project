import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { setPrisma } from "../../../backend/db/prisma/prisma";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { bootstrapSqliteDatabase } from "../../../backend/db/prisma/bootstrap-sqlite";

let tmpFile: string;
let originalDbUrl: string | undefined;
export let testPrisma: PrismaClient;

// Create a new Prisma Client instance with a temporary SQLite database
export async function setupTestDB() {
  // make a unique temporary file path
  tmpFile = path.join(os.tmpdir(), `test-db-${Date.now()}.db`);

  // override the DATABASE_URL env so Prisma CLI and client agree
  const url = `file:${tmpFile}`;
  originalDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = url;

  const schemaPath = path.resolve(
    __dirname,
    "../../../backend/db/prisma/schema.prisma"
  );
  await bootstrapSqliteDatabase(tmpFile, schemaPath);

  // instantiate the client pointing at the same file
  testPrisma = new PrismaClient({
    datasources: { db: { url } },
  });
  await testPrisma.$connect();

  // seed the database
  await dropAndSeedProblems();
  await dropAndSeedTestCases();
  await dropAndSeedLanguage();
  await dropAndSeedSubmission();
  await dropAndSeedSubmissionResults();

  return testPrisma;
}

// cleans up the test database and removes the temporary file.
export async function teardownTestDB() {
  if (testPrisma) {
    await testPrisma.$disconnect();
  }
  if (tmpFile) {
    await fs.unlink(tmpFile).catch(() => {});
  }
  if (originalDbUrl !== undefined) {
    process.env.DATABASE_URL = originalDbUrl;
  } else {
    delete process.env.DATABASE_URL;
  }

  setPrisma(undefined);
}

// --------------------------------------------
// using deleteMany in an empty database will not throw error.
// so those functions can be used for both database initialization and resetting

export async function dropAndSeedProblems() {
  await testPrisma.problem.deleteMany({});
  await testPrisma.problem.createMany({
    data: [
      {
        problem_id: 1,
        title: "Two Sum",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.You can return the answer in any order.？",
        difficulty: "EASY",
      },
      {
        problem_id: 5,
        title: "Longest Palindromic Substring",
        description:
          "Given a string s, return the longest palindromic substring in s.",
        difficulty: "MEDIUM",
      },
    ],
  });
}

export async function dropAndSeedTestCases() {
  await testPrisma.testCase.deleteMany({});
  await testPrisma.testCase.createMany({
    data: [
      {
        testcase_id: 1,
        problem_id: 1,
        input_data: "[2,7,11,15], 9",
        expected_output: "[0,1]",
        time_limit_ms: 1 * 1000,
        memory_limit_mb: 128,
        is_sample: true,
      },
      {
        testcase_id: 2,
        problem_id: 1,
        input_data: "[3,2,4], 6",
        expected_output: "[1,2]",
        time_limit_ms: 1 * 1000,
        memory_limit_mb: 128,
        is_sample: false,
      },
      {
        testcase_id: 3,
        problem_id: 5,
        input_data: 's = "babad"',
        expected_output: "bab",
        time_limit_ms: 2 * 1000,
        memory_limit_mb: 256,
        is_sample: true,
      },
      {
        testcase_id: 4,
        problem_id: 5,
        input_data: 's = "cbbd"',
        expected_output: "bb",
        time_limit_ms: 2 * 1000,
        memory_limit_mb: 256,
        is_sample: false,
      },
    ],
  });
}

export async function dropAndSeedLanguage() {
  await testPrisma.programmingLanguage.deleteMany({});
  await testPrisma.programmingLanguage.createMany({
    data: [
      {
        language_id: 1,
        name: 'Python',
        suffix: 'py',
        version: '3.12',
        compile_command: null,  
        run_command: 'python3 {source}',
        is_default: true
        },
        {
        language_id: 2,
        name: 'JavaScript',
        suffix: 'js',
        version: '20',
        compile_command: null,  
        run_command: 'node {source}',
        is_default: false
        },
    ],
  });
}

export async function dropAndSeedSubmission() {
  await testPrisma.submission.deleteMany({});
  await testPrisma.submission.createMany({
    data: [
      {
        submission_id: 1,
        problem_id: 1,
        language_id: 1,
        code: 'print("Hello, World!")',
        status: "PENDING",
      },
      {
        submission_id: 2,
        problem_id: 5,
        language_id: 2,
        code: `
        function longestPalindrome(s) {
          let best = "";
          for (let i = 0; i < s.length; i += 1) {
            for (let j = i + 1; j <= s.length; j += 1) {
              const candidate = s.slice(i, j);
              if (
                candidate === candidate.split("").reverse().join("") &&
                candidate.length > best.length
              ) {
                best = candidate;
              }
            }
          }
          return best;
        }
        console.log(longestPalindrome("babad"));
        `,
        status: "ACCEPTED",
      },
    ],
  });
}

export async function dropAndSeedSubmissionResults() {
  await testPrisma.submissionResult.deleteMany({});
  await testPrisma.submissionResult.createMany({
    data: [
      {
        submission_id: 1,
        status: "RUNTIME_ERROR",
        output: "Hello World",
        stdout: "Hello World",
        stderr: "ReferenceError: boom",
        exit_code: 1,
        phase: "run",
        timed_out: false,
        runtime_ms: 100,
        memory_kb: 256,
      },
      {
        submission_id: 2,
        status: "ACCEPTED",
        output: "Accepted!",
        stdout: "Accepted!",
        stderr: "",
        exit_code: 0,
        phase: "run",
        timed_out: false,
        runtime_ms: 89,
        memory_kb: 512,
      },
    ],
  });
}

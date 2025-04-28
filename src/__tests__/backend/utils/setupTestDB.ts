import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import path from "path";
import os from "os";
import fs from "fs/promises";

let tmpFile: string;
export let testPrisma: PrismaClient;

// Create a new Prisma Client instance with a temporary SQLite database
export async function setupTestDB() {
  // make a unique temporary file path
  tmpFile = path.join(os.tmpdir(), `test-db-${Date.now()}.db`);

  // override the DATABASE_URL env so Prisma CLI and client agree
  const url = `file:${tmpFile}`;
  process.env.DATABASE_URL = url;

  // push schema into that file
  const schemaPath = path.resolve(
    __dirname,
    "../../../backend/db/prisma/schema.prisma"
  );
  execSync(`npx prisma db push --schema="${schemaPath}"`, { stdio: "inherit" });

  // instantiate the client pointing at the same file
  testPrisma = new PrismaClient();
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
        problem_id: 1,
        input_data: "nums = [2,7,11,15], target = 9",
        expected_output: "[0,1]",
        time_limit_ms: 1 * 1000,
        memory_limit_mb: 128,
      },
      {
        problem_id: 1,
        input_data: "nums = [3,2,4], target = 6",
        expected_output: "[1,2]",
        time_limit_ms: 1 * 1000,
        memory_limit_mb: 128,
      },
      {
        problem_id: 5,
        input_data: 's = "babad"',
        expected_output: "bab",
        time_limit_ms: 2 * 1000,
        memory_limit_mb: 256,
      },
      {
        problem_id: 5,
        input_data: 's = "cbbd"',
        expected_output: "bb",
        time_limit_ms: 2 * 1000,
        memory_limit_mb: 256,
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
        name: "Python",
        suffix: "py",
        version: "3.9",
        compile_command: null,
        run_command: "python",
      },
      {
        language_id: 2,
        name: "Java",
        suffix: "java",
        version: "11",
        compile_command: "javac",
        run_command: "java",
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
        class Solution {
            public String longestPalindrome(String s) {
                if (s.isEmpty())
                return "";

                // (start, end) indices of the longest palindrome in s
                int[] indices = {0, 0};

                for (int i = 0; i < s.length(); ++i) {
                int[] indices1 = extend(s, i, i);
                if (indices1[1] - indices1[0] > indices[1] - indices[0])
                    indices = indices1;
                if (i + 1 < s.length() && s.charAt(i) == s.charAt(i + 1)) {
                    int[] indices2 = extend(s, i, i + 1);
                    if (indices2[1] - indices2[0] > indices[1] - indices[0])
                    indices = indices2;
                }
                }

                return s.substring(indices[0], indices[1] + 1);
            }

            // Returns the (start, end) indices of the longest palindrome extended from
            // the substring s[i..j].
            private int[] extend(final String s, int i, int j) {
                for (; i >= 0 && j < s.length(); --i, ++j)
                if (s.charAt(i) != s.charAt(j))
                    break;
                return new int[] {i + 1, j - 1};
            }
            }`,
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
        output: "Hello World",
        runtime_ms: 100,
        memory_kb: 256,
      },
      {
        submission_id: 2,
        status: "ACCEPTED",
        output: "Accepted!",
        runtime_ms: 89,
        memory_kb: 512,
      },
    ],
  });
}

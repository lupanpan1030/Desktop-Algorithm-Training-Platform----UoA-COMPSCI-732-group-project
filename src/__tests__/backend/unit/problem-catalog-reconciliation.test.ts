import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  setupTestDB,
  teardownTestDB,
} from "../utils/setupTestDB";
import { setPrisma } from "../../../backend/db/prisma/prisma";
import { reconcileProblemCatalog } from "../../../backend/db/problem-catalog/reconcile-problem-catalog";

let testPrisma: PrismaClient;

beforeAll(async () => {
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  await testPrisma.submissionResult.deleteMany({});
  await testPrisma.submission.deleteMany({});
  await testPrisma.problemStarterCode.deleteMany({});
  await testPrisma.problemTag.deleteMany({});
  await testPrisma.testCase.deleteMany({});
  await testPrisma.problem.deleteMany({});

  await testPrisma.problem.createMany({
    data: [
      {
        problem_id: 101,
        title: "Two Sum",
        description: "English version",
        difficulty: "EASY",
        source: "LEETCODE",
        locale: "en",
        source_slug: "two-sum",
        external_problem_id: "1",
        judge_ready: true,
      },
      {
        problem_id: 102,
        title: "两数之和",
        description: "Chinese version",
        difficulty: "EASY",
        source: "LEETCODE",
        locale: "zh-CN",
        source_slug: "two-sum",
        external_problem_id: "1",
        import_key: "LEETCODE:zh-CN:two-sum",
        judge_ready: false,
      },
    ],
  });

  await testPrisma.testCase.create({
    data: {
      testcase_id: 1001,
      problem_id: 101,
      input_data: "2 7 11 15\n9",
      expected_output: "0 1",
      time_limit_ms: 1000,
      memory_limit_mb: 128,
      is_sample: true,
    },
  });

  await testPrisma.submission.create({
    data: {
      submission_id: 1001,
      problem_id: 101,
      language_id: 1,
      code: 'print("hello")',
      status: "PENDING",
    },
  });
});

afterAll(async () => {
  await teardownTestDB();
});

describe("reconcileProblemCatalog", () => {
  it("merges localized duplicates and preserves dependent rows on the canonical problem", async () => {
    const result = await reconcileProblemCatalog(testPrisma);

    expect(result.mergedProblems).toBe(1);

    const remainingProblems = await testPrisma.problem.findMany({
      where: {
        source_slug: "two-sum",
      },
      orderBy: {
        problem_id: "asc",
      },
    });

    expect(remainingProblems).toHaveLength(1);
    expect(remainingProblems[0].problem_id).toBe(102);
    expect(remainingProblems[0].title).toBe("两数之和");
    expect(remainingProblems[0].judge_ready).toBe(true);

    const movedTestcases = await testPrisma.testCase.findMany({
      where: {
        problem_id: 102,
      },
    });
    expect(movedTestcases).toHaveLength(1);
    expect(movedTestcases[0].is_sample).toBe(true);

    const movedSubmissions = await testPrisma.submission.findMany({
      where: {
        problem_id: 102,
      },
    });
    expect(movedSubmissions).toHaveLength(1);
    expect(movedSubmissions[0].submission_id).toBe(1001);
  });
});

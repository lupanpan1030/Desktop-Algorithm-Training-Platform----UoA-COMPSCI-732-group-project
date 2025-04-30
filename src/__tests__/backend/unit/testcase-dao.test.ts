import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import {
  setupTestDB,
  dropAndSeedTestCases,
  teardownTestDB,
} from "../utils/setupTestDB";
import { TestCaseDao } from "../../../backend/api/testcase/testcase-dao";
import type { PrismaClient } from "@prisma/client";
import { setPrisma } from "../../../backend/db/prisma/prisma";

// ────────────────────────────────────────────────────────────
//   In‑memory DB setup / teardown (runs once per suite)
// ────────────────────────────────────────────────────────────
let testPrisma: PrismaClient;

beforeAll(async () => {
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  await dropAndSeedTestCases();
});

afterAll(async () => {
  await teardownTestDB();
  setPrisma(undefined);
});

// ────────────────────────────────────────────────────────────
// Test suite
// ────────────────────────────────────────────────────────────
describe("TestCaseDao", () => {
  // ── getTestCasesByProblem ──────────────────────────────────
  describe("getTestCasesByProblem()", () => {
    it("returns exactly the seeded test cases for a given problem", async () => {
      const cases = await TestCaseDao.getTestCasesByProblem(1);
      expect(cases).toHaveLength(2);
      cases.forEach((tc) => expect(tc.problem_id).toBe(1));
      expect(cases[0].input_data).toEqual("[2,7,11,15], 9"); 
      expect(cases[1].input_data).toEqual("[3,2,4], 6"); 
    });

    it("returns an empty array when the problem has no test cases", async () => {
      const none = await TestCaseDao.getTestCasesByProblem(3);
      expect(none).toEqual([]);
    });
  });

  // ── createTestCase ─────────────────────────────────────────
  describe("createTestCase()", () => {
    it("creates a new test case and links it to the correct problem", async () => {
      const params = {
        input: "[1,2,3], 3",
        expectedOutput: "[0 1]",
        timeLimitMs: 1000,
        memoryLimitMb: 256,
      };
      const created = await TestCaseDao.createTestCase(1, params);
      expect(created.testcase_id).toBeGreaterThan(2);
      expect(created.problem_id).toBe(1);
      expect(created.input_data).toBe(params.input);

      // confirm persistence in DB
      const fromDb = await testPrisma.testCase.findUnique({
        where: { testcase_id: created.testcase_id },
      });
      expect(fromDb).not.toBeNull();
      expect(fromDb.expected_output).toBe(params.expectedOutput);
    });
  });

  // ── deleteTestCase ─────────────────────────────────────────
  describe("deleteTestCase()", () => {
    it("removes the specified row when it exists", async () => {
      let all = await testPrisma.testCase.findMany({ where: { problem_id: 1 } });
      expect(all).toHaveLength(2);

      await TestCaseDao.deleteTestCase(1, all[1].testcase_id);
      all = await testPrisma.testCase.findMany({ where: { problem_id: 1 } });
      expect(all).toHaveLength(1);
    });

    it("does not throw when deleting a non-existent id", async () => {
      await expect(
        TestCaseDao.deleteTestCase(1, 999),
      ).resolves.not.toThrow();

      // original rows are untouched
      const remaining = await testPrisma.testCase.findMany({ where: { problem_id: 1 } });
      expect(remaining).toHaveLength(2);
    });
  });
});
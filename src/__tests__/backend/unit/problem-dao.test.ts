import { beforeAll, beforeEach, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import {
  setupTestDB,
  dropAndSeedProblems,
  dropAndSeedTestCases,
  teardownTestDB,
} from "../utils/setupTestDB";
import { ProblemsDao } from "../../../backend/api/problem/problem-dao";
import type { PrismaClient } from "@prisma/client";
import { setPrisma } from "../../../backend/db/prisma/prisma";

let testPrisma: PrismaClient;

beforeAll(async () => {
  // setup the test database
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  // clear and re-seed the problems table
  await dropAndSeedProblems();
  await dropAndSeedTestCases();
});

afterAll(async () => {
  // disconnect from the test database and remove the temporary file
  await teardownTestDB();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProblemsDao", () => {
  describe("getAllProblems()", () => {
    it("returns exactly the two seeded problems", async () => {
      const all = await ProblemsDao.getAllProblems();
      expect(all).toHaveLength(2);

      // they should match seed data
      const titles = all.map((p) => p.title).sort();
      expect(titles).toEqual(["Longest Palindromic Substring", "Two Sum"].sort());
      expect(all[0].problem_id).toBe(1);
      expect(all[0].difficulty).toBe("EASY");
      expect(all[0]._count.test_cases).toBe(2);
      expect(all[1].problem_id).toBe(5);
      expect(all[1].difficulty).toBe("MEDIUM");
      expect(all[1]._count.test_cases).toBe(2);
    });
  });

  describe("getProblemById()", () => {
    it("returns the correct problem when it exists", async () => {
      const p1 = await ProblemsDao.getProblemById(1);
      expect(p1).not.toBeNull();
      expect(p1?.problem_id).toBe(1);
      expect(p1?.title).toBe("Two Sum");
      expect(p1?.description).toContain("return indices of the two numbers such that they add up to target");
      expect(p1?.difficulty).toBe("EASY");
      expect(p1?._count.test_cases).toBe(2);
    });

    it("returns null when the problem does not exist", async () => {
      const notFound = await ProblemsDao.getProblemById(999);
      expect(notFound).toBeNull();
    });
  });

  describe("createProblem()", () => {
    it("creates a new problem and returns it with an auto-incremented id", async () => {
      const newData = {
        title: "Reverse Linked List",
        description:
          "Given the head of a singly linked list, reverse the list.",
        difficulty: "EASY" as const,
      };
      const created = await ProblemsDao.createProblem(newData);

      expect(created.problem_id).toBeGreaterThan(2);
      expect(created.title).toBe(newData.title);

      // check that the problem was created with the correct data in the DB
      const fromDb = await testPrisma.problem.findUnique({
        where: { problem_id: created.problem_id },
      });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.description).toContain("reverse the list");
      expect(created.judge_ready).toBe(false);
      expect(created._count.test_cases).toBe(0);
    });
  });

  describe("updateProblem()", () => {
    it("updates an existing problem and returns the updated row", async () => {
      const updates = {
        title: "Two Sum (updated)",
        difficulty: "MEDIUM" as const,
      };
      const updated = await ProblemsDao.updateProblem(1, updates);

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe(updates.title);
      expect(updated?.difficulty).toBe(updates.difficulty);
    });

    it("returns null when trying to update a non-existent problem", async () => {
      const result = await ProblemsDao.updateProblem(999, { title: "Nope" });
      expect(result).toBeNull();
    });

    it("rethrows unexpected persistence errors instead of returning null", async () => {
      const persistenceError = new Error("write failed");
      vi.spyOn(testPrisma.problem, "update").mockRejectedValueOnce(persistenceError);

      await expect(
        ProblemsDao.updateProblem(1, { title: "Two Sum (broken)" })
      ).rejects.toBe(persistenceError);
    });
  });

  describe("deleteProblem()", () => {
    it("removes the row when it exists", async () => {
      // ensure two exist first
      let all = await testPrisma.problem.findMany();
      expect(all.length).toBe(2);

      // delete problem with id 5
      await ProblemsDao.deleteProblem(5);
      // check that it was deleted in the database
      all = await testPrisma.problem.findMany();
      expect(all.length).toBe(1);
      expect(all[0].problem_id).toBe(1);
    });

    it("does not throw when deleting a non-existent id", async () => {
      await expect(ProblemsDao.deleteProblem(999)).resolves.not.toThrow();
      // DB still has the two from seed
      const all = await testPrisma.problem.findMany();
      expect(all.length).toBe(2);
    });
  });
});

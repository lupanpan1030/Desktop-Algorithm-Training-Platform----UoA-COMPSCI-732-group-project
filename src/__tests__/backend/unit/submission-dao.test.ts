import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { SubmissionDao } from "../../../backend/api/submission/submission-dao";
import {
  dropAndSeedProblems,
  dropAndSeedSubmission,
  dropAndSeedSubmissionResults,
  setupTestDB,
  teardownTestDB,
  testPrisma as sharedTestPrisma,
} from "../utils/setupTestDB";
import { setPrisma } from "../../../backend/db/prisma/prisma";

let testPrisma: PrismaClient;

beforeAll(async () => {
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  await dropAndSeedProblems();
  await dropAndSeedSubmission();
  await dropAndSeedSubmissionResults();
});

afterAll(async () => {
  await teardownTestDB();
});

describe("SubmissionDao", () => {
  describe("getSubmissionByProblemId()", () => {
    it("returns submission results in creation order", async () => {
      await sharedTestPrisma.submissionResult.deleteMany({ where: { submission_id: 1 } });

      await sharedTestPrisma.submissionResult.create({
        data: {
          submission_result_id: 11,
          submission_id: 1,
          status: "ACCEPTED",
          output: "first",
          stdout: "first",
          stderr: "",
          exit_code: 0,
          phase: "run",
          timed_out: false,
          runtime_ms: 12,
          memory_kb: 64,
        },
      });

      await sharedTestPrisma.submissionResult.create({
        data: {
          submission_result_id: 17,
          submission_id: 1,
          status: "REJECTED",
          output: "second",
          stdout: "second",
          stderr: "",
          exit_code: 0,
          phase: "run",
          timed_out: false,
          runtime_ms: 13,
          memory_kb: 64,
        },
      });

      const submission = await SubmissionDao.getSubmissionByProblemId(1, 1);

      expect(submission).not.toBeNull();
      expect(submission?.results.map((result) => result.output)).toEqual([
        "first",
        "second",
      ]);
    });
  });
});

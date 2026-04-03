import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect } from "vitest";
import {
  setupTestDB,
  teardownTestDB,
  dropAndSeedProblems,
  dropAndSeedSubmission,
  dropAndSeedSubmissionResults,
  testPrisma,
} from "../utils/setupTestDB";
import { createApp } from "../../../backend/api/app";
import { setPrisma } from "../../../backend/db/prisma/prisma";

let app: import("express").Application;

beforeAll(async () => {
  // Push your schema & connect to a temp SQLite file
  const testPrisma = await setupTestDB();
  setPrisma(testPrisma);
  app = await createApp();
});

beforeEach(async () => {
  // Reset problems and all related tables
  await dropAndSeedProblems();
  await dropAndSeedSubmission();
  await dropAndSeedSubmissionResults();
});
  

afterAll(async () => {
  await teardownTestDB();
});

describe("Submissions API (integration)", () => {
  describe("GET /problems/:problemId/submissions", () => {
    it("returns 200 + list of submissions for a problem", async () => {
      const res = await request(app).get("/problems/1/submissions");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Each item has correct structure
      for (const item of res.body) {
        expect(item).toMatchObject({
          submissionId: expect.any(Number),
          languageId: expect.any(Number),
          status: expect.any(String),
          submittedAt: expect.any(String),
        });
        // ISO date format check
        expect(() => new Date(item.submittedAt)).not.toThrow();
      }
    });

    it("returns 200 + an empty list when the problem exists but has no submissions", async () => {
      await testPrisma.problem.create({
        data: {
          problem_id: 9,
          title: "No Submission Problem",
          description: "A seeded problem with no submissions yet.",
          difficulty: "EASY",
        },
      });

      const res = await request(app).get("/problems/9/submissions");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 404 when the problem does not exist", async () => {
      const res = await request(app).get("/problems/999/submissions");

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });
  });

  describe("GET /problems/:problemId/submissions/:submissionId", () => {
    it("returns 200 + submission details with results", async () => {
      const res = await request(app).get("/problems/1/submissions/1");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        submissionId: 1,
        code: expect.any(String),
        languageId: expect.any(Number),
        status: expect.any(String),
        submittedAt: expect.any(String),
        results: expect.any(Array),
      });
      for (const r of res.body.results) {
        expect(r).toMatchObject({
          status: expect.any(String),
          output: expect.any(String),
          phase: expect.any(String),
          timedOut: expect.any(Boolean),
          runtimeMs: expect.any(Number),
          memoryKb: expect.any(Number),
        });
      }
      expect(res.body.results[0].stderr).toBe("ReferenceError: boom");
      expect(res.body.results[0].exitCode).toBe(1);
      expect(() => new Date(res.body.submittedAt)).not.toThrow();
    });

    it("returns 404 when submission id does not exist", async () => {
      const res = await request(app).get("/problems/1/submissions/999");
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });

    it("returns 404 when problem id does not exist", async () => {
      const res = await request(app).get("/problems/999/submissions/1");
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });
  });
});

import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect } from "vitest";
import {
  setupTestDB,
  teardownTestDB,
  dropAndSeedProblems,
  testPrisma,
  dropAndSeedSubmission,
  dropAndSeedSubmissionResults,
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
  setPrisma(undefined)
});

describe("Submissions API (integration)", () => {
  describe("GET /problems/:problemId/submissions", () => {
    it("returns 200 + list of submissions for a problem", async () => {
      let res;
      try {
        res = await request(app).get("/problems/1/submissions");
      }
      catch (error) {
        console.error("Error in GET /problems/1/submissions:", error);
      }
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Each item has correct structure
      for (const item of res.body) {
        expect(item).toMatchObject({
          submissionId: expect.any(Number),
          code: expect.any(String),
          languageId: expect.any(Number),
          status: expect.any(String),
          submittedAt: expect.any(String),
        });
        // ISO date format check
        expect(() => new Date(item.submittedAt)).not.toThrow();
      }
    });
  });

  describe("GET /problems/:problemId/submissions/:submissionId", () => {
    it("returns 200 + submission details with results", async () => {
      let res: any;
      try {
        res = await request(app).get("/problems/1/submissions/1");
      }
      catch (error) {
        console.error("Error in GET /problems/1/submissions/1:", error);
      }
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
          runtimeMs: expect.any(Number),
          memoryKb: expect.any(Number),
        });
      }
      expect(() => new Date(res.body.submittedAt)).not.toThrow();
    });

    it("returns 404 when submission id does not exist", async () => {
      let res;
      try {
        res = await request(app).get("/problems/1/submissions/999");
      }
      catch (error) {
        console.error("Error in GET /problems/1/submissions/999:", error);
      }
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });

    it("returns 404 when problem id does not exist", async () => {
      let res;
      try {
        res = await request(app).get("/problems/999/submissions/1");
      }
      catch (error) {
        console.error("Error in GET /problems/999/submissions/1:", error);
      }
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });
  });
});

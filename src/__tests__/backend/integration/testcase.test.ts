import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect } from "vitest";
import {
  setupTestDB,
  teardownTestDB,
  dropAndSeedTestCases,
} from "../utils/setupTestDB";
import { createApp } from "../../../backend/api/app";
import { setPrisma } from "../../../backend/db/prisma/prisma";

let app: import("express").Application;

beforeAll(async () => {
  // Spin up a temporary SQLite DB and let the app use it
  const prisma = await setupTestDB();
  setPrisma(prisma);
  app = await createApp();
});

beforeEach(async () => {
  // Reset seed data before every test case
  await dropAndSeedTestCases();
});

afterAll(async () => {
  // Clean up the temp DB file and disconnect
  await teardownTestDB();
  setPrisma(undefined);
});

/* ──────────────────────────────────────────────────────────
   Test suite
   ────────────────────────────────────────────────────────── */
describe("TestCase routes", () => {
  it("GET /problems/:id/testcases ⇒ 200 with correct items", async () => {
    const res = await request(app).get("/problems/1/testcases").expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        testcaseId: expect.any(Number),
        input: "[2,7,11,15], 9",
        expectedOutput: "[0,1]",
        timeLimitMs: 1000,
        memoryLimitMb: 128,
      })
    );
  });

  it("GET /problems/:id/testcases ⇒ 404 when problem does not exist", async () => {
    await request(app).get("/problems/999/testcases").expect(404);
  });

  /* ── POST /problems/:id/testcases ──────────────────────── */
  it("POST /problems/:id/testcases ⇒ 201 and returns the new record", async () => {
    const newData = {
      input: "[1,2,3], 4",
      expectedOutput: "[0,2]",
      timeLimitMs: 1500,
      memoryLimitMb: 256,
    };

    const res = await request(app)
      .post("/problems/1/testcases")
      .send(newData)
      .expect(201);

    // Response must include the auto-generated testcaseId
    expect(res.body).toEqual(expect.objectContaining(newData));
    expect(res.body.testcaseId).toBeDefined();
  });

  it("POST /problems/:id/testcases ⇒ 422 when body is invalid", async () => {
    // Missing the input field, should trigger ValidateError
    await request(app)
      .post("/problems/1/testcases")
      .send({
        expectedOutput: "oops",
        timeLimitMs: 500,
        memoryLimitMb: 128,
      })
      .expect(422);
  });

  /* ── DELETE /problems/:pid/testcases/:tid ──────────────── */
  it("DELETE /problems/:id/testcases/:tid ⇒ 204 when testcase exists", async () => {
    await request(app)
      .delete(`/problems/1/testcases/1`)
      .expect(204);
  });

  it("DELETE /problems/:id/testcases/:tid ⇒ 204 when testcase does not exist", async () => {
    await request(app).delete("/problems/1/testcases/9999").expect(204);
  });
});

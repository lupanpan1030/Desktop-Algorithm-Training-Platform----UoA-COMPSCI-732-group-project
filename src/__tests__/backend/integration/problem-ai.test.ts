import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createApp } from "../../../backend/api/app";
import { setPrisma } from "../../../backend/db/prisma/prisma";
import {
  dropAndSeedLanguage,
  dropAndSeedProblems,
  dropAndSeedSubmission,
  dropAndSeedSubmissionResults,
  dropAndSeedTestCases,
  setupTestDB,
  teardownTestDB,
  testPrisma,
} from "../utils/setupTestDB";

let app: import("express").Application;
let originalAiProvider: string | undefined;
let originalAppConfigDir: string | undefined;
let testAppConfigDir: string;

beforeAll(async () => {
  originalAiProvider = process.env.AI_PROVIDER;
  originalAppConfigDir = process.env.APP_CONFIG_DIR;
  testAppConfigDir = await fs.mkdtemp(path.join(os.tmpdir(), "problem-ai-config-"));
  process.env.AI_PROVIDER = "mock";
  process.env.APP_CONFIG_DIR = testAppConfigDir;

  const prisma = await setupTestDB();
  setPrisma(prisma);
  app = await createApp();
});

beforeEach(async () => {
  await dropAndSeedProblems();
  await dropAndSeedTestCases();
  await dropAndSeedLanguage();
  await dropAndSeedSubmission();
  await dropAndSeedSubmissionResults();
});

afterAll(async () => {
  await teardownTestDB();
  await fs.rm(testAppConfigDir, { recursive: true, force: true });
  if (originalAiProvider === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = originalAiProvider;
  }
  if (originalAppConfigDir === undefined) {
    delete process.env.APP_CONFIG_DIR;
  } else {
    process.env.APP_CONFIG_DIR = originalAppConfigDir;
  }
});

describe("Problem AI routes", () => {
  it("POST /problems/:problemId/ai/test-drafts returns preview drafts from explicit examples", async () => {
    await testPrisma.problem.update({
      where: { problem_id: 1 },
      data: {
        sample_testcase:
          "Example 1:\nInput: nums = [1,5,3,7], target = 8\nOutput: [0,2]\nExplanation: 1 + 7? no, 1 + 3? no, 5 + 3 = 8.",
      },
    });

    const response = await request(app)
      .post("/problems/1/ai/test-drafts")
      .send({
        targetCount: 4,
        includeSampleDrafts: true,
        includeHiddenDrafts: true,
      })
      .expect(200);

    expect(response.body.provider).toBe("mock-assistant-preview");
    expect(response.body.problemId).toBe(1);
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Preview mode"),
        expect.stringContaining("Hidden testcase drafts are not generated"),
      ])
    );
    expect(response.body.drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          input: "nums = [1,5,3,7], target = 8",
          expectedOutput: "[0,2]",
          isSample: true,
          confidence: expect.stringMatching(/high|medium|low/),
        }),
      ])
    );
  });
});

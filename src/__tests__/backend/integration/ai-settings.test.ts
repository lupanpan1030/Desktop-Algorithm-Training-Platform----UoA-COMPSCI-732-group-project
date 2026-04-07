import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createApp } from "../../../backend/api/app";

let app: import("express").Application;
let originalAiProvider: string | undefined;
let originalAppConfigDir: string | undefined;
let originalOpenAiKey: string | undefined;
let testAppConfigDir: string;

beforeAll(async () => {
  originalAiProvider = process.env.AI_PROVIDER;
  originalAppConfigDir = process.env.APP_CONFIG_DIR;
  originalOpenAiKey = process.env.OPENAI_API_KEY;
  testAppConfigDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-settings-config-"));
  process.env.AI_PROVIDER = "mock";
  process.env.APP_CONFIG_DIR = testAppConfigDir;
  delete process.env.OPENAI_API_KEY;

  app = await createApp();
});

afterAll(async () => {
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

  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }
});

describe("AI settings routes", () => {
  it("POST /settings/ai/test returns a preview result for the mock provider", async () => {
    const response = await request(app)
      .post("/settings/ai/test")
      .send({
        provider: "mock",
        model: "gpt-5-mini",
        baseUrl: "https://api.openai.com/v1",
        timeoutMs: 30000,
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        status: "preview",
        provider: "mock",
        credentialSource: "none",
      })
    );
  });
});

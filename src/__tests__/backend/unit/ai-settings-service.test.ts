import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const credentialMockState = vi.hoisted(() => ({
  readAiCredential: vi.fn(async () => ({
    available: true,
    apiKey: null,
  })),
  writeAiCredential: vi.fn(),
  clearAiCredential: vi.fn(),
}));

const axiosMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("../../../backend/services/ai/ai-credential-store", () => ({
  readAiCredential: credentialMockState.readAiCredential,
  writeAiCredential: credentialMockState.writeAiCredential,
  clearAiCredential: credentialMockState.clearAiCredential,
}));

vi.mock("axios", () => ({
  default: axiosMock,
}));

import { AiSettingsService } from "../../../backend/api/settings/ai-settings-service";

describe("AiSettingsService", () => {
  let originalAppConfigDir: string | undefined;
  let originalAiProvider: string | undefined;
  let originalAiApiKey: string | undefined;
  let originalOpenAiKey: string | undefined;
  let testAppConfigDir: string;

  beforeEach(async () => {
    originalAppConfigDir = process.env.APP_CONFIG_DIR;
    originalAiProvider = process.env.AI_PROVIDER;
    originalAiApiKey = process.env.AI_API_KEY;
    originalOpenAiKey = process.env.OPENAI_API_KEY;
    testAppConfigDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-settings-service-"));
    process.env.APP_CONFIG_DIR = testAppConfigDir;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.rm(testAppConfigDir, { recursive: true, force: true });

    if (originalAppConfigDir === undefined) {
      delete process.env.APP_CONFIG_DIR;
    } else {
      process.env.APP_CONFIG_DIR = originalAppConfigDir;
    }

    if (originalAiProvider === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalAiProvider;
    }

    if (originalAiApiKey === undefined) {
      delete process.env.AI_API_KEY;
    } else {
      process.env.AI_API_KEY = originalAiApiKey;
    }

    if (originalOpenAiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
    }
  });

  it("tests Chat Completions-compatible endpoints with a real chat request shape", async () => {
    axiosMock.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "OK",
            },
          },
        ],
      },
    });

    const service = new AiSettingsService();
    const result = await service.testSettings({
      provider: "openai",
      apiFormat: "chat_completions",
      apiKey: "sk-live",
      model: "qwen-plus",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/",
      timeoutMs: 1000,
    });

    expect(axiosMock.post).toHaveBeenCalledWith(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      expect.objectContaining({
        model: "qwen-plus",
        messages: [
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user", content: "Connection test" }),
        ],
        stream: false,
      }),
      expect.objectContaining({
        timeout: 1000,
        headers: expect.objectContaining({
          Authorization: "Bearer sk-live",
        }),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        status: "success",
        provider: "openai",
        apiFormat: "chat_completions",
        model: "qwen-plus",
      })
    );
  });
});

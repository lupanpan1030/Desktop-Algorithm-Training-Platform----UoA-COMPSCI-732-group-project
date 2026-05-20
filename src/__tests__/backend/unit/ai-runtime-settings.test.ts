import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const credentialMockState = vi.hoisted(() => {
  const state = {
    available: true,
    apiKey: null as string | null,
  };

  return {
    state,
    readAiCredential: vi.fn(async () => ({
      available: state.available,
      apiKey: state.apiKey,
    })),
    writeAiCredential: vi.fn(async (_storagePath: string, apiKey: string) => {
      state.apiKey = apiKey;
    }),
    clearAiCredential: vi.fn(async () => {
      state.apiKey = null;
    }),
  };
});

vi.mock("../../../backend/services/ai/ai-credential-store", () => ({
  readAiCredential: credentialMockState.readAiCredential,
  writeAiCredential: credentialMockState.writeAiCredential,
  clearAiCredential: credentialMockState.clearAiCredential,
}));

import {
  getAiSettingsStoragePath,
  resolveAiRuntimeSettings,
  saveAiRuntimeSettings,
} from "../../../backend/services/ai/ai-runtime-settings";

describe("AI runtime settings", () => {
  let originalAppConfigDir: string | undefined;
  let originalAiProvider: string | undefined;
  let originalAiApiFormat: string | undefined;
  let originalAiApiKey: string | undefined;
  let originalAiBaseUrl: string | undefined;
  let originalAiModel: string | undefined;
  let originalOpenAiKey: string | undefined;
  let testAppConfigDir: string;

  beforeEach(async () => {
    originalAppConfigDir = process.env.APP_CONFIG_DIR;
    originalAiProvider = process.env.AI_PROVIDER;
    originalAiApiFormat = process.env.AI_API_FORMAT;
    originalAiApiKey = process.env.AI_API_KEY;
    originalAiBaseUrl = process.env.AI_BASE_URL;
    originalAiModel = process.env.AI_MODEL;
    originalOpenAiKey = process.env.OPENAI_API_KEY;
    testAppConfigDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-settings-config-"));
    process.env.APP_CONFIG_DIR = testAppConfigDir;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_FORMAT;
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
    delete process.env.OPENAI_API_KEY;
    credentialMockState.state.available = true;
    credentialMockState.state.apiKey = null;
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

    if (originalAiApiFormat === undefined) {
      delete process.env.AI_API_FORMAT;
    } else {
      process.env.AI_API_FORMAT = originalAiApiFormat;
    }

    if (originalAiApiKey === undefined) {
      delete process.env.AI_API_KEY;
    } else {
      process.env.AI_API_KEY = originalAiApiKey;
    }

    if (originalAiBaseUrl === undefined) {
      delete process.env.AI_BASE_URL;
    } else {
      process.env.AI_BASE_URL = originalAiBaseUrl;
    }

    if (originalAiModel === undefined) {
      delete process.env.AI_MODEL;
    } else {
      process.env.AI_MODEL = originalAiModel;
    }

    if (originalOpenAiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
    }
  });

  it("stores API keys in the system credential store instead of the local json file", async () => {
    const settings = await saveAiRuntimeSettings({
      provider: "openai",
      apiFormat: "chat_completions",
      apiKey: "sk-test-1234",
      model: "gpt-5-mini",
      baseUrl: "https://api.openai.com/v1",
      timeoutMs: 30000,
    });

    const stored = JSON.parse(
      await fs.readFile(getAiSettingsStoragePath(), "utf8")
    ) as Record<string, unknown>;

    expect(credentialMockState.writeAiCredential).toHaveBeenCalledWith(
      getAiSettingsStoragePath(),
      "sk-test-1234"
    );
    expect(stored.apiKey).toBeUndefined();
    expect(stored.apiFormat).toBe("chat_completions");
    expect(settings.apiKeyConfigured).toBe(true);
    expect(settings.apiKeySource).toBe("system-keychain");
    expect(settings.apiFormat).toBe("chat_completions");
  });

  it("migrates a legacy file-based key into the system credential store on read", async () => {
    const storagePath = getAiSettingsStoragePath();
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(
      storagePath,
      JSON.stringify(
        {
          provider: "openai",
          apiKey: "sk-legacy-9999",
          model: "gpt-5-mini",
          baseUrl: "https://api.openai.com/v1",
          timeoutMs: 30000,
        },
        null,
        2
      ),
      "utf8"
    );

    const settings = await resolveAiRuntimeSettings();
    const stored = JSON.parse(await fs.readFile(storagePath, "utf8")) as Record<string, unknown>;

    expect(credentialMockState.writeAiCredential).toHaveBeenCalledWith(
      storagePath,
      "sk-legacy-9999"
    );
    expect(stored.apiKey).toBeUndefined();
    expect(settings.apiKeyConfigured).toBe(true);
    expect(settings.apiKeySource).toBe("system-keychain");
    expect(settings.apiFormat).toBe("responses");
  });

  it("can resolve generic live API environment variables", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_FORMAT = "chat";
    process.env.AI_API_KEY = "sk-generic-1234";
    process.env.AI_BASE_URL = "https://api.example.test/openai";
    process.env.AI_MODEL = "qwen-plus";

    const settings = await resolveAiRuntimeSettings();

    expect(settings.provider).toBe("openai");
    expect(settings.apiFormat).toBe("chat_completions");
    expect(settings.apiKey).toBe("sk-generic-1234");
    expect(settings.apiKeySource).toBe("environment");
    expect(settings.baseUrl).toBe("https://api.example.test/openai");
    expect(settings.model).toBe("qwen-plus");
  });
});

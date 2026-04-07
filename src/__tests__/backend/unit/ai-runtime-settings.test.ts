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
  let originalOpenAiKey: string | undefined;
  let testAppConfigDir: string;

  beforeEach(async () => {
    originalAppConfigDir = process.env.APP_CONFIG_DIR;
    originalOpenAiKey = process.env.OPENAI_API_KEY;
    testAppConfigDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-settings-config-"));
    process.env.APP_CONFIG_DIR = testAppConfigDir;
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

    if (originalOpenAiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
    }
  });

  it("stores API keys in the system credential store instead of the local json file", async () => {
    const settings = await saveAiRuntimeSettings({
      provider: "openai",
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
    expect(settings.apiKeyConfigured).toBe(true);
    expect(settings.apiKeySource).toBe("system-keychain");
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
  });
});

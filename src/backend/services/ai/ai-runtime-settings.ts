import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export type AiProviderKind = "mock" | "openai";
export type AiSettingsStatus = "preview" | "ready" | "misconfigured";
export type AiApiKeySource = "saved" | "environment" | "none";

type StoredAiSettings = {
  provider?: AiProviderKind;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

export type AiSettingsUpdateInput = {
  provider?: string | null;
  apiKey?: string | null;
  clearApiKey?: boolean;
  model?: string | null;
  baseUrl?: string | null;
  timeoutMs?: number | null;
};

export type ResolvedAiRuntimeSettings = {
  provider: AiProviderKind;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  apiKey: string;
  apiKeyConfigured: boolean;
  apiKeySource: AiApiKeySource;
  apiKeyPreview: string | null;
  status: AiSettingsStatus;
  statusLabel: string;
  statusReason: string;
  storagePath: string;
  storageScope: string;
};

export const DEFAULT_AI_MODEL = "gpt-5-mini";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_OPENAI_TIMEOUT_MS = 30000;

function normalizeProvider(value?: string | null): AiProviderKind {
  return value?.trim().toLowerCase() === "openai" ? "openai" : "mock";
}

function normalizeNonEmptyString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTimeoutMs(value?: number | string | null) {
  const parsedTimeout =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? DEFAULT_OPENAI_TIMEOUT_MS), 10);

  if (Number.isInteger(parsedTimeout) && parsedTimeout >= 1000 && parsedTimeout <= 300000) {
    return parsedTimeout;
  }

  return DEFAULT_OPENAI_TIMEOUT_MS;
}

function getAiSettingsStorageDir() {
  const configuredDir = process.env.APP_CONFIG_DIR?.trim();
  if (configuredDir) {
    return configuredDir;
  }

  return path.resolve(process.cwd(), ".algo-platform");
}

export function getAiSettingsStoragePath() {
  return path.join(getAiSettingsStorageDir(), "ai-settings.json");
}

function readStoredAiSettingsSync(): StoredAiSettings {
  const storagePath = getAiSettingsStoragePath();

  try {
    if (!fs.existsSync(storagePath)) {
      return {};
    }

    const rawValue = fs.readFileSync(storagePath, "utf8");
    const parsed = JSON.parse(rawValue) as StoredAiSettings | null;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function buildApiKeyPreview(apiKey: string) {
  if (!apiKey) {
    return null;
  }

  const visibleSuffix = apiKey.slice(-4);
  return visibleSuffix ? `••••${visibleSuffix}` : "Configured";
}

function buildStatus(
  provider: AiProviderKind,
  apiKeyConfigured: boolean,
  model: string
): Pick<ResolvedAiRuntimeSettings, "status" | "statusLabel" | "statusReason"> {
  if (provider === "mock") {
    return {
      status: "preview",
      statusLabel: "Preview mode",
      statusReason:
        "The assistant uses the built-in preview provider and does not call the OpenAI API.",
    };
  }

  if (!apiKeyConfigured) {
    return {
      status: "misconfigured",
      statusLabel: "Needs API key",
      statusReason:
        "OpenAI is selected, but no API key is available yet. The assistant will stay in preview mode until one is configured.",
    };
  }

  return {
    status: "ready",
    statusLabel: "OpenAI live",
    statusReason: `Live assistant responses will use OpenAI with model ${model}.`,
  };
}

function pruneStoredSettings(settings: StoredAiSettings): StoredAiSettings {
  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined && value !== "")
  ) as StoredAiSettings;
}

export function resolveAiRuntimeSettings(): ResolvedAiRuntimeSettings {
  const storedSettings = readStoredAiSettingsSync();
  const provider = normalizeProvider(storedSettings.provider ?? process.env.AI_PROVIDER);
  const model =
    normalizeNonEmptyString(storedSettings.model) ??
    normalizeNonEmptyString(process.env.AI_MODEL) ??
    DEFAULT_AI_MODEL;
  const baseUrl =
    normalizeNonEmptyString(storedSettings.baseUrl) ??
    normalizeNonEmptyString(process.env.OPENAI_BASE_URL) ??
    DEFAULT_OPENAI_BASE_URL;
  const timeoutMs = normalizeTimeoutMs(
    storedSettings.timeoutMs ?? process.env.OPENAI_TIMEOUT_MS
  );
  const savedApiKey = normalizeNonEmptyString(storedSettings.apiKey);
  const envApiKey = normalizeNonEmptyString(process.env.OPENAI_API_KEY);
  const apiKey = savedApiKey ?? envApiKey ?? "";
  const apiKeySource: AiApiKeySource = savedApiKey
    ? "saved"
    : envApiKey
      ? "environment"
      : "none";
  const apiKeyConfigured = Boolean(apiKey);
  const status = buildStatus(provider, apiKeyConfigured, model);

  return {
    provider,
    model,
    baseUrl,
    timeoutMs,
    apiKey,
    apiKeyConfigured,
    apiKeySource,
    apiKeyPreview: buildApiKeyPreview(apiKey),
    ...status,
    storagePath: getAiSettingsStoragePath(),
    storageScope: process.env.APP_CONFIG_DIR?.trim()
      ? "Stored locally in this app's data directory on this device."
      : "Stored locally in this project's config directory.",
  };
}

export async function saveAiRuntimeSettings(
  input: AiSettingsUpdateInput
): Promise<ResolvedAiRuntimeSettings> {
  const currentStoredSettings = readStoredAiSettingsSync();
  const nextApiKey = input.clearApiKey
    ? undefined
    : normalizeNonEmptyString(input.apiKey) ?? currentStoredSettings.apiKey;
  const nextStoredSettings = pruneStoredSettings({
    provider: normalizeProvider(input.provider ?? currentStoredSettings.provider),
    apiKey: nextApiKey,
    model:
      normalizeNonEmptyString(input.model) ??
      normalizeNonEmptyString(currentStoredSettings.model) ??
      DEFAULT_AI_MODEL,
    baseUrl:
      normalizeNonEmptyString(input.baseUrl) ??
      normalizeNonEmptyString(currentStoredSettings.baseUrl) ??
      DEFAULT_OPENAI_BASE_URL,
    timeoutMs: normalizeTimeoutMs(input.timeoutMs ?? currentStoredSettings.timeoutMs),
  });

  const storagePath = getAiSettingsStoragePath();
  await fsp.mkdir(path.dirname(storagePath), { recursive: true });
  await fsp.writeFile(storagePath, JSON.stringify(nextStoredSettings, null, 2), "utf8");

  return resolveAiRuntimeSettings();
}

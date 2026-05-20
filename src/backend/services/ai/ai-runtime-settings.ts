import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import {
  clearAiCredential,
  readAiCredential,
  writeAiCredential,
} from "./ai-credential-store";

export type AiProviderKind = "mock" | "openai";
export type AiApiFormat = "responses" | "chat_completions";
export type AiSettingsStatus = "preview" | "ready" | "misconfigured";
export type AiApiKeySource =
  | "provided"
  | "system-keychain"
  | "legacy-file"
  | "environment"
  | "none";

type StoredAiSettings = {
  provider?: AiProviderKind;
  apiFormat?: AiApiFormat;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

export type AiSettingsUpdateInput = {
  provider?: string | null;
  apiFormat?: string | null;
  apiKey?: string | null;
  clearApiKey?: boolean;
  model?: string | null;
  baseUrl?: string | null;
  timeoutMs?: number | null;
};

type ResolveOptions = {
  allowTransientApiKey?: boolean;
};

type PersistedCredentialState = {
  apiKey: string;
  source: Extract<AiApiKeySource, "system-keychain" | "legacy-file" | "none">;
};

export type ResolvedAiRuntimeSettings = {
  provider: AiProviderKind;
  apiFormat: AiApiFormat;
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
export const DEFAULT_AI_API_FORMAT: AiApiFormat = "responses";

function normalizeProvider(value?: string | null): AiProviderKind {
  return value?.trim().toLowerCase() === "openai" ? "openai" : "mock";
}

function normalizeApiFormat(value?: string | null): AiApiFormat {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    normalized === "chat" ||
    normalized === "chat_completions" ||
    normalized === "chat/completions" ||
    normalized === "openai_compatible" ||
    normalized === "openai_compatible_chat"
  ) {
    return "chat_completions";
  }

  return DEFAULT_AI_API_FORMAT;
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
  model: string,
  apiFormat: AiApiFormat
): Pick<ResolvedAiRuntimeSettings, "status" | "statusLabel" | "statusReason"> {
  if (provider === "mock") {
    return {
      status: "preview",
      statusLabel: "Preview mode",
      statusReason:
        "The assistant uses the built-in preview provider and does not call external AI APIs.",
    };
  }

  if (!apiKeyConfigured) {
    return {
      status: "misconfigured",
      statusLabel: "Needs API key",
      statusReason:
        "A live AI endpoint is selected, but no API key is available yet. The assistant will stay in preview mode until one is configured.",
    };
  }

  const formatLabel =
    apiFormat === "chat_completions" ? "Chat Completions" : "Responses API";

  return {
    status: "ready",
    statusLabel: apiFormat === "chat_completions" ? "Live API (Chat)" : "Live API (Responses)",
    statusReason: `Live assistant responses will use ${formatLabel} with model ${model}.`,
  };
}

function pruneStoredSettings(settings: StoredAiSettings): StoredAiSettings {
  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined && value !== "")
  ) as StoredAiSettings;
}

async function writeStoredAiSettings(settings: StoredAiSettings) {
  const storagePath = getAiSettingsStoragePath();
  await fsp.mkdir(path.dirname(storagePath), { recursive: true });
  await fsp.writeFile(storagePath, JSON.stringify(pruneStoredSettings(settings), null, 2), "utf8");
}

function buildStorageScope(source: AiApiKeySource) {
  const settingsScope = process.env.APP_CONFIG_DIR?.trim()
    ? "Non-secret assistant settings are stored in this app's local data directory on this device."
    : "Non-secret assistant settings are stored in this project's local config directory.";

  switch (source) {
    case "system-keychain":
      return `${settingsScope} The API key is stored in the system keychain.`;
    case "legacy-file":
      return `${settingsScope} A legacy API key is still being read from the local settings file until it can be migrated into the system keychain.`;
    case "environment":
      return `${settingsScope} The API key currently comes from the AI_API_KEY or OPENAI_API_KEY environment variable.`;
    case "provided":
      return `${settingsScope} The API key is being used only for this connection test and has not been saved yet.`;
    default:
      return `${settingsScope} Saving a key from this screen stores it in the system keychain.`;
  }
}

async function resolvePersistedCredentialState(
  storedSettings: StoredAiSettings,
  storagePath: string
): Promise<PersistedCredentialState> {
  const legacyApiKey = normalizeNonEmptyString(storedSettings.apiKey);
  const credential = await readAiCredential(storagePath);

  if (legacyApiKey && credential.available) {
    if (!credential.apiKey) {
      await writeAiCredential(storagePath, legacyApiKey);
    }

    try {
      await writeStoredAiSettings({
        ...storedSettings,
        apiKey: undefined,
      });
    } catch {
      // Ignore cleanup failure here. The runtime still prefers the keychain copy.
    }

    return {
      apiKey: credential.apiKey ?? legacyApiKey,
      source: "system-keychain",
    };
  }

  if (credential.apiKey) {
    if (legacyApiKey) {
      try {
        await writeStoredAiSettings({
          ...storedSettings,
          apiKey: undefined,
        });
      } catch {
        // Ignore cleanup failure here. The runtime still prefers the keychain copy.
      }
    }

    return {
      apiKey: credential.apiKey,
      source: "system-keychain",
    };
  }

  if (legacyApiKey) {
    return {
      apiKey: legacyApiKey,
      source: "legacy-file",
    };
  }

  return {
    apiKey: "",
    source: "none",
  };
}

export async function resolveAiRuntimeSettings(
  input?: AiSettingsUpdateInput,
  options: ResolveOptions = {}
): Promise<ResolvedAiRuntimeSettings> {
  const storedSettings = readStoredAiSettingsSync();
  const storagePath = getAiSettingsStoragePath();
  const persistedCredential = await resolvePersistedCredentialState(storedSettings, storagePath);
  const envApiKey =
    normalizeNonEmptyString(process.env.AI_API_KEY) ??
    normalizeNonEmptyString(process.env.OPENAI_API_KEY);
  const transientApiKey = options.allowTransientApiKey
    ? normalizeNonEmptyString(input?.apiKey)
    : undefined;

  const provider = normalizeProvider(
    input?.provider ?? storedSettings.provider ?? process.env.AI_PROVIDER
  );
  const apiFormat = normalizeApiFormat(
    input?.apiFormat ??
      storedSettings.apiFormat ??
      process.env.AI_API_FORMAT ??
      process.env.OPENAI_API_FORMAT
  );
  const model =
    normalizeNonEmptyString(input?.model) ??
    normalizeNonEmptyString(storedSettings.model) ??
    normalizeNonEmptyString(process.env.AI_MODEL) ??
    DEFAULT_AI_MODEL;
  const baseUrl =
    normalizeNonEmptyString(input?.baseUrl) ??
    normalizeNonEmptyString(storedSettings.baseUrl) ??
    normalizeNonEmptyString(process.env.AI_BASE_URL) ??
    normalizeNonEmptyString(process.env.OPENAI_BASE_URL) ??
    DEFAULT_OPENAI_BASE_URL;
  const timeoutMs = normalizeTimeoutMs(
    input?.timeoutMs ??
      storedSettings.timeoutMs ??
      process.env.AI_TIMEOUT_MS ??
      process.env.OPENAI_TIMEOUT_MS
  );

  let apiKey = "";
  let apiKeySource: AiApiKeySource = "none";

  if (transientApiKey) {
    apiKey = transientApiKey;
    apiKeySource = "provided";
  } else if (input?.clearApiKey) {
    apiKey = envApiKey ?? "";
    apiKeySource = envApiKey ? "environment" : "none";
  } else if (persistedCredential.source !== "none") {
    apiKey = persistedCredential.apiKey;
    apiKeySource = persistedCredential.source;
  } else if (envApiKey) {
    apiKey = envApiKey;
    apiKeySource = "environment";
  }

  const apiKeyConfigured = Boolean(apiKey);
  const status = buildStatus(provider, apiKeyConfigured, model, apiFormat);

  return {
    provider,
    apiFormat,
    model,
    baseUrl,
    timeoutMs,
    apiKey,
    apiKeyConfigured,
    apiKeySource,
    apiKeyPreview: buildApiKeyPreview(apiKey),
    ...status,
    storagePath,
    storageScope: buildStorageScope(apiKeySource),
  };
}

export async function saveAiRuntimeSettings(
  input: AiSettingsUpdateInput
): Promise<ResolvedAiRuntimeSettings> {
  const currentStoredSettings = readStoredAiSettingsSync();
  const storagePath = getAiSettingsStoragePath();
  const currentCredential = await resolvePersistedCredentialState(
    currentStoredSettings,
    storagePath
  );
  const nextApiKey = normalizeNonEmptyString(input.apiKey);
  const nextStoredSettings = pruneStoredSettings({
    provider: normalizeProvider(input.provider ?? currentStoredSettings.provider),
    apiFormat: normalizeApiFormat(input.apiFormat ?? currentStoredSettings.apiFormat),
    model:
      normalizeNonEmptyString(input.model) ??
      normalizeNonEmptyString(currentStoredSettings.model) ??
      DEFAULT_AI_MODEL,
    baseUrl:
      normalizeNonEmptyString(input.baseUrl) ??
      normalizeNonEmptyString(currentStoredSettings.baseUrl) ??
      DEFAULT_OPENAI_BASE_URL,
    timeoutMs: normalizeTimeoutMs(input.timeoutMs ?? currentStoredSettings.timeoutMs),
    apiKey:
      currentCredential.source === "legacy-file" &&
      !input.clearApiKey &&
      !nextApiKey
        ? currentStoredSettings.apiKey
        : undefined,
  });

  if (input.clearApiKey) {
    if (currentCredential.source === "system-keychain") {
      await clearAiCredential(storagePath);
    }
    nextStoredSettings.apiKey = undefined;
  } else if (nextApiKey) {
    await writeAiCredential(storagePath, nextApiKey);
    nextStoredSettings.apiKey = undefined;
  }

  await writeStoredAiSettings(nextStoredSettings);

  return resolveAiRuntimeSettings();
}

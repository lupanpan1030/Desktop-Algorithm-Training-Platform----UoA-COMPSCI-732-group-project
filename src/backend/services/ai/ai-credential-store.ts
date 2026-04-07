import crypto from "crypto";
import * as keytar from "keytar";

const AI_KEYCHAIN_SERVICE = "algo-platform.ai";
const AI_KEYCHAIN_ACCOUNT_PREFIX = "openai-api-key";

export type AiCredentialReadResult = {
  available: boolean;
  apiKey: string | null;
  errorMessage?: string;
};

function buildAccountName(storagePath: string) {
  const digest = crypto
    .createHash("sha256")
    .update(storagePath)
    .digest("hex")
    .slice(0, 16);

  return `${AI_KEYCHAIN_ACCOUNT_PREFIX}:${digest}`;
}

function normalizeApiKey(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildUnavailableMessage(action: "read" | "store" | "clear", error: unknown) {
  const detail =
    error instanceof Error && error.message.trim()
      ? ` ${error.message.trim()}`
      : "";

  return `The system keychain is unavailable, so the app could not ${action} the AI API key.${detail}`;
}

export async function readAiCredential(storagePath: string): Promise<AiCredentialReadResult> {
  try {
    const apiKey = await keytar.getPassword(
      AI_KEYCHAIN_SERVICE,
      buildAccountName(storagePath)
    );

    return {
      available: true,
      apiKey: normalizeApiKey(apiKey),
    };
  } catch (error) {
    return {
      available: false,
      apiKey: null,
      errorMessage: buildUnavailableMessage("read", error),
    };
  }
}

export async function writeAiCredential(
  storagePath: string,
  apiKey: string
): Promise<void> {
  try {
    await keytar.setPassword(
      AI_KEYCHAIN_SERVICE,
      buildAccountName(storagePath),
      apiKey
    );
  } catch (error) {
    throw new Error(buildUnavailableMessage("store", error));
  }
}

export async function clearAiCredential(storagePath: string): Promise<void> {
  try {
    await keytar.deletePassword(
      AI_KEYCHAIN_SERVICE,
      buildAccountName(storagePath)
    );
  } catch (error) {
    throw new Error(buildUnavailableMessage("clear", error));
  }
}

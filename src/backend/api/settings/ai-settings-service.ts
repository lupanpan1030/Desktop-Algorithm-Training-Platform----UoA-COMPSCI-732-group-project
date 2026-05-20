import axios from "axios";
import {
  resolveAiRuntimeSettings,
  saveAiRuntimeSettings,
} from "../../services/ai/ai-runtime-settings";
import {
  AiConnectionTestDto,
  AiSettingsDto,
  TestAiSettingsRequestDto,
  UpdateAiSettingsRequestDto,
} from "./ai-settings";

async function toDto(): Promise<AiSettingsDto> {
  const settings = await resolveAiRuntimeSettings();

  return {
    provider: settings.provider,
    apiFormat: settings.apiFormat,
    model: settings.model,
    baseUrl: settings.baseUrl,
    timeoutMs: settings.timeoutMs,
    apiKeyConfigured: settings.apiKeyConfigured,
    apiKeySource: settings.apiKeySource,
    apiKeyPreview: settings.apiKeyPreview,
    status: settings.status,
    statusLabel: settings.statusLabel,
    statusReason: settings.statusReason,
    storagePath: settings.storagePath,
    storageScope: settings.storageScope,
  };
}

function buildAiProviderErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage =
      typeof error.response?.data?.error?.message === "string"
        ? error.response.data.error.message
        : typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;

    if (status === 401) {
      return "The AI endpoint rejected the API key. Check that the key is valid and still active.";
    }

    if (status === 403) {
      return "The AI endpoint rejected the request. The API key may not have access to this model.";
    }

    if (status === 404) {
      return "The configured model or base URL could not be found. Check the model name and endpoint.";
    }

    if (status === 429) {
      return "The AI endpoint rate-limited the request. Try again in a moment.";
    }

    if (status && status >= 500) {
      return "The AI endpoint is temporarily unavailable. Try again shortly.";
    }

    if (error.code === "ECONNABORTED") {
      return "The connection test timed out before the AI endpoint responded.";
    }

    if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
      return "The app could not reach the configured AI endpoint. Check the base URL and network access.";
    }

    if (apiMessage) {
      return apiMessage;
    }
  }

  return error instanceof Error
    ? error.message
    : "The connection test failed unexpectedly.";
}

async function testLiveEndpoint(settings: Awaited<ReturnType<typeof resolveAiRuntimeSettings>>) {
  const baseUrl = settings.baseUrl.replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${settings.apiKey}`,
    "Content-Type": "application/json",
  };

  if (settings.apiFormat === "chat_completions") {
    await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: settings.model,
        messages: [
          {
            role: "system",
            content: "You are testing an AI API connection. Reply with OK.",
          },
          {
            role: "user",
            content: "Connection test",
          },
        ],
        stream: false,
      },
      {
        timeout: settings.timeoutMs,
        headers,
      }
    );
    return;
  }

  await axios.post(
    `${baseUrl}/responses`,
    {
      model: settings.model,
      instructions: "You are testing an AI API connection. Reply with OK.",
      input: "Connection test",
    },
    {
      timeout: settings.timeoutMs,
      headers,
    }
  );
}

export class AiSettingsService {
  async getSettings(): Promise<AiSettingsDto> {
    return toDto();
  }

  async updateSettings(body: UpdateAiSettingsRequestDto): Promise<AiSettingsDto> {
    await saveAiRuntimeSettings({
      provider: body.provider,
      apiFormat: body.apiFormat,
      apiKey: body.apiKey,
      clearApiKey: body.clearApiKey,
      model: body.model,
      baseUrl: body.baseUrl,
      timeoutMs: body.timeoutMs,
    });

    return toDto();
  }

  async testSettings(body: TestAiSettingsRequestDto): Promise<AiConnectionTestDto> {
    const settings = await resolveAiRuntimeSettings(
      {
        provider: body.provider,
        apiFormat: body.apiFormat,
        apiKey: body.apiKey,
        clearApiKey: body.clearApiKey,
        model: body.model,
        baseUrl: body.baseUrl,
        timeoutMs: body.timeoutMs,
      },
      {
        allowTransientApiKey: true,
      }
    );

    if (settings.provider === "mock") {
      return {
        ok: true,
        status: "preview",
        message:
          "Preview mode does not contact an external AI API. Switch the provider to Live API to test a live connection.",
        provider: settings.provider,
        apiFormat: settings.apiFormat,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
      };
    }

    if (!settings.apiKeyConfigured) {
      return {
        ok: false,
        status: "error",
        message:
          "No API key is available for this configuration yet. Add a key or switch back to preview mode.",
        provider: settings.provider,
        apiFormat: settings.apiFormat,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
      };
    }

    const startedAt = Date.now();

    try {
      await testLiveEndpoint(settings);

      return {
        ok: true,
        status: "success",
        message: `Connected successfully. The ${settings.apiFormat === "chat_completions" ? "Chat Completions-compatible" : "Responses API"} endpoint accepted the key for model ${settings.model}.`,
        provider: settings.provider,
        apiFormat: settings.apiFormat,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        status: "error",
        message: buildAiProviderErrorMessage(error),
        provider: settings.provider,
        apiFormat: settings.apiFormat,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
        latencyMs: Date.now() - startedAt,
      };
    }
  }
}

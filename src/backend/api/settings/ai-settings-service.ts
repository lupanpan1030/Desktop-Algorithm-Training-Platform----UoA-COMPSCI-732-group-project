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

function buildOpenAiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage =
      typeof error.response?.data?.error?.message === "string"
        ? error.response.data.error.message
        : typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;

    if (status === 401) {
      return "OpenAI rejected the API key. Check that the key is valid and still active.";
    }

    if (status === 403) {
      return "OpenAI rejected the request. The API key may not have access to this model.";
    }

    if (status === 404) {
      return "The configured model or base URL could not be found. Check the model name and endpoint.";
    }

    if (status === 429) {
      return "OpenAI rate-limited the request. Try again in a moment.";
    }

    if (status && status >= 500) {
      return "OpenAI is temporarily unavailable. Try again shortly.";
    }

    if (error.code === "ECONNABORTED") {
      return "The connection test timed out before OpenAI responded.";
    }

    if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
      return "The app could not reach the configured OpenAI endpoint. Check the base URL and network access.";
    }

    if (apiMessage) {
      return apiMessage;
    }
  }

  return error instanceof Error
    ? error.message
    : "The connection test failed unexpectedly.";
}

export class AiSettingsService {
  async getSettings(): Promise<AiSettingsDto> {
    return toDto();
  }

  async updateSettings(body: UpdateAiSettingsRequestDto): Promise<AiSettingsDto> {
    await saveAiRuntimeSettings({
      provider: body.provider,
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
          "Preview mode does not contact OpenAI. Switch the provider to OpenAI to test a live connection.",
        provider: settings.provider,
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
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
      };
    }

    const startedAt = Date.now();

    try {
      await axios.get(`${settings.baseUrl.replace(/\/+$/, "")}/models/${encodeURIComponent(settings.model)}`, {
        timeout: settings.timeoutMs,
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return {
        ok: true,
        status: "success",
        message: `Connected successfully. OpenAI accepted the key for model ${settings.model}.`,
        provider: settings.provider,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        status: "error",
        message: buildOpenAiErrorMessage(error),
        provider: settings.provider,
        model: settings.model,
        baseUrl: settings.baseUrl,
        credentialSource: settings.apiKeySource,
        latencyMs: Date.now() - startedAt,
      };
    }
  }
}

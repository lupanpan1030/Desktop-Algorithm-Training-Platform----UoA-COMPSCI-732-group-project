import {
  resolveAiRuntimeSettings,
  saveAiRuntimeSettings,
} from "../../services/ai/ai-runtime-settings";
import { AiSettingsDto, UpdateAiSettingsRequestDto } from "./ai-settings";

function toDto(): AiSettingsDto {
  const settings = resolveAiRuntimeSettings();

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

export class AiSettingsService {
  getSettings(): AiSettingsDto {
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
}

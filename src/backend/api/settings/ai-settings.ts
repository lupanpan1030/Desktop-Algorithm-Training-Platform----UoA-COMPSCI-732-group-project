export class UpdateAiSettingsRequestDto {
  public provider?: "mock" | "openai";
  public apiKey?: string;
  public clearApiKey?: boolean;
  public model?: string;
  public baseUrl?: string;
  public timeoutMs?: number;
}

export interface AiSettingsDto {
  provider: "mock" | "openai";
  model: string;
  baseUrl: string;
  timeoutMs: number;
  apiKeyConfigured: boolean;
  apiKeySource: "saved" | "environment" | "none";
  apiKeyPreview: string | null;
  status: "preview" | "ready" | "misconfigured";
  statusLabel: string;
  statusReason: string;
  storagePath: string;
  storageScope: string;
}

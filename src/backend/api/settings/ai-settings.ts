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
  apiKeySource: "provided" | "system-keychain" | "legacy-file" | "environment" | "none";
  apiKeyPreview: string | null;
  status: "preview" | "ready" | "misconfigured";
  statusLabel: string;
  statusReason: string;
  storagePath: string;
  storageScope: string;
}

export class TestAiSettingsRequestDto {
  public provider?: "mock" | "openai";
  public apiKey?: string;
  public clearApiKey?: boolean;
  public model?: string;
  public baseUrl?: string;
  public timeoutMs?: number;
}

export interface AiConnectionTestDto {
  ok: boolean;
  status: "preview" | "success" | "error";
  message: string;
  provider: "mock" | "openai";
  model: string;
  baseUrl: string;
  credentialSource: "provided" | "system-keychain" | "legacy-file" | "environment" | "none";
  latencyMs?: number;
}

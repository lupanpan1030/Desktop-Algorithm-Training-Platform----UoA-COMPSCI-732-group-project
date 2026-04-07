import { AiProvider } from "./ai-provider";
import { MockAiProvider } from "./mock-ai-provider";
import { OpenAiProvider } from "./openai-provider";
import { resolveAiRuntimeSettings } from "../ai-runtime-settings";

export async function createAiProvider(): Promise<AiProvider> {
  const settings = await resolveAiRuntimeSettings();

  if (settings.provider === "openai" && settings.apiKeyConfigured) {
    return new OpenAiProvider(settings);
  }

  return new MockAiProvider();
}

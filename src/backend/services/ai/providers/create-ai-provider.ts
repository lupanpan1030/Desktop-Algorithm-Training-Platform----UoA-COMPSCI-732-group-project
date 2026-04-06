import { AiProvider } from "./ai-provider";
import { MockAiProvider } from "./mock-ai-provider";
import { OpenAiProvider } from "./openai-provider";
import { resolveAiRuntimeSettings } from "../ai-runtime-settings";

export function createAiProvider(): AiProvider {
  const settings = resolveAiRuntimeSettings();

  if (settings.provider === "openai" && settings.apiKeyConfigured) {
    return new OpenAiProvider();
  }

  return new MockAiProvider();
}

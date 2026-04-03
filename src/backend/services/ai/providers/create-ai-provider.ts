import { AiProvider } from "./ai-provider";
import { MockAiProvider } from "./mock-ai-provider";
import { OpenAiProvider } from "./openai-provider";

function normalizeProvider(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return "mock";
  }

  if (normalized === "openai") {
    return "openai";
  }

  return "mock";
}

export function createAiProvider(): AiProvider {
  const provider = normalizeProvider(process.env.AI_PROVIDER);

  if (provider === "openai") {
    return new OpenAiProvider();
  }

  return new MockAiProvider();
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAiProvider } from "../../../backend/services/ai/providers/openai-provider";
import { ResolvedAiRuntimeSettings } from "../../../backend/services/ai/ai-runtime-settings";

const axiosMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("axios", () => ({
  default: axiosMock,
}));

function buildSettings(
  overrides: Partial<ResolvedAiRuntimeSettings> = {}
): ResolvedAiRuntimeSettings {
  return {
    provider: "openai",
    apiFormat: "responses",
    model: "gpt-5-mini",
    baseUrl: "https://api.openai.com/v1",
    timeoutMs: 30000,
    apiKey: "sk-test",
    apiKeyConfigured: true,
    apiKeySource: "provided",
    apiKeyPreview: "••••test",
    status: "ready",
    statusLabel: "Live API (Responses)",
    statusReason: "Ready",
    storagePath: "/tmp/ai-settings.json",
    storageScope: "test",
    ...overrides,
  };
}

describe("OpenAiProvider", () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
  });

  it("uses the Responses API format by default", async () => {
    axiosMock.post.mockResolvedValueOnce({
      data: {
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  answer: "Use the current page context.",
                  inferredIntent: "explain_problem",
                  suggestions: ["Try a small example"],
                  sourcesUsed: ["Problem title"],
                }),
              },
            ],
          },
        ],
      },
    });

    const provider = new OpenAiProvider(buildSettings());
    const result = await provider.respond({
      action: "answer",
      userMessage: "Help",
      conversation: [],
      pageContext: {
        pageKind: "problem-detail",
        route: "/problems/1",
        pageTitle: "Two Sum",
        summary: "Array problem",
      },
    });

    expect(axiosMock.post).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        model: "gpt-5-mini",
        instructions: expect.any(String),
        input: expect.stringContaining("Two Sum"),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      })
    );
    expect(result.provider).toBe("openai:gpt-5-mini");
    expect(result.answer).toBe("Use the current page context.");
  });

  it("uses Chat Completions for OpenAI-compatible endpoints", async () => {
    axiosMock.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: "The compatible endpoint works.",
                inferredIntent: "general_question",
                suggestions: ["Ask for a hint"],
                sourcesUsed: ["Assistant Settings"],
              }),
            },
          },
        ],
      },
    });

    const provider = new OpenAiProvider(
      buildSettings({
        apiFormat: "chat_completions",
        model: "deepseek-v4-flash",
        baseUrl: "https://api.deepseek.com/",
      })
    );
    const result = await provider.respond({
      action: "answer",
      userMessage: "Test",
      conversation: [],
      pageContext: {
        pageKind: "assistant-settings",
        route: "/settings/ai",
        pageTitle: "Assistant Settings",
        summary: "Testing a live endpoint",
      },
    });

    expect(axiosMock.post).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        model: "deepseek-v4-flash",
        messages: [
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Always return valid JSON only."),
          }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Assistant Settings"),
          }),
        ],
        stream: false,
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      })
    );
    expect(result.provider).toBe("openai-compatible:deepseek-v4-flash");
    expect(result.answer).toBe("The compatible endpoint works.");
  });
});

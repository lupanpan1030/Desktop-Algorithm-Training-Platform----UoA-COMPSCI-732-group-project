import { describe, expect, it } from "vitest";
import { AiService } from "../../../backend/api/ai/ai-service";

describe("AiService", () => {
  it("returns problem-detail suggestions from the mock provider", async () => {
    const service = new AiService();

    const response = await service.respond({
      action: "suggest",
      pageContext: {
        pageKind: "problem-detail",
        route: "/problems/1",
        pageTitle: "Two Sum",
        summary: "A classic array problem with one visible solution path.",
        facts: [
          {
            key: "difficulty",
            label: "Difficulty",
            value: "EASY",
          },
        ],
      },
    });

    expect(response.provider).toBe("mock-assistant-preview");
    expect(response.inferredIntent).toBe("explain_problem");
    expect(response.suggestions.map((suggestion) => suggestion.prompt)).toContain(
      "Review my current code"
    );
  });

  it("infers code review intent from an explicit request", async () => {
    const service = new AiService();

    const response = await service.respond({
      action: "answer",
      userMessage: "Review my current code",
      pageContext: {
        pageKind: "problem-detail",
        route: "/problems/1",
        pageTitle: "Two Sum",
        summary: "The editor currently contains a draft solution.",
        facts: [
          {
            key: "currentLanguage",
            label: "Current language",
            value: "python",
          },
          {
            key: "codeLines",
            label: "Code lines",
            value: "12",
          },
        ],
      },
    });

    expect(response.inferredIntent).toBe("review_code");
    expect(response.answer).toContain("current code");
  });
});

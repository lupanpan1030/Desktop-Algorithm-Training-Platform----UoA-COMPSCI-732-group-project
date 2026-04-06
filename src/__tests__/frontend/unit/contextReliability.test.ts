import { describe, expect, it } from "vitest";
import { buildContextReliability } from "../../../frontend/ai/contextReliability";

describe("contextReliability", () => {
  it("returns a live context state for rich page context", () => {
    const result = buildContextReliability({
      pageContext: {
        pageKind: "problem-detail",
        route: "/problems/1",
        pageTitle: "Two Sum",
        summary: "Viewing Two Sum",
        facts: [
          { key: "difficulty", label: "Difficulty", value: "EASY" },
          { key: "language", label: "Language", value: "python" },
          { key: "judgeReady", label: "Judge", value: "ready" },
        ],
        contextText: ["Problem description", "Current code", "Latest run result"],
      },
      pending: false,
      error: null,
      restoredConversation: false,
    });

    expect(result.label).toBe("Live context");
    expect(result.tone).toBe("success");
  });

  it("returns a verification warning after assistant errors", () => {
    const result = buildContextReliability({
      pageContext: {
        pageKind: "language-admin",
        route: "/languages",
        pageTitle: "Language Management",
        summary: "Managing languages",
      },
      pending: false,
      error: "Network error",
      restoredConversation: true,
    });

    expect(result.label).toBe("Needs verification");
    expect(result.tone).toBe("warning");
  });
});

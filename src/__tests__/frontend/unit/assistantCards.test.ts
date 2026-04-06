import { describe, expect, it } from "vitest";
import { buildAssistantCards } from "../../../frontend/ai/assistantCards";

describe("assistantCards", () => {
  it("returns no cards for user messages", () => {
    expect(
      buildAssistantCards({
        id: "user-1",
        role: "user",
        content: "hello",
      })
    ).toEqual([]);
  });

  it("builds focus, highlights, and source cards for assistant replies", () => {
    const cards = buildAssistantCards({
      id: "assistant-1",
      role: "assistant",
      content:
        'You are looking at "Two Sum". Start by confirming the input and output contract. Then test one small example before changing the code again.',
      inferredIntent: "explain_problem",
      sourcesUsed: ["page title", "summary", "difficulty"],
    });

    expect(cards.map((card) => card.title)).toEqual([
      "Focus",
      "Key points",
      "Grounded in",
    ]);
    expect(cards[0]?.entries).toContain("Problem explanation");
    expect(cards[1]?.entries.length).toBeGreaterThan(1);
    expect(cards[2]?.entries).toContain("page title");
  });
});

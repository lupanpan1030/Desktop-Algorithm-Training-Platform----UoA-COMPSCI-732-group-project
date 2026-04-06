import { beforeEach, describe, expect, it } from "vitest";
import {
  clearConversationForRoute,
  listConversationThreads,
  loadConversationForRoute,
  saveConversationForRoute,
} from "../../../frontend/ai/conversationStorage";

describe("conversationStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and loads route-scoped assistant conversations", () => {
    saveConversationForRoute("/problems/1", "Two Sum", [
      {
        id: "user-1",
        role: "user",
        content: "Explain this problem",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Start with the contract.",
        inferredIntent: "explain_problem",
        sourcesUsed: ["page title"],
      },
    ]);

    expect(loadConversationForRoute("/problems/1")).toEqual([
      {
        id: "user-1",
        role: "user",
        content: "Explain this problem",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Start with the contract.",
        inferredIntent: "explain_problem",
        sourcesUsed: ["page title"],
      },
    ]);
    expect(loadConversationForRoute("/problems/2")).toEqual([]);
  });

  it("lists stored threads with page metadata", () => {
    saveConversationForRoute("/problems/1", "Two Sum", [
      {
        id: "user-1",
        role: "user",
        content: "Explain this problem",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Start with the contract.",
        inferredIntent: "explain_problem",
        sourcesUsed: ["page title"],
      },
    ]);
    saveConversationForRoute("/languages", "Language Management", [
      {
        id: "assistant-2",
        role: "assistant",
        content: "Check the run command first.",
      },
    ]);

    const threads = listConversationThreads();
    const problemThread = threads.find((thread) => thread.pageTitle === "Two Sum");
    const languageThread = threads.find(
      (thread) => thread.pageTitle === "Language Management"
    );

    expect(threads.map((thread) => thread.pageTitle).sort()).toEqual([
      "Language Management",
      "Two Sum",
    ]);
    expect(languageThread?.messageCount).toBe(1);
    expect(problemThread?.preview).toContain("Start with the contract");
  });

  it("clears the persisted conversation for a route", () => {
    saveConversationForRoute("/languages", "Language Management", [
      {
        id: "assistant-1",
        role: "assistant",
        content: "Check the run command.",
      },
    ]);

    clearConversationForRoute("/languages");

    expect(loadConversationForRoute("/languages")).toEqual([]);
  });
});

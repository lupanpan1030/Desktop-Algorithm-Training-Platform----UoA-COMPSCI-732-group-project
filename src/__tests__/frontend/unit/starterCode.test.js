import { describe, expect, it } from "vitest";
import {
  buildStarterCodeLookup,
  getStarterCodeForLanguage,
  normalizeStarterLanguageKey,
} from "../../../frontend/utils/starterCode";

describe("starterCode utils", () => {
  it("normalizes common language aliases", () => {
    expect(normalizeStarterLanguageKey("Python3")).toBe("python");
    expect(normalizeStarterLanguageKey("C++")).toBe("cpp");
    expect(normalizeStarterLanguageKey("golang")).toBe("go");
  });

  it("builds a lookup from language slug and language name", () => {
    const lookup = buildStarterCodeLookup([
      {
        languageSlug: "python3",
        languageName: "Python3",
        template: "class Solution:\n    pass",
      },
      {
        languageSlug: "cpp",
        languageName: "C++",
        template: "class Solution {};",
      },
    ]);

    expect(lookup.python).toContain("class Solution");
    expect(lookup.cpp).toContain("class Solution");
  });

  it("returns the matching starter code for the current editor language", () => {
    const starterCodes = [
      {
        languageSlug: "python3",
        languageName: "Python3",
        template: "class Solution:\n    pass",
      },
      {
        languageSlug: "javascript",
        languageName: "JavaScript",
        template: "function solve() {}",
      },
    ];

    expect(getStarterCodeForLanguage("python", starterCodes)).toContain("class Solution");
    expect(getStarterCodeForLanguage("javascript", starterCodes)).toContain("function solve");
    expect(getStarterCodeForLanguage("java", starterCodes)).toBe("");
  });
});

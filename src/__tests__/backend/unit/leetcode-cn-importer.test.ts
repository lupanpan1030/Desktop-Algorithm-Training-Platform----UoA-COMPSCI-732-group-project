import { describe, expect, it } from "vitest";
import {
  extractLeetCodeCnQuestion,
  normalizeLeetCodeCnQuestion,
  parseImportCliArgs,
} from "../../../backend/db/importers/leetcode-cn-importer";

describe("leetcode-cn-importer", () => {
  it("normalizes a structured LeetCode CN question into local problem data", () => {
    const payload = {
      data: {
        question: {
          title: "Contains Duplicate III",
          translatedTitle: "存在重复元素 III",
          titleSlug: "contains-duplicate-iii",
          content: "<p>english</p>",
          translatedContent: "<p>中文题面</p>",
          difficulty: "Hard",
          questionFrontendId: "220",
          sampleTestCase: "[1,2,3,1]\n3\n0",
          topicTags: [
            { name: "Array", slug: "array", translatedName: "数组" },
            { name: "Ordered Set", slug: "ordered-set", translatedName: "有序集合" },
          ],
          codeSnippets: [
            { lang: "JavaScript", langSlug: "javascript", code: "function test() {}" },
            { lang: "Python", langSlug: "python", code: "def test():\n    pass" },
          ],
        },
      },
    };

    const question = extractLeetCodeCnQuestion(payload);
    expect(question).not.toBeNull();

    const normalized = normalizeLeetCodeCnQuestion(
      question as NonNullable<typeof question>,
      "contains-duplicate-iii.json"
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.importKey).toBe("LEETCODE:zh-CN:contains-duplicate-iii");
    expect(normalized?.title).toBe("存在重复元素 III");
    expect(normalized?.description).toBe("<p>中文题面</p>");
    expect(normalized?.difficulty).toBe("HARD");
    expect(normalized?.externalProblemId).toBe("220");
    expect(normalized?.tags.map((tag) => tag.name)).toEqual([
      "Array",
      "Ordered Set",
    ]);
    expect(normalized?.starterCodes.map((snippet) => snippet.languageSlug)).toEqual([
      "javascript",
      "python",
    ]);
  });

  it("skips entries without usable content", () => {
    const normalized = normalizeLeetCodeCnQuestion(
      {
        title: "The Maze III",
        translatedTitle: "迷宫 III",
        titleSlug: "the-maze-iii",
        translatedContent: null,
        content: null,
        difficulty: "Hard",
      },
      "[no content]the-maze-iii.json"
    );

    expect(normalized).toBeNull();
  });

  it("parses importer CLI flags", () => {
    const options = parseImportCliArgs([
      "--source",
      "/tmp/leetcode-cn/originData",
      "--limit",
      "25",
      "--dry-run",
      "--database",
      "./tmp/dev.db",
      "--verbose",
    ]);

    expect(options.sourcePath).toBe("/tmp/leetcode-cn/originData");
    expect(options.limit).toBe(25);
    expect(options.dryRun).toBe(true);
    expect(options.verbose).toBe(true);
    expect(options.databasePath).toContain("tmp/dev.db");
  });
});

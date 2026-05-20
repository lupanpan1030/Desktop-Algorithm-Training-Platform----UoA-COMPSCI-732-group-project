import { describe, expect, it } from "vitest";
import {
  parseLeetCodeTestcaseArguments,
  prepareLeetCodeJudgeRun,
} from "../../../backend/services/judge/leetcode-adapter";

const baseProblem: any = {
  source: "LEETCODE",
  starter_codes: [
    {
      language_slug: "javascript",
      language_name: "JavaScript",
      template: "var twoSum = function(nums, target) {};",
    },
    {
      language_slug: "python3",
      language_name: "Python3",
      template: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
    },
  ],
};

describe("leetcode-adapter", () => {
  it("parses named LeetCode testcase arguments in function parameter order", () => {
    expect(
      parseLeetCodeTestcaseArguments("nums = [2,7,11,15], target = 9", [
        "nums",
        "target",
      ])
    ).toEqual([[2, 7, 11, 15], 9]);
  });

  it("wraps JavaScript solution functions with a JSON argument harness", () => {
    const prepared = prepareLeetCodeJudgeRun({
      problem: baseProblem,
      language: {
        languageId: 2,
        name: "JavaScript",
        suffix: "js",
        version: "20",
        compilerCmd: null,
        runtimeCmd: "node {source}",
        isDefault: false,
      },
      code: "var twoSum = function(nums, target) { return [0, 1]; };",
      testCases: [
        {
          testcaseId: 1,
          input: "nums = [2,7,11,15], target = 9",
          expectedOutput: "[0,1]",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: true,
          source: "IMPORTED_SAMPLE",
          reviewStatus: "REVIEWED",
        },
      ],
    });

    expect(prepared?.code).toContain("twoSum(...__args)");
    expect(prepared?.testCases).toEqual([
      {
        input: "[[2,7,11,15],9]",
        timeLimitMs: 1000,
        memoryLimitMb: 128,
      },
    ]);
  });

  it("wraps Python Solution methods with a JSON argument harness", () => {
    const prepared = prepareLeetCodeJudgeRun({
      problem: baseProblem,
      language: {
        languageId: 1,
        name: "Python",
        suffix: "py",
        version: "3.12",
        compilerCmd: null,
        runtimeCmd: "python3 {source}",
        isDefault: true,
      },
      code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]",
      testCases: [
        {
          testcaseId: 1,
          input: "nums = [2,7,11,15], target = 9",
          expectedOutput: "[0,1]",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: true,
          source: "IMPORTED_SAMPLE",
          reviewStatus: "REVIEWED",
        },
      ],
    });

    expect(prepared?.code).toContain("Solution().twoSum");
    expect(prepared?.testCases[0].input).toBe("[[2,7,11,15],9]");
  });
});

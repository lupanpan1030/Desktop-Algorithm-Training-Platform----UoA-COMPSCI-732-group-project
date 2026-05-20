import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ProblemContent from "../../../frontend/components/ProblemContent";

const richProblem = {
  problemId: 1,
  title: "Boundary Problem",
  source: "LOCAL",
  externalProblemId: "edge-1",
  sourceSlug: "boundary-problem",
  difficulty: "HARD",
  locale: "en",
  availableLocales: ["en", "zh-CN"],
  judgeReady: true,
  sampleCaseCount: 1,
  hiddenCaseCount: 2,
  tags: ["arrays", "edge-case"],
  description:
    "Solve **carefully**.\n\n<img src=x onerror=\"window.__bad = true\"><script>window.__script = true</script>",
  sampleTestcase: "1 2\n3",
  starterCodes: [
    { languageName: "Python", template: "print('x')" },
    { languageName: "Python", template: "print('y')" },
    { languageName: "JavaScript", template: "console.log('x')" },
  ],
  examples: [
    {
      input: "1 2",
      output: "3",
      explanation: "Adds both values.",
    },
  ],
  constraints: ["1 <= n <= 10", "values fit in signed 32-bit integers"],
};

afterEach(() => {
  cleanup();
});

describe("ProblemContent", () => {
  test("renders optional sections, deduplicates starter languages, and sanitizes markdown", () => {
    const onLocaleChange = vi.fn();
    const { container } = render(
      <ProblemContent problem={richProblem} onLocaleChange={onLocaleChange} />
    );

    expect(screen.getByRole("heading", { name: "Boundary Problem" })).toBeInTheDocument();
    expect(screen.getByText("Imported Sample Reference")).toBeInTheDocument();
    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("1 <= n <= 10")).toBeInTheDocument();
    expect(screen.getAllByText("Python")).toHaveLength(1);
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("onerror");

    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(onLocaleChange).toHaveBeenCalledWith("zh-CN");
  });

  test("omits optional sections when data is absent", () => {
    render(
      <ProblemContent
        problem={{
          ...richProblem,
          availableLocales: ["en"],
          sampleTestcase: null,
          starterCodes: [],
          examples: [],
          constraints: null,
          tags: [],
        }}
      />
    );

    expect(screen.queryByText("Imported Sample Reference")).not.toBeInTheDocument();
    expect(screen.queryByText("Starter Code")).not.toBeInTheDocument();
    expect(screen.queryByText("Examples")).not.toBeInTheDocument();
    expect(screen.queryByText("Constraints")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "中文" })).not.toBeInTheDocument();
  });
});

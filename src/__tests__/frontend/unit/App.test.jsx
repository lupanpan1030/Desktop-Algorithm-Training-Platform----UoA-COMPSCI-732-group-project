import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import App from "../../../frontend/App";
import { useApi } from "../../../frontend/hooks/useApi";

vi.mock("../../../frontend/hooks/useApi", () => ({
  useApi: vi.fn(),
}));

const mockProblems = [
  {
    problemId: 1,
    title: "Two Sum",
    difficulty: "EASY",
    completionState: "Unattempted",
    source: "LOCAL",
    locale: "en",
    judgeReady: true,
    testcaseCount: 2,
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.mocked(useApi).mockReturnValue({
    getProblems: vi.fn().mockResolvedValue(mockProblems),
    loading: false,
    error: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("App", () => {
  test("renders the main navigation and list page on startup", async () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Languages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Problem Admin" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open ai assistant/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Problem List")).toBeInTheDocument();
    });
  });
});

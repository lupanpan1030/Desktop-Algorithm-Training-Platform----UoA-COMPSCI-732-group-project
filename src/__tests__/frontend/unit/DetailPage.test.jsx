import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DetailPage from "../../../frontend/pages/DetailPage";
import { ProblemLocaleProvider } from "../../../frontend/problem-locale";
import { useApi } from "../../../frontend/hooks/useApi";

const mockDetailPageState = vi.hoisted(() => ({
  latestSubmissionProps: null,
}));

vi.mock("../../../frontend/hooks/useApi", () => ({
  useApi: vi.fn(),
}));

vi.mock("../../../frontend/components/ProblemContent", () => ({
  default: ({ problem }) => <div>{problem.title}</div>,
}));

vi.mock("../../../frontend/ai/useAiPageContext", () => ({
  useAiPageContext: vi.fn(),
}));

vi.mock("../../../frontend/components/Editor/Editor", () => ({
  default: ({ onCodeChange, loadedDraft }) => (
    <div>
      <button
        type="button"
        onClick={() => onCodeChange({ code: loadedDraft?.code || "edited", language: "python" })}
      >
        edit-current-language
      </button>
      <button
        type="button"
        onClick={() =>
          onCodeChange({
            code: "console.log('js')",
            language: "javascript",
          })
        }
      >
        switch-to-javascript
      </button>
      <div data-testid="loaded-draft-language">{loadedDraft?.language ?? ""}</div>
      <div data-testid="loaded-draft-code">{loadedDraft?.code ?? ""}</div>
    </div>
  ),
}));

vi.mock("../../../frontend/components/Run&SubmitButton", () => ({
  default: (props) => {
    mockDetailPageState.latestSubmissionProps = props;

    return (
      <div>
        <div data-testid="submission-language-id">
          {props.languageId == null ? "null" : String(props.languageId)}
        </div>
        <div data-testid="blocked-reason">{props.actionBlockedReason ?? ""}</div>
        <button
          type="button"
          onClick={() =>
            props.onRestoreSubmission?.({
              submissionId: 99,
              code: "class Solution {}",
              languageId: 7,
              status: "ACCEPTED",
              submittedAt: "2026-04-02T00:00:00.000Z",
              results: [],
            })
          }
        >
          restore-missing-language
        </button>
      </div>
    );
  },
}));

const mockProblem = {
  problemId: 1,
  title: "Two Sum",
  description: "Add two numbers.",
  difficulty: "EASY",
  source: "LOCAL",
  locale: "en",
  defaultLocale: "en",
  availableLocales: ["en"],
  judgeReady: true,
  testcaseCount: 2,
  sampleCaseCount: 1,
  hiddenCaseCount: 1,
  sampleReferenceAvailable: false,
  tags: ["array"],
  starterCodes: [],
  sampleTestcase: null,
};

function renderDetailPage() {
  return render(
    <ProblemLocaleProvider>
      <MemoryRouter initialEntries={["/problems/1"]}>
        <Routes>
          <Route path="/problems/:id" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    </ProblemLocaleProvider>
  );
}

function mockDetailPageApis(problemApi, languageApi) {
  let callCount = 0;
  vi.mocked(useApi).mockImplementation(() => {
    callCount += 1;
    return callCount % 2 === 1 ? problemApi : languageApi;
  });
}

beforeEach(() => {
  localStorage.clear();
  mockDetailPageState.latestSubmissionProps = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("DetailPage", () => {
  it("blocks restored submissions with unavailable languages until the user picks a supported one", async () => {
    mockDetailPageApis(
      {
        getProblem: vi.fn().mockResolvedValue(mockProblem),
        loading: false,
        error: null,
      },
      {
        getLanguages: vi.fn().mockResolvedValue([
          { languageId: 1, name: "Python" },
          { languageId: 2, name: "JavaScript" },
        ]),
        loading: false,
        error: null,
      }
    );

    renderDetailPage();

    await screen.findByText("Two Sum");
    await waitFor(() => {
      expect(screen.getByTestId("submission-language-id")).toHaveTextContent("1");
      expect(screen.getByTestId("blocked-reason")).toHaveTextContent(/^$/);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "restore-missing-language" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("submission-language-id")).toHaveTextContent("null");
      expect(screen.getByTestId("blocked-reason")).toHaveTextContent(
        "This code was restored from language #7"
      );
    });
    expect(screen.getByTestId("loaded-draft-code")).toHaveTextContent(
      "class Solution {}"
    );

    fireEvent.click(
      screen.getByRole("button", { name: "edit-current-language" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("blocked-reason")).toHaveTextContent(
        "This code was restored from language #7"
      );
    });

    fireEvent.click(
      screen.getByRole("button", { name: "switch-to-javascript" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("submission-language-id")).toHaveTextContent("2");
      expect(screen.getByTestId("blocked-reason")).toHaveTextContent(/^$/);
    });
  });

  it("surfaces language configuration request failures instead of claiming the language is unavailable", async () => {
    mockDetailPageApis(
      {
        getProblem: vi.fn().mockResolvedValue(mockProblem),
        loading: false,
        error: null,
      },
      {
        getLanguages: vi.fn().mockResolvedValue(null),
        loading: false,
        error: new Error("Network down"),
      }
    );

    renderDetailPage();

    await screen.findByText("Two Sum");
    await waitFor(() => {
      expect(screen.getByTestId("blocked-reason")).toHaveTextContent(
        "Failed to load language configuration: Network down"
      );
    });
    expect(screen.getByTestId("blocked-reason")).not.toHaveTextContent(
      'The current language "python" is not available'
    );
  });
});

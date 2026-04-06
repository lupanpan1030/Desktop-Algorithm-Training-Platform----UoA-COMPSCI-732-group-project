import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../frontend/api/axiosInstance";
import {
  GlobalAiAssistantProvider,
  useGlobalAiAssistant,
} from "../../../frontend/ai/GlobalAiAssistantProvider";
import { useAiPageContext } from "../../../frontend/ai/useAiPageContext";

vi.mock("../../../frontend/api/axiosInstance", () => ({
  default: {
    post: vi.fn(),
  },
}));

function ContextRegistrar({ pageContext }) {
  useAiPageContext(pageContext);
  return null;
}

function TestHarness({ pageContext }) {
  const { openAssistant } = useGlobalAiAssistant();

  return (
    <>
      <ContextRegistrar pageContext={pageContext} />
      <button type="button" onClick={openAssistant}>
        open-assistant
      </button>
    </>
  );
}

function renderHarness(pageContext) {
  return render(
    <GlobalAiAssistantProvider>
      <TestHarness pageContext={pageContext} />
    </GlobalAiAssistantProvider>
  );
}

const baseResponse = {
  data: {
    answer: "",
    inferredIntent: "suggest",
    provider: "mock",
    sourcesUsed: ["pageContext.summary"],
    suggestions: [
      {
        id: "suggestion-1",
        label: "Explain this page",
        prompt: "Explain this page",
      },
    ],
  },
};

describe("GlobalAiAssistantProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.post).mockResolvedValue(baseResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("only auto-refreshes suggestions once per open session on the same route", async () => {
    const firstContext = {
      pageKind: "problem-detail",
      route: "/problems/1",
      pageTitle: "Two Sum",
      summary: "Viewing Two Sum with Python selected.",
      facts: [
        {
          key: "language",
          label: "Current language",
          value: "python",
        },
      ],
      contextText: ["Current editor code (python): empty"],
    };

    const { rerender } = renderHarness(firstContext);

    fireEvent.click(screen.getByRole("button", { name: "open-assistant" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    rerender(
      <GlobalAiAssistantProvider>
        <TestHarness
          pageContext={{
            ...firstContext,
            summary: "Viewing Two Sum with Python selected and 4 code lines.",
            facts: [
              {
                key: "language",
                label: "Current language",
                value: "python",
              },
              {
                key: "codeLines",
                label: "Code lines",
                value: "4",
              },
            ],
            contextText: ["Current editor code (python): print('hello')"],
          }}
        />
      </GlobalAiAssistantProvider>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    rerender(
      <GlobalAiAssistantProvider>
        <TestHarness
          pageContext={{
            pageKind: "assistant-settings",
            route: "/settings/ai",
            pageTitle: "Assistant Settings",
            summary: "Configuring the assistant provider.",
            facts: [
              {
                key: "provider",
                label: "Selected provider",
                value: "mock",
              },
            ],
            contextText: ["Provider is mock."],
          }}
        />
      </GlobalAiAssistantProvider>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
    });
  });
});

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import AiTestDraftReviewPanel from "../../../frontend/components/problems/AiTestDraftReviewPanel";

function buildProps(overrides = {}) {
  return {
    selectedProblemTitle: "Two Sum",
    disabled: false,
    loading: false,
    savingIds: [],
    selectedIds: ["draft-1"],
    provider: "mock-assistant-preview",
    warnings: [],
    error: null,
    drafts: [
      {
        id: "draft-1",
        input: "nums = [2,7,11,15], target = 9",
        expectedOutput: "[0,1]",
        isSample: true,
        rationale: "Matches the explicit sample reference.",
        confidence: "low",
        riskFlags: ["requires_manual_output_review"],
        sourceHints: ["sample reference"],
      },
    ],
    requestOptions: {
      targetCount: 5,
      includeSampleDrafts: true,
      includeHiddenDrafts: true,
    },
    onGenerate: vi.fn(),
    onClear: vi.fn(),
    onUpdateRequest: vi.fn(),
    onSaveDraft: vi.fn(),
    onSaveSelected: vi.fn(),
    onSaveBatchReady: vi.fn(),
    onDiscardDraft: vi.fn(),
    onDiscardSelected: vi.fn(),
    onUpdateDraft: vi.fn(),
    onToggleDraftSelection: vi.fn(),
    onSelectAll: vi.fn(),
    onSelectBatchReady: vi.fn(),
    ...overrides,
  };
}

describe("AiTestDraftReviewPanel", () => {
  test("renders human-readable provenance and review gate labels", () => {
    render(<AiTestDraftReviewPanel {...buildProps()} />);

    expect(screen.getByText("From sample reference")).toBeInTheDocument();
    expect(screen.getByText("Manual review required")).toBeInTheDocument();
    expect(screen.getByText("Manual review gate")).toBeInTheDocument();
    expect(screen.getAllByText("Review output manually").length).toBeGreaterThan(0);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("1 need manual review")).toBeInTheDocument();
    expect(screen.getByText(/will be skipped by bulk save/i)).toBeInTheDocument();
    expect(screen.getAllByText("Save selected")[0]?.closest("button")).toHaveAttribute("disabled");
  });

  test("enables batch save controls for batch-ready drafts and wires request toggles", () => {
    const props = buildProps({
      drafts: [
        {
          id: "draft-1",
          input: "1\n2",
          expectedOutput: "3",
          isSample: false,
          rationale: "Straightforward hidden case.",
          confidence: "high",
          riskFlags: [],
          sourceHints: ["problem description"],
        },
      ],
    });
    render(<AiTestDraftReviewPanel {...props} />);

    const getEnabledVisibleButton = (label) => {
      const button = screen
        .getAllByText(label)
        .map((element) => element.closest("button"))
        .find((candidate) => candidate && !candidate.hasAttribute("disabled"));

      expect(button).toBeTruthy();
      return button;
    };

    expect(getEnabledVisibleButton("Save selected")).not.toHaveAttribute("disabled");
    expect(getEnabledVisibleButton("Save batch-ready")).not.toHaveAttribute("disabled");
    expect(getEnabledVisibleButton("Discard selected")).not.toHaveAttribute("disabled");

    expect(getEnabledVisibleButton("Select batch-ready")).toBeInTheDocument();
    expect(getEnabledVisibleButton("Clear selection")).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText(/sample drafts/i).at(-1));
    fireEvent.click(screen.getAllByLabelText(/hidden drafts/i).at(-1));
    fireEvent.click(screen.getAllByLabelText(/select draft draft-1/i).at(-1));

    expect(props.onToggleDraftSelection).toHaveBeenCalledWith("draft-1");
    expect(props.onUpdateRequest).toHaveBeenCalledWith({ includeSampleDrafts: false });
    expect(props.onUpdateRequest).toHaveBeenCalledWith({ includeHiddenDrafts: false });
  });
});

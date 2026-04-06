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
    onSaveHighConfidence: vi.fn(),
    onDiscardDraft: vi.fn(),
    onDiscardSelected: vi.fn(),
    onUpdateDraft: vi.fn(),
    onToggleDraftSelection: vi.fn(),
    onSelectAll: vi.fn(),
    onSelectHighConfidence: vi.fn(),
    ...overrides,
  };
}

describe("AiTestDraftReviewPanel", () => {
  test("renders human-readable provenance and risk labels", () => {
    render(<AiTestDraftReviewPanel {...buildProps()} />);

    expect(screen.getByText("From sample reference")).toBeInTheDocument();
    expect(screen.getByText("Manual review required")).toBeInTheDocument();
    expect(screen.getAllByText("Review output manually").length).toBeGreaterThan(0);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  test("wires selection controls and request toggles", () => {
    const props = buildProps();
    render(<AiTestDraftReviewPanel {...props} />);

    const getVisibleButton = (label) => {
      const button = screen.getAllByText(label)[0]?.closest("button");

      expect(button).toBeTruthy();
      return button;
    };

    expect(getVisibleButton("Save selected")).not.toHaveAttribute("disabled");
    expect(getVisibleButton("Discard selected")).not.toHaveAttribute("disabled");

    expect(getVisibleButton("Select high confidence")).toBeInTheDocument();
    expect(getVisibleButton("Clear selection")).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText(/sample drafts/i).at(-1));
    fireEvent.click(screen.getAllByLabelText(/hidden drafts/i).at(-1));
    fireEvent.click(screen.getAllByLabelText(/select draft draft-1/i).at(-1));

    expect(props.onToggleDraftSelection).toHaveBeenCalledWith("draft-1");
    expect(props.onUpdateRequest).toHaveBeenCalledWith({ includeSampleDrafts: false });
    expect(props.onUpdateRequest).toHaveBeenCalledWith({ includeHiddenDrafts: false });
  });
});

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SubmissionHistoryPanel from "../../../frontend/components/submissions/SubmissionHistoryPanel";

type SubmissionHistoryPanelProps = React.ComponentProps<
  typeof SubmissionHistoryPanel
>;

const baseProps: SubmissionHistoryPanelProps = {
  availableStatuses: ["ACCEPTED", "COMPILE_ERROR"],
  detailLoading: false,
  errorMessage: null,
  languageLabels: {},
  listLoading: false,
  onChangeStatusFilter: vi.fn(),
  onRefresh: vi.fn(),
  onRestoreSubmission: vi.fn(),
  onSelectSubmission: vi.fn(),
  selectedSubmission: null,
  selectedSubmissionId: null,
  statusFilter: "ALL",
  submissions: [],
  totalSubmissionCount: 0,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SubmissionHistoryPanel", () => {
  test("shows a filtered empty state without losing the total history count", () => {
    render(
      <SubmissionHistoryPanel
        {...baseProps}
        statusFilter="COMPILE_ERROR"
        totalSubmissionCount={2}
      />
    );

    expect(screen.getByText("0/2 shown")).toBeTruthy();
    expect(
      screen.getByText("No submissions match the current status filter.")
    ).toBeTruthy();
  });

  test("supports keyboard selection and falls back for unknown language and invalid dates", () => {
    const onSelectSubmission = vi.fn();

    render(
      <SubmissionHistoryPanel
        {...baseProps}
        onSelectSubmission={onSelectSubmission}
        submissions={[
          {
            submissionId: 5,
            languageId: 99,
            status: "RUNTIME_ERROR",
            submittedAt: "not-a-date",
          },
        ]}
        totalSubmissionCount={1}
      />
    );

    expect(screen.getByText("1 record")).toBeTruthy();
    expect(screen.getByText("Language #99")).toBeTruthy();
    expect(screen.getByText("not-a-date")).toBeTruthy();

    const option = screen.getByRole("option", { name: /submission #5/i });
    fireEvent.keyDown(option, { key: "Enter" });
    fireEvent.keyDown(option, { key: " " });

    expect(onSelectSubmission).toHaveBeenCalledTimes(2);
    expect(onSelectSubmission).toHaveBeenNthCalledWith(1, 5);
    expect(onSelectSubmission).toHaveBeenNthCalledWith(2, 5);
  });

  test("renders selected submission diagnostics and restore action", () => {
    const onRestoreSubmission = vi.fn();

    render(
      <SubmissionHistoryPanel
        {...baseProps}
        languageLabels={{ 1: "Python" }}
        onRestoreSubmission={onRestoreSubmission}
        selectedSubmissionId={7}
        selectedSubmission={{
          submissionId: 7,
          languageId: 1,
          code: "print('ok')",
          status: "ACCEPTED",
          submittedAt: "2026-04-02T00:00:00.000Z",
          results: [
            {
              status: "ACCEPTED",
              output: "ok",
              runtimeMs: 12,
              memoryKb: 64,
            },
          ],
        }}
        submissions={[
          {
            submissionId: 7,
            languageId: 1,
            status: "ACCEPTED",
            submittedAt: "2026-04-02T00:00:00.000Z",
          },
        ]}
        totalSubmissionCount={1}
      />
    );

    expect(screen.getAllByText("Submission #7")).toHaveLength(2);
    expect(screen.getByText(/Language: Python/)).toBeTruthy();
    expect(screen.getByText("Status: ACCEPTED")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Load Into Editor" }));
    expect(onRestoreSubmission).toHaveBeenCalledOnce();
  });
});

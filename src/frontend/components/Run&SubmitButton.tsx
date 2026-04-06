import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import { alpha, useTheme } from "@mui/material";
import {
  SubmitResponse,
  SubmissionDetail,
  SubmissionListItem,
  RunResponse,
  useApi,
} from "../hooks/useApi";
import TestResultCard from "./TestResultCard";
import SubmissionHistoryPanel from "./submissions/SubmissionHistoryPanel";
import { ResponsiveButton } from "./common/ResponsiveComponents";

interface CodeSubmissionProps {
  problemId: number;
  code: string;
  languageId: number | null;
  languageLabels?: Record<number, string>;
  onRestoreSubmission?: (submission: SubmissionDetail) => void;
  onAssistantSnapshotChange?: (snapshot: AssistantResultSnapshot) => void;
  actionBlockedReason?: string | null;
}

type ResultView = "history" | "run" | "submit";

const EMPTY_LANGUAGE_LABELS: Record<number, string> = {};
const ALL_SUBMISSION_STATUSES = "ALL";

const buildFailureMessage = (fallback: string, error: unknown) =>
  error instanceof Error && error.message ? error.message : fallback;

type DiagnosticResult = {
  status: string;
  output?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  phase?: string;
  timedOut?: boolean;
  expectedOutput?: string;
  runtimeMs: number;
  memoryKb: number;
};

export interface AssistantResultSnapshot {
  activeView: ResultView;
  latestRunStatus: string | null;
  latestSubmitStatus: string | null;
  latestHistoryStatus: string | null;
  latestError: string | null;
  latestPhase: string | null;
  latestTrace: string | null;
  submissionCount: number;
}

function getMostRelevantResult(results?: DiagnosticResult[]) {
  if (!results?.length) {
    return null;
  }

  return (
    results.find((result) => result.status !== "ACCEPTED") ??
    results.find((result) => result.stderr || result.output || result.stdout) ??
    results[0]
  );
}

function buildTrace(result: DiagnosticResult | null) {
  if (!result) {
    return null;
  }

  const segments = [
    result.phase ? `phase=${result.phase}` : null,
    `status=${result.status}`,
    result.timedOut ? "timedOut=true" : null,
    result.exitCode != null ? `exitCode=${result.exitCode}` : null,
    result.stderr ? `stderr=${result.stderr}` : null,
    result.output ? `output=${result.output}` : null,
    result.stdout ? `stdout=${result.stdout}` : null,
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(" | ") : null;
}

const ResultList = ({
  title,
  statusLabel,
  results,
}: {
  title: string;
  statusLabel?: string;
  results: Array<{
    status: string;
    output?: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number | null;
    phase?: string;
    timedOut?: boolean;
    expectedOutput?: string;
    runtimeMs: number;
    memoryKb: number;
  }>;
}) => (
  <>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {statusLabel && (
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
        Overall Status:{" "}
        <Box
          component="span"
          sx={{
            color: statusLabel === "ACCEPTED" ? "success.main" : "error.main",
          }}
        >
          {statusLabel}
        </Box>
      </Typography>
    )}
    {results.map((test, index) => (
      <TestResultCard key={`${title}-${index}`} test={test} />
    ))}
  </>
);

const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ py: 3 }}>
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

const CodeSubmission: React.FC<CodeSubmissionProps> = ({
  problemId,
  code,
  languageId,
  languageLabels = EMPTY_LANGUAGE_LABELS,
  onRestoreSubmission,
  onAssistantSnapshotChange,
  actionBlockedReason = null,
}) => {
  const { runCode, submitCode, getSubmissions, getSubmission } = useApi();
  const [runResults, setRunResults] = useState<RunResponse | null>(null);
  const [submitResults, setSubmitResults] = useState<SubmitResponse | null>(
    null
  );
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState(
    ALL_SUBMISSION_STATUSES
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info">(
    "info"
  );
  const [activeView, setActiveView] = useState<ResultView>("history");
  const theme = useTheme();

  const availableStatuses = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.status))),
    [submissions]
  );

  const visibleSubmissions = useMemo(() => {
    if (historyStatusFilter === ALL_SUBMISSION_STATUSES) {
      return submissions;
    }

    return submissions.filter(
      (submission) => submission.status === historyStatusFilter
    );
  }, [historyStatusFilter, submissions]);

  const assistantSnapshot = useMemo<AssistantResultSnapshot>(() => {
    const runResult = getMostRelevantResult(runResults?.results);
    const submitResult = getMostRelevantResult(submitResults?.results);
    const historyResult = getMostRelevantResult(selectedSubmission?.results);

    return {
      activeView,
      latestRunStatus: runResults?.status ?? null,
      latestSubmitStatus: submitResults?.overallStatus ?? null,
      latestHistoryStatus: selectedSubmission?.status ?? null,
      latestError:
        panelError ??
        runResult?.stderr ??
        runResult?.output ??
        submitResult?.stderr ??
        submitResult?.output ??
        historyResult?.stderr ??
        historyResult?.output ??
        null,
      latestPhase:
        runResult?.phase ?? submitResult?.phase ?? historyResult?.phase ?? null,
      latestTrace:
        buildTrace(runResult) ??
        buildTrace(submitResult) ??
        buildTrace(historyResult),
      submissionCount: submissions.length,
    };
  }, [
    activeView,
    panelError,
    runResults,
    selectedSubmission,
    submissions.length,
    submitResults,
  ]);

  useEffect(() => {
    onAssistantSnapshotChange?.(assistantSnapshot);
  }, [assistantSnapshot, onAssistantSnapshotChange]);

  const fetchSubmissionDetail = useCallback(
    async (submissionId: number) => {
      setDetailLoading(true);
      const detail = await getSubmission(problemId, submissionId);
      if (!detail) {
        setPanelError("Failed to load submission details.");
        setSelectedSubmission(null);
      } else {
        setPanelError(null);
        setSelectedSubmissionId(submissionId);
        setSelectedSubmission(detail);
      }
      setDetailLoading(false);
    },
    [getSubmission, problemId]
  );

  const loadSubmissionHistory = useCallback(
    async (preferredSubmissionId?: number) => {
      setHistoryLoading(true);
      const list = await getSubmissions(problemId);
      setSubmissions(list);
      setHistoryLoading(false);
      setPanelError(null);

      const eligibleSubmissions =
        historyStatusFilter === ALL_SUBMISSION_STATUSES
          ? list
          : list.filter(
              (submission) => submission.status === historyStatusFilter
            );

      if (eligibleSubmissions.length === 0) {
        setSelectedSubmissionId(null);
        setSelectedSubmission(null);
        return;
      }

      const fallbackSubmissionId = eligibleSubmissions[0].submissionId;
      const selectedStillExists =
        selectedSubmissionId != null &&
        eligibleSubmissions.some(
          (submission) => submission.submissionId === selectedSubmissionId
        );
      const preferredStillExists =
        preferredSubmissionId != null &&
        eligibleSubmissions.some(
          (submission) => submission.submissionId === preferredSubmissionId
        );

      const nextSubmissionId = preferredStillExists
        ? preferredSubmissionId
        : selectedStillExists
          ? selectedSubmissionId
          : fallbackSubmissionId;

      await fetchSubmissionDetail(nextSubmissionId);
    },
    [
      fetchSubmissionDetail,
      getSubmissions,
      historyStatusFilter,
      problemId,
      selectedSubmissionId,
    ]
  );

  const initializeHistory = useCallback(async () => {
    setHistoryLoading(true);
    const list = await getSubmissions(problemId);
    setSubmissions(list);
    setHistoryLoading(false);
    setPanelError(null);

    if (list.length === 0) {
      setSelectedSubmissionId(null);
      setSelectedSubmission(null);
      return;
    }

    await fetchSubmissionDetail(list[0].submissionId);
  }, [fetchSubmissionDetail, getSubmissions, problemId]);

  useEffect(() => {
    setRunResults(null);
    setSubmitResults(null);
    setPanelError(null);
    setHistoryStatusFilter(ALL_SUBMISSION_STATUSES);
    setActiveView("history");
    void initializeHistory();
  }, [initializeHistory, problemId]);

  const showSnackbar = (
    message: string,
    nextSeverity: "success" | "error" | "info"
  ) => {
    setSnackbarMessage(message);
    setSeverity(nextSeverity);
    setOpenSnackbar(true);
  };

  const handleRunCode = async () => {
    if (!code?.trim()) {
      showSnackbar("Please set your code!", "error");
      return;
    }

    if (languageId == null) {
      const message =
        actionBlockedReason ?? "Language configuration is still loading.";
      setPanelError(message);
      showSnackbar(message, "error");
      return;
    }

    setActionLoading(true);
    setPanelError(null);
    setActiveView("run");

    try {
      const response = await runCode(problemId, code, languageId);
      if (response) {
        setRunResults(response);
        showSnackbar("Run completed.", "info");
      }
    } catch (error) {
      const message = buildFailureMessage("Run failed.", error);
      setPanelError(message);
      showSnackbar(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code?.trim()) {
      showSnackbar("Please set your code!", "error");
      return;
    }

    if (languageId == null) {
      const message =
        actionBlockedReason ?? "Language configuration is still loading.";
      setPanelError(message);
      showSnackbar(message, "error");
      return;
    }

    setActionLoading(true);
    setPanelError(null);
    setActiveView("submit");

    try {
      const response = await submitCode(problemId, code, languageId);
      if (response) {
        setSubmitResults(response);
        await loadSubmissionHistory(response.submissionId);
        showSnackbar("Submitted successfully.", "success");
      }
    } catch (error) {
      const message = buildFailureMessage("Submit failed.", error);
      setPanelError(message);
      showSnackbar(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectSubmission = async (submissionId: number) => {
    setPanelError(null);
    setSelectedSubmissionId(submissionId);
    setActiveView("history");
    await fetchSubmissionDetail(submissionId);
  };

  const handleRefreshHistory = async () => {
    await loadSubmissionHistory(selectedSubmissionId ?? undefined);
    showSnackbar("Submission history refreshed.", "info");
  };

  const handleStatusFilterChange = async (nextStatus: string) => {
    setHistoryStatusFilter(nextStatus);
    setPanelError(null);

    const filteredSubmissions =
      nextStatus === ALL_SUBMISSION_STATUSES
        ? submissions
        : submissions.filter((submission) => submission.status === nextStatus);

    if (filteredSubmissions.length === 0) {
      setSelectedSubmissionId(null);
      setSelectedSubmission(null);
      return;
    }

    if (
      selectedSubmissionId != null &&
      filteredSubmissions.some(
        (submission) => submission.submissionId === selectedSubmissionId
      )
    ) {
      return;
    }

    await fetchSubmissionDetail(filteredSubmissions[0].submissionId);
  };

  const handleRestoreSelectedSubmission = () => {
    if (!selectedSubmission || !onRestoreSubmission) {
      return;
    }

    onRestoreSubmission(selectedSubmission);
    showSnackbar(
      `Loaded submission #${selectedSubmission.submissionId} into the editor.`,
      "success"
    );
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        minHeight: 0,
        p: 2.2,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.2}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        sx={{ mb: 1.8 }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 0.8, display: "block", lineHeight: 1.35 }}
          >
            Execution Console
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.14 }}>
            Run, submit, compare attempts
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
          <ResponsiveButton
            variant="contained"
            sx={{
              minWidth: 118,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
            startIcon={<PlayArrowIcon />}
            onClick={handleRunCode}
            disabled={actionLoading || languageId == null}
          >
            {actionLoading && activeView === "run" ? (
              <CircularProgress size={24} />
            ) : (
              "Run"
            )}
          </ResponsiveButton>

          <ResponsiveButton
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitCode}
            disabled={actionLoading || languageId == null}
            sx={{
              minWidth: 118,
              backgroundColor: alpha(theme.palette.warning.main, 0.92),
              color: theme.palette.common.white,
              "&:hover": {
                backgroundColor: theme.palette.warning.main,
              },
            }}
          >
            {actionLoading && activeView === "submit" ? (
              <CircularProgress size={24} />
            ) : (
              "Submit"
            )}
          </ResponsiveButton>
        </Box>
      </Stack>

      {languageId == null && (
        <Alert severity="warning" sx={{ mb: 1.8 }}>
          {actionBlockedReason ?? "Load the language configuration before running or submitting code."}
        </Alert>
      )}

      <Tabs
        value={activeView}
        onChange={(_, value: ResultView) => setActiveView(value)}
        sx={{
          mb: 1.8,
          "& .MuiTab-root": {
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.default, 0.44),
          },
          "& .Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, 0.16),
            borderColor: alpha(theme.palette.primary.main, 0.28),
            color: theme.palette.text.primary,
          },
        }}
      >
        <Tab value="history" label="History" />
        <Tab value="run" label="Run Output" />
        <Tab value="submit" label="Submit Output" />
      </Tabs>

      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          height: "calc(100% - 30px)",
          p: 0.5,
        }}
      >
        <Box
          sx={{
            overflowY: "auto",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pb: 2,
          }}
        >
          {activeView === "history" && (
            <SubmissionHistoryPanel
              submissions={visibleSubmissions}
              totalSubmissionCount={submissions.length}
              availableStatuses={availableStatuses}
              statusFilter={historyStatusFilter}
              selectedSubmissionId={selectedSubmissionId}
              selectedSubmission={selectedSubmission}
              listLoading={historyLoading}
              detailLoading={detailLoading}
              errorMessage={panelError}
              languageLabels={languageLabels}
              onChangeStatusFilter={handleStatusFilterChange}
              onRefresh={handleRefreshHistory}
              onSelectSubmission={handleSelectSubmission}
              onRestoreSubmission={handleRestoreSelectedSubmission}
            />
          )}

          {activeView === "run" &&
            (runResults ? (
              <ResultList title="Run Results" results={runResults.results} />
            ) : (
              <EmptyState message="Run your code to inspect sample testcase results here." />
            ))}

          {activeView === "submit" &&
            (submitResults ? (
              <ResultList
                title="Submit Results"
                statusLabel={submitResults.overallStatus}
                results={submitResults.results}
              />
            ) : (
              <EmptyState message="Submit your code to store a judged result and compare attempts." />
            ))}

          {panelError && activeView !== "history" && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed: {panelError}
            </Alert>
          )}
        </Box>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={severity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CodeSubmission;

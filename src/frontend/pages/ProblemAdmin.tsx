import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteConfirmDialog from "../components/languages/DeleteConfirmDialog";
import ProblemAdminTable from "../components/problems/ProblemAdminTable";
import ProblemFormDialog from "../components/problems/ProblemFormDialog";
import TestCaseFormDialog from "../components/problems/TestCaseFormDialog";
import TestCaseTable from "../components/problems/TestCaseTable";
import {
  ProblemDetails,
  ProblemMutationPayload,
  ProblemSummary,
  TestCase,
  TestCaseMutationPayload,
  useApi,
} from "../hooks/useApi";
import { useProblemLocale } from "../problem-locale";

const blankProblemForm: ProblemMutationPayload = {
  title: "",
  description: "",
  difficulty: "EASY",
  locale: "en",
};

const blankTestCaseForm: TestCaseMutationPayload = {
  input: "",
  expectedOutput: "",
  timeLimitMs: 1000,
  memoryLimitMb: 128,
  isSample: false,
};

type ProblemDialogState = {
  open: boolean;
  mode: "add" | "edit";
  problemId: number | null;
  values: ProblemMutationPayload;
};

type TestCaseDialogState = {
  open: boolean;
  mode: "add" | "edit";
  testcaseId: number | null;
  values: TestCaseMutationPayload;
};

function buildErrorMessage(fallback: string, error: unknown) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function ProblemAdmin() {
  const {
    getProblems,
    getProblem,
    addProblem,
    updateProblem,
    deleteProblem,
    getTestCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
  } = useApi();
  const { locale, setLocale } = useProblemLocale();

  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetails | null>(null);
  const [testcases, setTestcases] = useState<TestCase[]>([]);
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [problemDialog, setProblemDialog] = useState<ProblemDialogState>({
    open: false,
    mode: "add",
    problemId: null,
    values: blankProblemForm,
  });
  const [testCaseDialog, setTestCaseDialog] = useState<TestCaseDialogState>({
    open: false,
    mode: "add",
    testcaseId: null,
    values: blankTestCaseForm,
  });
  const [problemDeleteTarget, setProblemDeleteTarget] = useState<ProblemSummary | null>(null);
  const [testcaseDeleteTarget, setTestcaseDeleteTarget] = useState<TestCase | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" = "info"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const loadProblems = useCallback(
    async (preferredProblemId?: number | null) => {
      setPageLoading(true);
      setPageError(null);

      try {
        const list = await getProblems(locale, true);
        setProblems(list);
        setSelectedProblemId((currentProblemId) => {
          const nextProblemId =
            preferredProblemId != null &&
            list.some((problem) => problem.problemId === preferredProblemId)
              ? preferredProblemId
              : currentProblemId != null &&
                  list.some((problem) => problem.problemId === currentProblemId)
                ? currentProblemId
                : list[0]?.problemId ?? null;

          return nextProblemId;
        });
      } catch (error) {
        setPageError(buildErrorMessage("Failed to load problems.", error));
      } finally {
        setPageLoading(false);
      }
    },
    [getProblems, locale]
  );

  const loadProblemWorkspace = useCallback(
    async (problemId: number) => {
      setDetailLoading(true);
      setPageError(null);

      try {
        const [problem, testcaseList] = await Promise.all([
          getProblem(problemId, locale, true),
          getTestCases(problemId),
        ]);

        setSelectedProblem(problem);
        setTestcases(testcaseList);
      } catch (error) {
        setPageError(buildErrorMessage("Failed to load problem details.", error));
        setSelectedProblem(null);
        setTestcases([]);
      } finally {
        setDetailLoading(false);
      }
    },
    [getProblem, getTestCases, locale]
  );

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  useEffect(() => {
    if (selectedProblemId == null) {
      setSelectedProblem(null);
      setTestcases([]);
      return;
    }

    void loadProblemWorkspace(selectedProblemId);
  }, [loadProblemWorkspace, selectedProblemId]);

  const visibleProblems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return problems;
    }

    return problems.filter((problem) =>
      [
        problem.title,
        problem.source,
        problem.locale,
        problem.sourceSlug ?? "",
        problem.externalProblemId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [problems, search]);

  const selectedProblemSummary = useMemo(
    () =>
      problems.find((problem) => problem.problemId === selectedProblemId) ?? null,
    [problems, selectedProblemId]
  );

  const handleOpenAddProblem = () => {
    setProblemDialog({
      open: true,
      mode: "add",
      problemId: null,
      values: {
        ...blankProblemForm,
        locale,
      },
    });
  };

  const handleOpenEditProblem = async (problem: ProblemSummary) => {
    const detail = await getProblem(problem.problemId, locale, true);
    if (!detail) {
      showSnackbar("Failed to load the selected problem.", "error");
      return;
    }

    setSelectedProblemId(problem.problemId);
    setProblemDialog({
      open: true,
      mode: "edit",
      problemId: problem.problemId,
      values: {
        title: detail.title,
        description: detail.description,
        difficulty: detail.difficulty,
        locale: detail.locale,
      },
    });
  };

  const handleSubmitProblem = async (values: ProblemMutationPayload) => {
    try {
      if (problemDialog.mode === "edit" && problemDialog.problemId == null) {
        throw new Error("No problem is selected for editing.");
      }

      const savedProblem =
        problemDialog.mode === "add"
          ? await addProblem(values)
          : await updateProblem(problemDialog.problemId, values);

      if (!savedProblem) {
        throw new Error("Problem save returned no data.");
      }

      setProblemDialog((previous) => ({ ...previous, open: false }));
      await loadProblems(savedProblem.problemId);
      await loadProblemWorkspace(savedProblem.problemId);
      showSnackbar(
        problemDialog.mode === "add"
          ? "Problem created."
          : "Problem updated.",
        "success"
      );
    } catch (error) {
      throw new Error(buildErrorMessage("Failed to save problem.", error));
    }
  };

  const handleConfirmDeleteProblem = async () => {
    if (!problemDeleteTarget) {
      return;
    }

    try {
      await deleteProblem(problemDeleteTarget.problemId);
      const deletedProblemId = problemDeleteTarget.problemId;
      setProblemDeleteTarget(null);
      await loadProblems(
        selectedProblemId === deletedProblemId ? null : selectedProblemId
      );
      showSnackbar("Problem deleted.", "success");
    } catch (error) {
      showSnackbar(buildErrorMessage("Failed to delete problem.", error), "error");
    }
  };

  const handleOpenAddTestCase = () => {
    setTestCaseDialog({
      open: true,
      mode: "add",
      testcaseId: null,
      values: blankTestCaseForm,
    });
  };

  const handleOpenEditTestCase = (testcase: TestCase) => {
    setTestCaseDialog({
      open: true,
      mode: "edit",
      testcaseId: testcase.testcaseId,
      values: {
        input: testcase.input,
        expectedOutput: testcase.expectedOutput,
        timeLimitMs: testcase.timeLimitMs,
        memoryLimitMb: testcase.memoryLimitMb,
        isSample: testcase.isSample,
      },
    });
  };

  const handleSubmitTestCase = async (values: TestCaseMutationPayload) => {
    if (selectedProblemId == null) {
      throw new Error("Select a problem first.");
    }

    try {
      if (testCaseDialog.mode === "add") {
        await addTestCase(selectedProblemId, values);
      } else {
        if (testCaseDialog.testcaseId == null) {
          throw new Error("No test case is selected for editing.");
        }
        await updateTestCase(selectedProblemId, testCaseDialog.testcaseId, values);
      }

      setTestCaseDialog((previous) => ({ ...previous, open: false }));
      await loadProblems(selectedProblemId);
      await loadProblemWorkspace(selectedProblemId);
      showSnackbar(
        testCaseDialog.mode === "add"
          ? "Test case created."
          : "Test case updated.",
        "success"
      );
    } catch (error) {
      throw new Error(buildErrorMessage("Failed to save test case.", error));
    }
  };

  const handleConfirmDeleteTestCase = async () => {
    if (!testcaseDeleteTarget || selectedProblemId == null) {
      return;
    }

    try {
      await deleteTestCase(selectedProblemId, testcaseDeleteTarget.testcaseId);
      setTestcaseDeleteTarget(null);
      await loadProblems(selectedProblemId);
      await loadProblemWorkspace(selectedProblemId);
      showSnackbar("Test case deleted.", "success");
    } catch (error) {
      showSnackbar(buildErrorMessage("Failed to delete test case.", error), "error");
    }
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4">Problem Administration</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage local problems, imported problems, and their sample or hidden testcases.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant={locale === "en" ? "contained" : "outlined"}
              onClick={() => setLocale("en")}
            >
              English
            </Button>
            <Button
              variant={locale === "zh-CN" ? "contained" : "outlined"}
              onClick={() => setLocale("zh-CN")}
            >
              中文
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadProblems(selectedProblemId)}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddProblem}
            >
              Add Problem
            </Button>
          </Stack>
        </Stack>

        {pageError && <Alert severity="error">{pageError}</Alert>}

        <Stack direction={{ xs: "column", xl: "row" }} spacing={3} alignItems="stretch">
          <Paper sx={{ p: 2, flex: "0 0 420px", minWidth: 0 }}>
            <Stack spacing={2}>
              <TextField
                label="Search problems"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                fullWidth
              />

              {pageLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : visibleProblems.length > 0 ? (
                <ProblemAdminTable
                  problems={visibleProblems}
                  selectedProblemId={selectedProblemId}
                  onSelect={setSelectedProblemId}
                  onEdit={(problem) => void handleOpenEditProblem(problem)}
                  onDelete={setProblemDeleteTarget}
                />
              ) : (
                <Alert severity="info">No problems match the current search.</Alert>
              )}
            </Stack>
          </Paper>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <Paper sx={{ p: 3 }}>
              {detailLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : selectedProblem ? (
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h5">{selectedProblem.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Problem #{selectedProblem.problemId}
                        {selectedProblem.externalProblemId
                          ? ` · external ${selectedProblem.externalProblemId}`
                          : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          void handleOpenEditProblem(
                            selectedProblemSummary ?? selectedProblem
                          )
                        }
                      >
                        Edit Problem
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() =>
                          setProblemDeleteTarget(
                            selectedProblemSummary ?? {
                              problemId: selectedProblem.problemId,
                              title: selectedProblem.title,
                              difficulty: selectedProblem.difficulty,
                              completionState: selectedProblem.completionState,
                              source: selectedProblem.source,
                              locale: selectedProblem.locale,
                              defaultLocale: selectedProblem.defaultLocale,
                              availableLocales: selectedProblem.availableLocales,
                              sourceSlug: selectedProblem.sourceSlug,
                              externalProblemId: selectedProblem.externalProblemId,
                              judgeReady: selectedProblem.judgeReady,
                              testcaseCount: selectedProblem.testcaseCount,
                            }
                          )
                        }
                      >
                        Delete Problem
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={selectedProblem.difficulty} color="primary" variant="outlined" />
                    <Chip label={`${selectedProblem.source} / ${selectedProblem.locale}`} variant="outlined" />
                    <Chip label={`default: ${selectedProblem.defaultLocale}`} variant="outlined" />
                    <Chip
                      label={selectedProblem.judgeReady ? "Judge Ready" : "Needs Tests"}
                      color={selectedProblem.judgeReady ? "success" : "default"}
                    />
                    <Chip label={`${selectedProblem.testcaseCount} testcases`} variant="outlined" />
                    {selectedProblem.availableLocales?.map((availableLocale) => (
                      <Chip
                        key={availableLocale}
                        label={availableLocale}
                        size="small"
                        variant={availableLocale === selectedProblem.locale ? "filled" : "outlined"}
                        onClick={() => setLocale(availableLocale)}
                      />
                    ))}
                    {selectedProblem.sourceSlug && (
                      <Chip label={`slug: ${selectedProblem.sourceSlug}`} variant="outlined" />
                    )}
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Description
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 260, overflow: "auto" }}>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {selectedProblem.description}
                      </Typography>
                    </Paper>
                  </Box>

                  {selectedProblem.sampleTestcase && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Imported Sample Testcase Reference
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                        >
                          {selectedProblem.sampleTestcase}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Alert severity="info">
                  Select a problem from the list to inspect and manage it.
                </Alert>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Box>
                    <Typography variant="h6">Testcases</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mark sample cases for `Run`; hidden cases still participate in `Submit`.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    disabled={selectedProblemId == null}
                    onClick={handleOpenAddTestCase}
                  >
                    Add Testcase
                  </Button>
                </Stack>

                {selectedProblemId == null ? (
                  <Alert severity="info">Choose a problem before managing testcases.</Alert>
                ) : testcases.length > 0 ? (
                  <TestCaseTable
                    testcases={testcases}
                    onEdit={handleOpenEditTestCase}
                    onDelete={setTestcaseDeleteTarget}
                  />
                ) : (
                  <Alert severity="warning">
                    No testcases are configured yet. Add at least one testcase to make the problem judge-ready.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Stack>

      <ProblemFormDialog
        open={problemDialog.open}
        mode={problemDialog.mode}
        initialValues={problemDialog.values}
        onSubmit={handleSubmitProblem}
        onClose={() =>
          setProblemDialog((previous) => ({
            ...previous,
            open: false,
          }))
        }
      />

      <TestCaseFormDialog
        open={testCaseDialog.open}
        mode={testCaseDialog.mode}
        initialValues={testCaseDialog.values}
        onSubmit={handleSubmitTestCase}
        onClose={() =>
          setTestCaseDialog((previous) => ({
            ...previous,
            open: false,
          }))
        }
      />

      <DeleteConfirmDialog
        open={problemDeleteTarget != null}
        name={problemDeleteTarget?.title ?? ""}
        onClose={() => setProblemDeleteTarget(null)}
        onConfirm={() => void handleConfirmDeleteProblem()}
      />

      <DeleteConfirmDialog
        open={testcaseDeleteTarget != null}
        name={`testcase #${testcaseDeleteTarget?.testcaseId ?? ""}`}
        onClose={() => setTestcaseDeleteTarget(null)}
        onConfirm={() => void handleConfirmDeleteTestCase()}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

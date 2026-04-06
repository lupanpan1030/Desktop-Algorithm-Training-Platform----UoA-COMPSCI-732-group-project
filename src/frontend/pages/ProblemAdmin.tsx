import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { marked } from "marked";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteConfirmDialog from "../components/languages/DeleteConfirmDialog";
import ProblemAdminTable from "../components/problems/ProblemAdminTable";
import AiTestDraftReviewPanel from "../components/problems/AiTestDraftReviewPanel";
import ProblemFormDialog from "../components/problems/ProblemFormDialog";
import TestCaseFormDialog from "../components/problems/TestCaseFormDialog";
import TestCaseTable from "../components/problems/TestCaseTable";
import DOMPurify from "../utils/dompurifyConfig";
import {
  AiTestcaseDraft,
  GenerateAiTestDraftsPayload,
  ProblemDetails,
  ProblemMutationPayload,
  ProblemSummary,
  TestCase,
  TestCaseMutationPayload,
  useApi,
} from "../hooks/useApi";
import { useProblemLocale } from "../problem-locale";
import { useAiPageContext } from "../ai/useAiPageContext";
import type { AiPageContextPayload } from "../ai/types";

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

type AiDraftReviewState = {
  loading: boolean;
  savingIds: string[];
  error: string | null;
  warnings: string[];
  provider: string | null;
  drafts: AiTestcaseDraft[];
  lastRequest: GenerateAiTestDraftsPayload;
};

const defaultAiDraftRequest: GenerateAiTestDraftsPayload = {
  targetCount: 5,
  includeSampleDrafts: true,
  includeHiddenDrafts: true,
};

function createInitialAiDraftReviewState(): AiDraftReviewState {
  return {
    loading: false,
    savingIds: [],
    error: null,
    warnings: [],
    provider: null,
    drafts: [],
    lastRequest: { ...defaultAiDraftRequest },
  };
}

function buildErrorMessage(fallback: string, error: unknown) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function MetaFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 1.1,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.42),
        borderColor: alpha(theme.palette.divider, 0.3),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 600 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function buildStarterCodePreview(template: string, lineLimit = 14) {
  const lines = template.split("\n");
  const visibleLines = lines.slice(0, lineLimit).join("\n");

  return {
    preview: visibleLines,
    truncated: lines.length > lineLimit,
    totalLines: lines.length,
  };
}

export default function ProblemAdmin() {
  const theme = useTheme();
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
    generateAiTestDrafts,
  } = useApi();
  const { locale, setLocale } = useProblemLocale();

  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetails | null>(null);
  const [testcases, setTestcases] = useState<TestCase[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sampleReferenceFilter, setSampleReferenceFilter] = useState("all");
  const [showAdvancedCatalogFilters, setShowAdvancedCatalogFilters] = useState(false);
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
  const [aiDraftReview, setAiDraftReview] = useState<AiDraftReviewState>(
    createInitialAiDraftReviewState
  );
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
      setAiDraftReview(createInitialAiDraftReviewState());
      return;
    }

    void loadProblemWorkspace(selectedProblemId);
  }, [loadProblemWorkspace, selectedProblemId]);

  useEffect(() => {
    setAiDraftReview((previous) => ({
      ...createInitialAiDraftReviewState(),
      lastRequest: previous.lastRequest,
    }));
  }, [selectedProblemId]);

  const visibleProblems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return problems.filter((problem) =>
      (normalizedSearch
        ? [
            problem.title,
            problem.source,
            problem.locale,
            problem.sourceSlug ?? "",
            problem.externalProblemId ?? "",
            ...problem.tags,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true) &&
      (sourceFilter === "all" ? true : problem.source === sourceFilter) &&
      (readinessFilter === "all"
        ? true
        : readinessFilter === "ready"
          ? problem.judgeReady
          : !problem.judgeReady) &&
      (tagFilter === "all" ? true : problem.tags.includes(tagFilter)) &&
      (sampleReferenceFilter === "all"
        ? true
        : sampleReferenceFilter === "with-reference"
          ? problem.sampleReferenceAvailable
          : !problem.sampleReferenceAvailable)
    );
  }, [problems, readinessFilter, sampleReferenceFilter, search, sourceFilter, tagFilter]);

  const availableSources = useMemo(
    () => [...new Set(problems.map((problem) => problem.source))].sort(),
    [problems]
  );

  const availableTags = useMemo(
    () =>
      [...new Set(problems.flatMap((problem) => problem.tags))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [problems]
  );

  const nextProblemNeedingTests = useMemo(
    () => visibleProblems.find((problem) => !problem.judgeReady) ?? null,
    [visibleProblems]
  );

  const curationMetrics = useMemo(
    () => ({
      visible: visibleProblems.length,
      ready: visibleProblems.filter((problem) => problem.judgeReady).length,
      needsTests: visibleProblems.filter((problem) => !problem.judgeReady).length,
      withSampleReference: visibleProblems.filter(
        (problem) => problem.sampleReferenceAvailable
      ).length,
    }),
    [visibleProblems]
  );

  const renderedProblemDescription = useMemo(() => {
    if (!selectedProblem) {
      return "";
    }

    return DOMPurify.sanitize(marked.parse(selectedProblem.description, { async: false }) as string);
  }, [selectedProblem]);

  const selectedProblemSummary = useMemo(
    () =>
      problems.find((problem) => problem.problemId === selectedProblemId) ?? null,
    [problems, selectedProblemId]
  );

  const assistantPageContext = useMemo<AiPageContextPayload>(() => {
    const activeFilters = [
      sourceFilter !== "all" ? `source=${sourceFilter}` : null,
      readinessFilter !== "all" ? `judge=${readinessFilter}` : null,
      tagFilter !== "all" ? `tag=${tagFilter}` : null,
      sampleReferenceFilter !== "all"
        ? `sampleRef=${sampleReferenceFilter}`
        : null,
      search.trim() ? `search=${search.trim()}` : null,
    ].filter(Boolean);

    return {
      pageKind: "problem-admin",
      route: "/admin/problems",
      pageTitle: "Problem Administration",
      summary: `Managing ${visibleProblems.length} visible problems out of ${problems.length} in ${locale}. ${
        selectedProblem
          ? `Current selection is ${selectedProblem.title}.`
          : `No problem is currently selected.`
      }`,
      locale,
      facts: [
        {
          key: "visibleProblems",
          label: "Visible problems",
          value: String(visibleProblems.length),
        },
        {
          key: "totalProblems",
          label: "Total problems",
          value: String(problems.length),
        },
        {
          key: "selectedProblem",
          label: "Selected problem",
          value: selectedProblem?.title ?? "none",
        },
        {
          key: "judgeReady",
          label: "Judge readiness",
          value: selectedProblem
            ? selectedProblem.judgeReady
              ? "ready"
              : "needs tests"
            : "n/a",
        },
        {
          key: "testcaseCounts",
          label: "Testcase coverage",
          value: selectedProblem
            ? `${selectedProblem.sampleCaseCount} sample / ${selectedProblem.hiddenCaseCount} hidden`
            : "n/a",
        },
        {
          key: "activeFilters",
          label: "Active filters",
          value: activeFilters.length ? activeFilters.join(", ") : "none",
        },
        {
          key: "sampleReference",
          label: "Sample reference",
          value: selectedProblem?.sampleReferenceAvailable ? "available" : "missing",
        },
      ],
      contextText: [
        selectedProblem
          ? `Selected problem description: ${selectedProblem.description.slice(0, 900)}`
          : null,
        selectedProblem?.sampleTestcase
          ? `Imported sample reference: ${selectedProblem.sampleTestcase.slice(0, 400)}`
          : null,
        selectedProblem?.starterCodes?.length
          ? `Starter code languages: ${selectedProblem.starterCodes
              .map((starterCode) => starterCode.languageName)
              .join(", ")}`
          : null,
        testcases.length
          ? `Visible testcase kinds: ${testcases
              .map((testcase) => (testcase.isSample ? "sample" : "hidden"))
              .join(", ")}`
          : null,
      ].filter((value): value is string => Boolean(value)),
      suggestedPrompts: [
        "What is missing before this problem is judge-ready?",
        "Explain this imported metadata",
        "What testcase should I add next?",
        "Help me use the current filters to find curation candidates",
      ],
    };
  }, [
    locale,
    problems.length,
    readinessFilter,
    sampleReferenceFilter,
    search,
    selectedProblem,
    sourceFilter,
    tagFilter,
    testcases,
    visibleProblems.length,
  ]);

  useAiPageContext(assistantPageContext);

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
    try {
      const detail = await getProblem(problem.problemId, locale, true);

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
    } catch (error) {
      setPageError(buildErrorMessage("Failed to load the selected problem.", error));
      showSnackbar("Failed to load the selected problem.", "error");
    }
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
        problemDialog.mode === "add" ? "Problem created." : "Problem updated.",
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
        testCaseDialog.mode === "add" ? "Test case created." : "Test case updated.",
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

  const testcaseDraftDefaults = useMemo(
    () => ({
      timeLimitMs: testcases[0]?.timeLimitMs ?? blankTestCaseForm.timeLimitMs,
      memoryLimitMb: testcases[0]?.memoryLimitMb ?? blankTestCaseForm.memoryLimitMb,
    }),
    [testcases]
  );

  const handleGenerateAiDrafts = useCallback(async () => {
    if (selectedProblemId == null) {
      return;
    }

    const requestBody = {
      ...aiDraftReview.lastRequest,
      locale,
    };

    setAiDraftReview((previous) => ({
      ...previous,
      loading: true,
      error: null,
      savingIds: [],
    }));

    try {
      const response = await generateAiTestDrafts(selectedProblemId, requestBody);
      setAiDraftReview((previous) => ({
        ...previous,
        loading: false,
        provider: response.provider,
        warnings: response.warnings,
        drafts: response.drafts,
        error: null,
        lastRequest: {
          ...previous.lastRequest,
          ...requestBody,
        },
      }));

      showSnackbar(
        response.drafts.length > 0
          ? `Generated ${response.drafts.length} AI testcase drafts.`
          : "No AI testcase drafts were generated for this problem.",
        "info"
      );
    } catch (error) {
      setAiDraftReview((previous) => ({
        ...previous,
        loading: false,
        error: buildErrorMessage("Failed to generate AI testcase drafts.", error),
      }));
    }
  }, [aiDraftReview.lastRequest, generateAiTestDrafts, locale, selectedProblemId]);

  const handleClearAiDrafts = useCallback(() => {
    setAiDraftReview((previous) => ({
      ...previous,
      drafts: [],
      warnings: [],
      error: null,
      provider: previous.provider,
      savingIds: [],
    }));
  }, []);

  const handleUpdateAiDraft = useCallback(
    (
      draftId: string,
      patch: Partial<Pick<AiTestcaseDraft, "input" | "expectedOutput" | "isSample">>
    ) => {
      setAiDraftReview((previous) => ({
        ...previous,
        drafts: previous.drafts.map((draft) =>
          draft.id === draftId ? { ...draft, ...patch } : draft
        ),
      }));
    },
    []
  );

  const handleDiscardAiDraft = useCallback((draftId: string) => {
    setAiDraftReview((previous) => ({
      ...previous,
      drafts: previous.drafts.filter((draft) => draft.id !== draftId),
      savingIds: previous.savingIds.filter((id) => id !== draftId),
    }));
  }, []);

  const persistAiDrafts = useCallback(
    async (draftIds: string[]) => {
      if (selectedProblemId == null || draftIds.length === 0) {
        return;
      }

      const draftsToPersist = aiDraftReview.drafts.filter((draft) => draftIds.includes(draft.id));
      if (!draftsToPersist.length) {
        return;
      }

      setAiDraftReview((previous) => ({
        ...previous,
        savingIds: [...new Set([...previous.savingIds, ...draftIds])],
        error: null,
      }));

      try {
        for (const draft of draftsToPersist) {
          await addTestCase(selectedProblemId, {
            input: draft.input.trim(),
            expectedOutput: draft.expectedOutput.trim(),
            isSample: draft.isSample,
            timeLimitMs: testcaseDraftDefaults.timeLimitMs,
            memoryLimitMb: testcaseDraftDefaults.memoryLimitMb,
          });
        }

        await loadProblems(selectedProblemId);
        await loadProblemWorkspace(selectedProblemId);

        setAiDraftReview((previous) => ({
          ...previous,
          drafts: previous.drafts.filter((draft) => !draftIds.includes(draft.id)),
          savingIds: previous.savingIds.filter((id) => !draftIds.includes(id)),
        }));

        showSnackbar(
          draftsToPersist.length === 1
            ? "AI testcase draft saved."
            : `${draftsToPersist.length} AI testcase drafts saved.`,
          "success"
        );
      } catch (error) {
        const message = buildErrorMessage("Failed to save AI testcase drafts.", error);
        setAiDraftReview((previous) => ({
          ...previous,
          savingIds: previous.savingIds.filter((id) => !draftIds.includes(id)),
          error: message,
        }));
        showSnackbar(message, "error");
      }
    },
    [
      addTestCase,
      aiDraftReview.drafts,
      loadProblemWorkspace,
      loadProblems,
      selectedProblemId,
      testcaseDraftDefaults.memoryLimitMb,
      testcaseDraftDefaults.timeLimitMs,
    ]
  );

  const handleSaveAiDraft = useCallback(
    (draftId: string) => {
      void persistAiDrafts([draftId]);
    },
    [persistAiDrafts]
  );

  const handleSaveHighConfidenceAiDrafts = useCallback(() => {
    const highConfidenceDraftIds = aiDraftReview.drafts
      .filter((draft) => draft.confidence === "high")
      .map((draft) => draft.id);

    void persistAiDrafts(highConfidenceDraftIds);
  }, [aiDraftReview.drafts, persistAiDrafts]);

  return (
    <Box sx={{ minHeight: "100%" }}>
      <Stack spacing={2.2}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.55, md: 1.8 },
            borderRadius: 6,
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            borderColor: alpha(theme.palette.divider, 0.42),
          }}
        >
          <Stack spacing={1.6}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1.6}
              justifyContent="space-between"
              alignItems={{ lg: "center" }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                >
                  Workspace Summary
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.25, fontWeight: 700, lineHeight: 1.2 }}>
                  Review imported content and move problems toward judge-ready quality.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: "block", maxWidth: 760 }}>
                  Use the catalog on the left to pick the next target, then refine metadata, starter code, and testcase coverage on the right.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => void loadProblems(selectedProblemId)}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  disabled={!nextProblemNeedingTests}
                  onClick={() => {
                    if (nextProblemNeedingTests) {
                      setSelectedProblemId(nextProblemNeedingTests.problemId);
                    }
                  }}
                >
                  Next needs tests
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddProblem}
                >
                  Add problem
                </Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              <Chip label={`Visible ${curationMetrics.visible}`} variant="outlined" />
              <Chip label={`Judge ready ${curationMetrics.ready}`} variant="outlined" />
              <Chip label={`Needs tests ${curationMetrics.needsTests}`} variant="outlined" />
              <Chip label={`Sample ref ${curationMetrics.withSampleReference}`} variant="outlined" />
            </Stack>
          </Stack>
        </Paper>

        {pageError && <Alert severity="error">{pageError}</Alert>}

        <Box
          sx={{
            display: "grid",
            gap: 2.2,
            gridTemplateColumns: {
              xs: "1fr",
              xl: "minmax(300px, 340px) minmax(0, 1fr)",
            },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 1.8,
              borderRadius: 6,
              bgcolor: alpha(theme.palette.background.paper, 0.68),
              borderColor: alpha(theme.palette.divider, 0.42),
              minHeight: 0,
            }}
          >
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                >
                  Problem Catalog
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                  Find the next curation target
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: "block" }}>
                  Search first, narrow with the core filters, then open advanced filters only when needed.
                </Typography>
              </Box>

              <TextField
                label="Search problems"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                fullWidth
              />

              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                <Chip size="small" label={`${visibleProblems.length} visible`} variant="outlined" />
                <Chip
                  size="small"
                  label={nextProblemNeedingTests ? "Next test target ready" : "No pending test target"}
                  variant={nextProblemNeedingTests ? "filled" : "outlined"}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr" },
                }}
              >
                <TextField
                  select
                  label="Judge state"
                  value={readinessFilter}
                  onChange={(event) => setReadinessFilter(event.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="all">All problems</MenuItem>
                  <MenuItem value="needs-tests">Needs tests</MenuItem>
                  <MenuItem value="ready">Judge ready</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Sample reference"
                  value={sampleReferenceFilter}
                  onChange={(event) => setSampleReferenceFilter(event.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="all">All problems</MenuItem>
                  <MenuItem value="with-reference">With reference</MenuItem>
                  <MenuItem value="without-reference">Without reference</MenuItem>
                </TextField>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowAdvancedCatalogFilters((current) => !current)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {showAdvancedCatalogFilters ? "Hide advanced filters" : "Show advanced filters"}
                </Button>
                {(sourceFilter !== "all" || tagFilter !== "all") && (
                  <Chip size="small" label="Advanced filters active" color="primary" variant="outlined" />
                )}
              </Stack>

              {showAdvancedCatalogFilters && (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr" },
                  }}
                >
                  <TextField
                    select
                    label="Source"
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="all">All sources</MenuItem>
                    {availableSources.map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Tag"
                    value={tagFilter}
                    onChange={(event) => setTagFilter(event.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="all">All tags</MenuItem>
                    {availableTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              <Divider />

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

          <Stack spacing={2.2} sx={{ minWidth: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.8, md: 2.1 },
                borderRadius: 6,
                bgcolor: alpha(theme.palette.background.paper, 0.68),
                borderColor: alpha(theme.palette.divider, 0.42),
              }}
            >
              {detailLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : selectedProblem ? (
                <Stack spacing={1.8}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    justifyContent="space-between"
                    spacing={1.6}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                      >
                        Selected Problem
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.2, lineHeight: 1.08 }}>
                        {selectedProblem.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55 }}>
                        Problem #{selectedProblem.problemId}
                        {selectedProblem.externalProblemId
                          ? ` · external ${selectedProblem.externalProblemId}`
                          : ""}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Button
                        variant="outlined"
                        onClick={() =>
                          void handleOpenEditProblem(
                            selectedProblemSummary ?? selectedProblem
                          )
                        }
                      >
                        Edit problem
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
                              sampleCaseCount: selectedProblem.sampleCaseCount,
                              hiddenCaseCount: selectedProblem.hiddenCaseCount,
                              sampleReferenceAvailable:
                                selectedProblem.sampleReferenceAvailable,
                              tags: selectedProblem.tags,
                            }
                          )
                        }
                      >
                        Delete problem
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                    <Chip label={selectedProblem.difficulty} color="primary" variant="outlined" />
                    <Chip
                      label={selectedProblem.judgeReady ? "Judge ready" : "Needs tests"}
                      color={selectedProblem.judgeReady ? "success" : "default"}
                      variant={selectedProblem.judgeReady ? "filled" : "outlined"}
                    />
                    <Chip label={`${selectedProblem.testcaseCount} testcases`} variant="outlined" />
                    <Chip
                      label={`${selectedProblem.sampleCaseCount} sample / ${selectedProblem.hiddenCaseCount} hidden`}
                      variant="outlined"
                    />
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <MetaFact label="Source" value={`${selectedProblem.source} / ${selectedProblem.locale}`} />
                    <MetaFact label="Default locale" value={selectedProblem.defaultLocale} />
                    <MetaFact
                      label="Sample reference"
                      value={
                        selectedProblem.sampleReferenceAvailable
                          ? "Imported reference available"
                          : "No imported reference"
                      }
                    />
                    <MetaFact
                      label="Slug"
                      value={selectedProblem.sourceSlug ?? "No source slug"}
                    />
                  </Box>

                  <Stack spacing={0.7}>
                    <Typography variant="caption" color="text.secondary">
                      Available locales
                    </Typography>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                      {selectedProblem.availableLocales?.map((availableLocale) => (
                        <Chip
                          key={availableLocale}
                          label={availableLocale}
                          size="small"
                          variant={availableLocale === selectedProblem.locale ? "filled" : "outlined"}
                          onClick={() => setLocale(availableLocale)}
                        />
                      ))}
                    </Stack>
                  </Stack>

                  {selectedProblem.tags.length > 0 && (
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                      {selectedProblem.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Alert severity="info">
                  Select a problem from the catalog to inspect and curate it.
                </Alert>
              )}
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.8, md: 2.1 },
                borderRadius: 6,
                bgcolor: alpha(theme.palette.background.paper, 0.68),
                borderColor: alpha(theme.palette.divider, 0.42),
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1.6}
                  alignItems={{ md: "center" }}
                >
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                    >
                      Testcase Coverage
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                      Build the judge surface deliberately
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      Mark sample cases for Run; hidden cases still participate in Submit.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    disabled={selectedProblemId == null}
                    onClick={handleOpenAddTestCase}
                  >
                    Add testcase
                  </Button>
                </Stack>

                {selectedProblem && (
                  <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                    <Chip label={`${selectedProblem.sampleCaseCount} sample`} variant="outlined" />
                    <Chip label={`${selectedProblem.hiddenCaseCount} hidden`} variant="outlined" />
                    <Chip
                      label={selectedProblem.judgeReady ? "Judge ready" : "Needs tests"}
                      variant={selectedProblem.judgeReady ? "filled" : "outlined"}
                    />
                  </Stack>
                )}

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

                <AiTestDraftReviewPanel
                  selectedProblemTitle={selectedProblem?.title}
                  disabled={selectedProblemId == null}
                  loading={aiDraftReview.loading}
                  savingIds={aiDraftReview.savingIds}
                  provider={aiDraftReview.provider}
                  warnings={aiDraftReview.warnings}
                  error={aiDraftReview.error}
                  drafts={aiDraftReview.drafts}
                  onGenerate={() => void handleGenerateAiDrafts()}
                  onClear={handleClearAiDrafts}
                  onSaveDraft={handleSaveAiDraft}
                  onSaveHighConfidence={handleSaveHighConfidenceAiDrafts}
                  onDiscardDraft={handleDiscardAiDraft}
                  onUpdateDraft={handleUpdateAiDraft}
                />
              </Stack>
            </Paper>

            {selectedProblem && (
              <Box
                sx={{
                  display: "grid",
                  gap: 2.2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    xl: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
                  },
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.8,
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.background.paper, 0.68),
                    borderColor: alpha(theme.palette.divider, 0.42),
                  }}
                >
                  <Stack spacing={1.2}>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                      >
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review the current localized prompt before editing metadata or tests.
                      </Typography>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.6,
                        borderRadius: 4,
                        maxHeight: 320,
                        overflow: "auto",
                        bgcolor: alpha(theme.palette.background.default, 0.4),
                      }}
                    >
                      <Box
                        className="problem-admin-description-preview"
                        sx={{
                          color: "text.primary",
                          fontSize: "0.95rem",
                          lineHeight: 1.7,
                          "& > *:first-of-type": {
                            mt: 0,
                          },
                          "& > *:last-child": {
                            mb: 0,
                          },
                          "& p": {
                            margin: "0 0 1rem",
                          },
                          "& strong": {
                            fontWeight: 700,
                          },
                          "& code": {
                            fontFamily:
                              '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                            fontSize: "0.92em",
                            px: 0.6,
                            py: 0.15,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.background.default, 0.72),
                          },
                          "& pre": {
                            overflowX: "auto",
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha(theme.palette.background.default, 0.72),
                          },
                          "& ul, & ol": {
                            paddingLeft: 3,
                            margin: 0,
                          },
                          "& li": {
                            marginBottom: 0.8,
                          },
                          "& img": {
                            maxWidth: "100%",
                            borderRadius: 2,
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: renderedProblemDescription,
                        }}
                      />
                    </Paper>
                  </Stack>
                </Paper>

                <Stack spacing={2.2}>
                  {selectedProblem.sampleTestcase && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        borderRadius: 6,
                        bgcolor: alpha(theme.palette.background.paper, 0.68),
                        borderColor: alpha(theme.palette.divider, 0.42),
                      }}
                    >
                      <Stack spacing={1.1}>
                        <Box>
                          <Typography
                            variant="overline"
                            sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                          >
                            Sample Reference
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Imported reference content you can turn into public or hidden testcases.
                          </Typography>
                        </Box>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.3,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.background.default, 0.4),
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                          >
                            {selectedProblem.sampleTestcase}
                          </Typography>
                        </Paper>
                      </Stack>
                    </Paper>
                  )}

                  {selectedProblem.starterCodes.length > 0 && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        borderRadius: 6,
                        bgcolor: alpha(theme.palette.background.paper, 0.68),
                        borderColor: alpha(theme.palette.divider, 0.42),
                      }}
                    >
                      <Stack spacing={1.2}>
                        <Box>
                          <Typography
                            variant="overline"
                            sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                          >
                            Starter Code
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Imported starter templates currently available for this problem.
                          </Typography>
                        </Box>
                        <Stack spacing={1}>
                          {selectedProblem.starterCodes.map((starterCode) => {
                            const preview = buildStarterCodePreview(starterCode.template);

                            return (
                              <Paper
                                key={starterCode.languageSlug}
                                variant="outlined"
                                sx={{
                                  p: 1.2,
                                  borderRadius: 4,
                                  bgcolor: alpha(theme.palette.background.default, 0.34),
                                }}
                              >
                                <Stack spacing={0.7}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    useFlexGap
                                    flexWrap="wrap"
                                    alignItems="center"
                                  >
                                    <Typography variant="subtitle2">{starterCode.languageName}</Typography>
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={`${preview.totalLines} lines`}
                                    />
                                    {preview.truncated && (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`Previewing first 14`}
                                      />
                                    )}
                                  </Stack>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: 1.2,
                                      borderRadius: 3,
                                      maxHeight: 220,
                                      overflow: "auto",
                                      bgcolor: alpha(theme.palette.background.default, 0.52),
                                      borderColor: alpha(theme.palette.divider, 0.34),
                                    }}
                                  >
                                    <Typography
                                      component="pre"
                                      variant="body2"
                                      sx={{
                                        m: 0,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        fontFamily:
                                          '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                                      }}
                                    >
                                      {preview.preview}
                                    </Typography>
                                  </Paper>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Box>
            )}

          </Stack>
        </Box>
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

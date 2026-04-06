import React, {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
} from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ProblemContent from "../components/ProblemContent";
import CodeEditor from "../components/Editor/Editor";
import { useLocation, useParams } from "react-router-dom";
import CodeSubmission from "../components/Run&SubmitButton";
import { useApi } from "../hooks/useApi";
import { useProblemLocale } from "../problem-locale";
import { useAiPageContext } from "../ai/useAiPageContext";
import { normalizeStarterLanguageKey } from "../utils/starterCode";

function truncateText(value, limit = 900) {
  if (!value) {
    return "";
  }

  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function countCodeLines(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split("\n").length;
}

function buildWorkspaceStatusLabel(snapshot) {
  if (snapshot?.latestSubmitStatus) {
    return `Last submit: ${snapshot.latestSubmitStatus}`;
  }

  if (snapshot?.latestRunStatus) {
    return `Last run: ${snapshot.latestRunStatus}`;
  }

  return "No execution yet";
}

const splitPaneStorageKey = "detail-page-split-pane-width-v1";
const splitHandleWidth = 18;
const defaultStatementPaneWidth = 430;
const minStatementPaneWidth = 360;
const maxStatementPaneWidth = 620;
const minWorkspacePaneWidth = 560;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readStoredStatementPaneWidth() {
  if (typeof window === "undefined") {
    return defaultStatementPaneWidth;
  }

  const rawValue = window.localStorage.getItem(splitPaneStorageKey);
  const parsedValue = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsedValue)) {
    return defaultStatementPaneWidth;
  }

  return clamp(parsedValue, minStatementPaneWidth, maxStatementPaneWidth);
}

function clampStatementPaneWidth(nextWidth, containerWidth) {
  if (!containerWidth) {
    return clamp(nextWidth, minStatementPaneWidth, maxStatementPaneWidth);
  }

  const maxFromContainer = Math.min(
    maxStatementPaneWidth,
    Math.floor(containerWidth * 0.48),
    containerWidth - splitHandleWidth - minWorkspacePaneWidth
  );
  const effectiveMax = Math.max(minStatementPaneWidth, maxFromContainer);
  return clamp(Math.round(nextWidth), minStatementPaneWidth, effectiveMax);
}

export default function DetailPage() {
  const theme = useTheme();
  const desktopSplitEnabled = useMediaQuery(theme.breakpoints.up("lg"));
  const { id } = useParams();
  const location = useLocation();
  const problemId = Number(id);
  const splitContainerRef = useRef(null);
  const splitDragStateRef = useRef(null);
  const [problem, setProblem] = useState(null);
  const [editorState, setEditorState] = useState({
    code: "",
    language: "python",
  });
  const [editorDraft, setEditorDraft] = useState(null);
  const [assistantResultSnapshot, setAssistantResultSnapshot] = useState(null);
  const [languageMaps, setLanguageMaps] = useState({
    byName: {},
    byId: {},
  });
  const [restoredUnavailableLanguage, setRestoredUnavailableLanguage] = useState(null);
  const [statementPaneWidth, setStatementPaneWidth] = useState(() =>
    readStoredStatementPaneWidth()
  );
  const [splitDragging, setSplitDragging] = useState(false);
  const { getProblem, loading: problemLoading, error: problemError } = useApi();
  const {
    getLanguages,
    loading: languageMapLoading,
    error: languageMapError,
  } = useApi();
  const { locale, setLocale } = useProblemLocale();
  const deferredCode = useDeferredValue(editorState.code);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const data = await getProblem(Number(id), locale, true);
        setProblem(data);
      } catch {
        setProblem(null);
      }
    }
    fetchProblem();
  }, [id, getProblem, locale]);

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const data = await getLanguages();
        if (data == null) {
          return;
        }

        const byName = {};
        const byId = {};
        data.forEach((lang) => {
          const key = lang.name.toLowerCase();
          const normalizedKey = normalizeStarterLanguageKey(lang.name);
          byName[key] = lang.languageId;
          byId[lang.languageId] = lang.name;
          if (normalizedKey) {
            byName[normalizedKey] = lang.languageId;
          }
        });
        setLanguageMaps({ byName, byId });
      } catch {
        setLanguageMaps({ byName: {}, byId: {} });
      }
    }
    fetchLanguages();
  }, [getLanguages]);

  const handleCodeChange = useCallback((newState) => {
    if (newState.language !== editorState.language) {
      setRestoredUnavailableLanguage(null);
    }

    setEditorState(newState);
  }, [editorState.language]);

  const handleRestoreSubmission = useCallback(
    (submission) => {
      const restoredLanguageLabel =
        languageMaps.byId[submission.languageId] ??
        `language #${submission.languageId}`;
      const restoredLanguage = normalizeStarterLanguageKey(
        languageMaps.byId[submission.languageId]
      );
      const nextLanguage = restoredLanguage || editorState.language || "python";
      const nextState = {
        code: submission.code,
        language: nextLanguage,
      };

      setRestoredUnavailableLanguage(
        restoredLanguage
          ? null
          : {
              languageId: submission.languageId,
              label: restoredLanguageLabel,
            }
      );
      setEditorState(nextState);
      setEditorDraft({
        ...nextState,
        revision: Date.now(),
      });
    },
    [editorState.language, languageMaps.byId]
  );

  const detailPageContext = useMemo(() => {
    if (!problem) {
      return null;
    }

    const starterLanguages = (problem.starterCodes ?? []).map(
      (starterCode) => starterCode.languageName
    );
    const facts = [
      {
        key: "difficulty",
        label: "Difficulty",
        value: problem.difficulty,
      },
      {
        key: "currentLanguage",
        label: "Current language",
        value: editorState.language,
      },
      {
        key: "judgeReady",
        label: "Judge readiness",
        value: problem.judgeReady ? "ready" : "needs tests",
      },
      {
        key: "tags",
        label: "Tags",
        value: problem.tags?.length ? problem.tags.join(", ") : "none",
      },
      {
        key: "codeLines",
        label: "Code lines",
        value: String(countCodeLines(deferredCode)),
      },
      {
        key: "testcaseCount",
        label: "Testcases",
        value: `${problem.sampleCaseCount} sample / ${problem.hiddenCaseCount} hidden`,
      },
      {
        key: "starterLanguages",
        label: "Starter code",
        value: starterLanguages.length ? starterLanguages.join(", ") : "none",
      },
    ];

    if (assistantResultSnapshot?.latestRunStatus) {
      facts.push({
        key: "lastRunStatus",
        label: "Last run status",
        value: assistantResultSnapshot.latestRunStatus,
      });
    }

    if (assistantResultSnapshot?.latestSubmitStatus) {
      facts.push({
        key: "lastSubmitStatus",
        label: "Last submit status",
        value: assistantResultSnapshot.latestSubmitStatus,
      });
    }

    if (assistantResultSnapshot?.latestHistoryStatus) {
      facts.push({
        key: "historyStatus",
        label: "History selection",
        value: assistantResultSnapshot.latestHistoryStatus,
      });
    }

    if (assistantResultSnapshot?.latestError) {
      facts.push({
        key: "lastError",
        label: "Last error",
        value: truncateText(assistantResultSnapshot.latestError, 180),
      });
    }

    return {
      pageKind: "problem-detail",
      route: location.pathname,
      pageTitle: problem.title,
      summary: `Viewing ${problem.title} in ${locale}. Current language is ${editorState.language}. ${
        assistantResultSnapshot?.latestRunStatus || assistantResultSnapshot?.latestSubmitStatus
          ? "Recent execution signals are available."
          : "No recent execution result has been recorded yet."
      }`,
      locale,
      facts,
      contextText: [
        `Problem description: ${truncateText(problem.description)}`,
        problem.sampleTestcase
          ? `Imported sample reference: ${truncateText(problem.sampleTestcase, 400)}`
          : null,
        deferredCode.trim()
          ? `Current editor code (${editorState.language}): ${truncateText(
              deferredCode,
              900
            )}`
          : `Current editor code (${editorState.language}): empty`,
        assistantResultSnapshot?.latestTrace
          ? `Latest result trace: ${truncateText(
              assistantResultSnapshot.latestTrace,
              400
            )}`
          : null,
      ].filter(Boolean),
      suggestedPrompts: [
        "Explain this problem",
        "Give me a hint without revealing the full answer",
        "Review my current code",
        "Explain my latest result",
        "Explain the imported sample testcase reference",
      ],
    };
  }, [
    assistantResultSnapshot,
    deferredCode,
    editorState.language,
    locale,
    location.pathname,
    problem,
  ]);

  useAiPageContext(detailPageContext);

  const currentLanguageId = useMemo(() => {
    if (restoredUnavailableLanguage) {
      return null;
    }

    const normalizedLanguage = normalizeStarterLanguageKey(editorState.language);
    if (!normalizedLanguage) {
      return null;
    }

    return languageMaps.byName[normalizedLanguage] ?? null;
  }, [editorState.language, languageMaps.byName, restoredUnavailableLanguage]);

  const submissionActionBlockedReason = useMemo(() => {
    if (languageMapLoading) {
      return "Language configuration is still loading.";
    }

    if (languageMapError) {
      return `Failed to load language configuration: ${languageMapError.message}`;
    }

    if (restoredUnavailableLanguage) {
      return `This code was restored from ${restoredUnavailableLanguage.label}, but that language is not available in the local judge configuration. Choose a supported language before running or submitting.`;
    }

    if (currentLanguageId == null) {
      return `The current language "${editorState.language}" is not available in the local judge configuration.`;
    }

    return null;
  }, [
    currentLanguageId,
    editorState.language,
    languageMapError,
    languageMapLoading,
    restoredUnavailableLanguage,
  ]);

  const workspaceFacts = useMemo(
    () =>
      [
        {
          key: "language",
          label: `Language ${editorState.language}`,
        },
        {
          key: "lines",
          label: `${countCodeLines(deferredCode)} code lines`,
        },
        {
          key: "coverage",
          label: problem
            ? `${problem.sampleCaseCount} sample / ${problem.hiddenCaseCount} hidden`
            : "No testcase info",
        },
      ].concat(
        problem?.judgeReady
          ? [{ key: "judge", label: "Judge ready" }]
          : [{ key: "judge", label: "Needs tests" }]
      ),
    [deferredCode, editorState.language, problem]
  );

  const resetStatementPaneWidth = useCallback(() => {
    setStatementPaneWidth((currentWidth) => {
      const containerWidth =
        splitContainerRef.current?.getBoundingClientRect().width ?? 0;
      return clampStatementPaneWidth(defaultStatementPaneWidth, containerWidth) || currentWidth;
    });
  }, []);

  const handleSplitPointerDown = useCallback(
    (event) => {
      if (!desktopSplitEnabled) {
        return;
      }

      event.preventDefault();
      splitDragStateRef.current = {
        startX: event.clientX,
        startWidth: statementPaneWidth,
      };
      setSplitDragging(true);
    },
    [desktopSplitEnabled, statementPaneWidth]
  );

  useEffect(() => {
    if (!desktopSplitEnabled) {
      return;
    }

    const containerWidth =
      splitContainerRef.current?.getBoundingClientRect().width ?? 0;
    setStatementPaneWidth((currentWidth) =>
      clampStatementPaneWidth(currentWidth, containerWidth)
    );
  }, [desktopSplitEnabled]);

  useEffect(() => {
    if (!desktopSplitEnabled || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      splitPaneStorageKey,
      String(statementPaneWidth)
    );
  }, [desktopSplitEnabled, statementPaneWidth]);

  useEffect(() => {
    if (!desktopSplitEnabled || typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      const containerWidth =
        splitContainerRef.current?.getBoundingClientRect().width ?? 0;
      setStatementPaneWidth((currentWidth) =>
        clampStatementPaneWidth(currentWidth, containerWidth)
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopSplitEnabled]);

  useEffect(() => {
    if (!splitDragging || !desktopSplitEnabled || typeof window === "undefined") {
      return undefined;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (event) => {
      const dragState = splitDragStateRef.current;
      if (!dragState) {
        return;
      }

      const containerWidth =
        splitContainerRef.current?.getBoundingClientRect().width ?? 0;
      const deltaX = event.clientX - dragState.startX;
      setStatementPaneWidth(
        clampStatementPaneWidth(dragState.startWidth + deltaX, containerWidth)
      );
    };

    const handlePointerUp = () => {
      splitDragStateRef.current = null;
      setSplitDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [desktopSplitEnabled, splitDragging]);

  return (
    <Box
      ref={splitContainerRef}
      sx={{
        height: "100%",
        minHeight: 0,
        display: "grid",
        gap: desktopSplitEnabled ? 0 : 2.5,
        gridTemplateColumns: desktopSplitEnabled
          ? `${statementPaneWidth}px ${splitHandleWidth}px minmax(0, 1fr)`
          : "1fr",
      }}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 7,
          border: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.46),
          bgcolor: alpha(theme.palette.background.paper, 0.72),
          backdropFilter: "blur(18px)",
        })}
      >
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          {problemLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : problemError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">Error loading problem: {problemError.message}</Alert>
            </Box>
          ) : problem ? (
            <ProblemContent problem={problem} onLocaleChange={setLocale} />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography>Problem not found or server connection error.</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {desktopSplitEnabled && (
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize workspace panels"
          onPointerDown={handleSplitPointerDown}
          onDoubleClick={resetStatementPaneWidth}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "col-resize",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 22,
              bottom: 22,
              width: "1px",
              bgcolor: alpha(theme.palette.divider, splitDragging ? 0.72 : 0.32),
            },
            "&::after": {
              content: '""',
              width: 6,
              height: 64,
              borderRadius: 999,
              bgcolor: alpha(
                theme.palette.primary.main,
                splitDragging ? 0.46 : 0.16
              ),
              border: "1px solid",
              borderColor: alpha(
                theme.palette.primary.main,
                splitDragging ? 0.54 : 0.22
              ),
              boxShadow: splitDragging
                ? `0 0 0 6px ${alpha(theme.palette.primary.main, 0.08)}`
                : "none",
              transition:
                "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
            },
            "&:hover::before": {
              bgcolor: alpha(theme.palette.primary.main, 0.28),
            },
            "&:hover::after": {
              bgcolor: alpha(theme.palette.primary.main, 0.28),
              borderColor: alpha(theme.palette.primary.main, 0.36),
            },
          }}
        />
      )}

      <Stack spacing={2.5} sx={{ minWidth: 0, minHeight: 0 }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            borderRadius: 7,
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.46),
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            backdropFilter: "blur(18px)",
            display: "flex",
            flexDirection: "column",
          })}
        >
          <Box
            sx={(theme) => ({
              px: { xs: 2, md: 2.4 },
              pt: { xs: 2, md: 2.4 },
              pb: 2,
              borderBottom: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.38),
              background: `linear-gradient(180deg, ${alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.08 : 0.06
              )} 0%, transparent 100%)`,
            })}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ lg: "center" }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: 0.7, display: "block", lineHeight: 1.35 }}
                >
                  Active Workspace
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.3 }}>
                  Solve, inspect, iterate
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9, maxWidth: 640 }}>
                  Keep the prompt, editor, run output, and submission history in one focused flow.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={buildWorkspaceStatusLabel(assistantResultSnapshot)}
                  color={
                    assistantResultSnapshot?.latestError
                      ? "warning"
                      : assistantResultSnapshot?.latestSubmitStatus === "ACCEPTED"
                        ? "success"
                        : "default"
                  }
                  variant="outlined"
                />
                {workspaceFacts.map((fact) => (
                  <Chip key={fact.key} label={fact.label} variant="outlined" />
                ))}
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gap: 2,
              p: { xs: 1.5, md: 1.8 },
              gridTemplateRows: {
                xs: "minmax(380px, auto) minmax(320px, auto)",
                lg: "minmax(360px, 1.15fr) minmax(300px, 1fr)",
              },
            }}
          >
            <Box
              sx={(theme) => ({
                minHeight: 0,
                overflow: "hidden",
                borderRadius: 5,
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.16),
                bgcolor: alpha(theme.palette.background.default, 0.34),
                boxShadow: `inset 0 1px 0 ${alpha(
                  theme.palette.common.white,
                  theme.palette.mode === "dark" ? 0.04 : 0.55
                )}`,
                p: 1.4,
              })}
            >
              <CodeEditor
                key={problemId}
                onCodeChange={handleCodeChange}
                problemId={problemId}
                loadedDraft={editorDraft}
                starterCodes={problem?.starterCodes ?? []}
              />
            </Box>

            <Box
              sx={(theme) => ({
                minHeight: 0,
                overflow: "hidden",
                borderRadius: 5,
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.4),
                bgcolor: alpha(theme.palette.background.default, 0.26),
                boxShadow: `inset 0 1px 0 ${alpha(
                  theme.palette.common.white,
                  theme.palette.mode === "dark" ? 0.03 : 0.42
                )}`,
              })}
            >
              {problem && (
                <CodeSubmission
                  problemId={problemId}
                  code={editorState.code}
                  languageId={currentLanguageId}
                  languageLabels={languageMaps.byId}
                  onRestoreSubmission={handleRestoreSubmission}
                  onAssistantSnapshotChange={setAssistantResultSnapshot}
                  actionBlockedReason={submissionActionBlockedReason}
                />
              )}
            </Box>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

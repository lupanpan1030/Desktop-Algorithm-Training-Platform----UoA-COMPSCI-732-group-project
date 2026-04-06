import React, {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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

export default function DetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const problemId = Number(id);
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
      const data = await getProblem(Number(id), locale, true);
      if (data) {
        setProblem(data);
      } else {
        setProblem(null);
      }
    }
    fetchProblem();
  }, [id, getProblem, locale]);

  useEffect(() => {
    async function fetchLanguages() {
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

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: { xs: "1fr", lg: "minmax(340px, 430px) minmax(0, 1fr)" },
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

      <Stack spacing={2.5} sx={{ minWidth: 0, minHeight: 0 }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2, md: 2.4 },
            borderRadius: 7,
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.46),
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            backdropFilter: "blur(18px)",
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
        </Paper>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gap: 2.5,
            gridTemplateRows: {
              xs: "minmax(380px, auto) minmax(320px, auto)",
              lg: "minmax(360px, 1.15fr) minmax(300px, 1fr)",
            },
          }}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              minHeight: 0,
              overflow: "hidden",
              borderRadius: 7,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.46),
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: "blur(18px)",
              p: 1.5,
            })}
          >
            <CodeEditor
              key={problemId}
              onCodeChange={handleCodeChange}
              problemId={problemId}
              loadedDraft={editorDraft}
              starterCodes={problem?.starterCodes ?? []}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={(theme) => ({
              minHeight: 0,
              overflow: "hidden",
              borderRadius: 7,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.46),
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: "blur(18px)",
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
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}

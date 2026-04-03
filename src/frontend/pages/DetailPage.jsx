import React, {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
} from "react";
import ProblemContent from "../components/ProblemContent";
import CodeEditor from "../components/Editor/Editor";
import { useLocation, useParams } from "react-router-dom";
import { Paper, Box, Typography, CircularProgress } from "@mui/material";
import "../styles/DetailPage.css";
import CodeSubmission from "../components/Run&SubmitButton";
import { useApi } from "../hooks/useApi";
import { useTheme } from "@mui/material/styles";
import { useProblemLocale } from "../problem-locale";
import { useAiPageContext } from "../ai/useAiPageContext";

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
  const { getProblem, getLanguages, loading, error } = useApi();
  const { locale, setLocale } = useProblemLocale();
  const deferredCode = useDeferredValue(editorState.code);

  // Reference for resizable elements
  const leftPaneRef = useRef(null);
  const editorPaneRef = useRef(null);
  const containerRef = useRef(null);

  // Monitor whether the current state is being resized
  const [resizingHorizontal, setResizingHorizontal] = useState(false);
  const [resizingVertical, setResizingVertical] = useState(false);

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

  // Get a list of supported programming languages and create a mapping
  useEffect(() => {
    async function fetchLanguages() {
      const data = await getLanguages();
      if (data) {
        const byName = {};
        const byId = {};
        data.forEach((lang) => {
          const key = lang.name.toLowerCase();
          byName[key] = lang.languageId;
          byId[lang.languageId] = lang.name;
          if (key === "c++") {
            byName.cpp = lang.languageId;
          }
        });
        setLanguageMaps({ byName, byId });
      }
    }
    fetchLanguages();
  }, [getLanguages]);

  // Resize event handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingHorizontal && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;

        // Set minimum and maximum width
        const minWidth = 200;
        const maxWidth = containerRect.width - 300;

        if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
          leftPaneRef.current.style.width = `${newLeftWidth}px`;
        }
      }

      if (resizingVertical && editorPaneRef.current) {
        const containerRect =
          editorPaneRef.current.parentElement.getBoundingClientRect();
        const newTopHeight = e.clientY - containerRect.top;

        // Set minimum and maximum height
        const minHeight = 100;
        const maxHeight = containerRect.height - 100;

        if (newTopHeight >= minHeight && newTopHeight <= maxHeight) {
          editorPaneRef.current.style.height = `${newTopHeight}px`;
        }
      }
    };

    const handleMouseUp = () => {
      setResizingHorizontal(false);
      setResizingVertical(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (resizingHorizontal || resizingVertical) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";

      if (resizingHorizontal) {
        document.body.style.cursor = "col-resize";
      } else if (resizingVertical) {
        document.body.style.cursor = "row-resize";
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingHorizontal, resizingVertical]);

  const handleCodeChange = useCallback((newState) => {
    setEditorState(newState);
  }, []);

  const handleRestoreSubmission = useCallback(
    (submission) => {
      const restoredLanguage =
        languageMaps.byId[submission.languageId]?.toLowerCase() ||
        editorState.language ||
        "python";
      const nextState = {
        code: submission.code,
        language: restoredLanguage,
      };

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

  const getLanguageId = () => {
    return languageMaps.byName[editorState.language.toLowerCase()] || 1;
  };
  const theme = useTheme();
  const bgcolor = theme.palette.mode ==='dark'? theme.palette.primary.main : theme.palette.divider;

  return (
    <div className="detail-page-container">
      <Box ref={containerRef} className="detail-content">
        {/* Left half: Problem content */}
        <Box ref={leftPaneRef} className="left-pane">
          <Paper className="problem-content">
            {loading ? (
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
            ) : error ? (
              <Box sx={{ p: 3 }}>
                <Typography color="error">
                  Error loading problem: {error.message}
                </Typography>
              </Box>
            ) : problem ? (
              <ProblemContent
                problem={problem}
                onLocaleChange={setLocale}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography>
                  Problem not found or server connection error.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Level adjustment handle */}
        <Box
          className="resize-handle horizontal-handle"
          sx={{":hover":{backgroundColor: bgcolor}}}
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingHorizontal(true);
          }}
        >
          <Box className="handle-bar" />
        </Box>

        {/* Right half: Code Editor and Running Result */}
        <Box className="editor-result-container">
          <Box ref={editorPaneRef} className="editor-pane">
            <Paper className="editor-section">
              <CodeEditor
                onCodeChange={handleCodeChange}
                problemId={problemId}
                loadedDraft={editorDraft}
                starterCodes={problem?.starterCodes ?? []}
              />
            </Paper>
          </Box>

          {/* Vertical adjustment handle */}
          <Box
            className="resize-handle vertical-handle"
            sx={{ ":hover": { backgroundColor: bgcolor } }}
            onMouseDown={(e) => {
              e.preventDefault();
              setResizingVertical(true);
            }}
          >
            <Box className="handle-bar horizontal-bar" />
          </Box>

          {/* Result */}
          <Box className="result-pane">
            <Paper className="result-section">
              {problem && (
                <CodeSubmission
                  problemId={problemId}
                  code={editorState.code}
                  languageId={getLanguageId()}
                  languageLabels={languageMaps.byId}
                  onRestoreSubmission={handleRestoreSubmission}
                  onAssistantSnapshotChange={setAssistantResultSnapshot}
                />
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

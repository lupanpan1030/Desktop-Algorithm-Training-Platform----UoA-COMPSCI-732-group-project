import React, { useState, useEffect, useCallback, useRef } from "react";
import ProblemContent from "../components/ProblemContent";
import CodeEditor from "../components/Editor/Editor";
import { useParams } from "react-router-dom";
import { Paper, Box, Typography, CircularProgress } from "@mui/material";
import "../styles/DetailPage.css";
import CodeSubmission from "../components/Run&SubmitButton";
import { useApi } from "../hooks/useApi";
import { useTheme } from "@mui/material/styles";

export default function DetailPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [editorState, setEditorState] = useState({
    code: "",
    language: "python",
  });
  const [languageMap, setLanguageMap] = useState({});
  const { getProblem, getLanguages, loading, error } = useApi();

  // Reference for resizable elements
  const leftPaneRef = useRef(null);
  const editorPaneRef = useRef(null);
  const containerRef = useRef(null);

  // Monitor whether the current state is being resized
  const [resizingHorizontal, setResizingHorizontal] = useState(false);
  const [resizingVertical, setResizingVertical] = useState(false);

  useEffect(() => {
    async function fetchProblem() {
      const data = await getProblem(Number(id));
      if (data) {
        setProblem(data);
      }
    }
    fetchProblem();
  }, [id, getProblem]);

  // Get a list of supported programming languages and create a mapping
  useEffect(() => {
    async function fetchLanguages() {
      const data = await getLanguages();
      if (data) {
        // Creating Language Name to ID Mappings
        const mapping = {};
        data.forEach((lang) => {
          const key = lang.name.toLowerCase();
          mapping[key] = lang.languageId;
          // Compatible with Monaco's 'cpp' syntax
          if (key === "c++") mapping["cpp"] = lang.languageId;
        });
        setLanguageMap(mapping);
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
    console.log("Editor state changed:", newState);
    setEditorState(newState);
  }, []);

  // Get languageId
  const getLanguageId = () => {
    const id = languageMap[editorState.language.toLowerCase()] || 1;
    console.log(
      "Using language:",
      editorState.language,
      "with ID:",
      id,
      "from map:",
      languageMap
    );
    return id;
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
              <ProblemContent problem={problem} />
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
              <CodeEditor onCodeChange={handleCodeChange} problemId={id} />
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
                  problemId={id}
                  code={editorState.code}
                  languageId={getLanguageId()}
                />
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

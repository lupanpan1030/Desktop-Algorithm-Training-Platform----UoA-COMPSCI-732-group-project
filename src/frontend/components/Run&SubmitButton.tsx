import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import { useApi } from "../hooks/useApi";
import TestResultCard from "./TestResultCard";
import { useTheme,alpha } from "@mui/material";
import { ResponsiveButton } from "./common/ResponsiveComponents";
import { clearProblemCode } from "../utils/localStorageHelper";

interface CodeSubmissionProps {
  problemId: number;
  code: string;
  languageId: number;
}

interface TestResult {
  status: string;
  output?: string;
  runtimeMs: number;
  memoryKb: number;
}

interface RunResponse {
  status: string;
  results: TestResult[];
}

interface SubmitResponse {
  submissionId: number;
  overallStatus: string;
  results: TestResult[];
}

const CodeSubmission: React.FC<CodeSubmissionProps> = ({
  problemId,
  code,
  languageId,
}) => {
  const { runCode, submitCode, loading, error } = useApi();
  const [runResults, setRunResults] = useState<RunResponse | null>(null);
  const [submitResults, setSubmitResults] = useState<SubmitResponse | null>(
    null
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info">(
    "info"
  );
  const [activeView, setActiveView] = useState<"run" | "submit" | null>(null);
  const theme = useTheme();

  // run
  const handleRunCode = async () => {
    if (!code?.trim()) {
      setSnackbarMessage("Please set your code!");
      setSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    console.log("Running code with language ID:", languageId);

    try {
      const response = await runCode(problemId, code, languageId);
      if (response) {
        setRunResults(response);
        setActiveView("run");
        setSnackbarMessage("Run Completed");
        setSeverity("info");
        setOpenSnackbar(true);
      }
    } catch {
      setSnackbarMessage("Run failed");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // submit
  const handleSubmitCode = async () => {
    if (!code?.trim()) {
      setSnackbarMessage("Please set your code!");
      setSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    console.log("Submitting code with language ID:", languageId);

    try {
      const response = await submitCode(problemId, code, languageId);
      if (response) {
        setSubmitResults(response);
        setActiveView("submit");
        setSnackbarMessage("Submitted!");
        setSeverity("info");
        setOpenSnackbar(true);
        clearProblemCode(problemId);
      }
    } catch {
      setSnackbarMessage("Submit failed");
      setSeverity("error");
      setOpenSnackbar(true);
    }
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
      }}
    >
      {/* button */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <ResponsiveButton
          variant="contained"
          sx={{backgroundColor:theme.palette.mode === "dark" ? theme.palette.primary.main :"#96d9d7","&:hover": {backgroundColor: alpha("#96d9d7", 0.9)}}}
          startIcon={<PlayArrowIcon />}
          onClick={handleRunCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Run"}
        </ResponsiveButton>

        <ResponsiveButton
          variant="contained"
          color="secondary"
          startIcon={<SendIcon />}
          onClick={handleSubmitCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Submit"}
        </ResponsiveButton>
      </Box>

      {/* result */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          height: "calc(100% - 30px)",
          p: 2,
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
          {activeView === "run" && runResults && (
            <>
              <Typography variant="h6" gutterBottom>
                Run Results
              </Typography>
              {runResults.results.map((test, index) => (
                <TestResultCard key={index} test={test} />
              ))}
            </>
          )}

          {activeView === "submit" && submitResults && (
            <>
              <Typography variant="h6" gutterBottom>
                Submit Results
              </Typography>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Overall Status:{" "}
                <Box
                  component="span"
                  sx={{
                    color:
                      submitResults.overallStatus === "ACCEPTED"
                        ? "success.main"
                        : "error.main",
                  }}
                >
                  {submitResults.overallStatus}
                </Box>
              </Typography>
              {submitResults.results.map((test, index) => (
                <TestResultCard key={index} test={test} />
              ))}
            </>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed: {error.message || "Try later!"}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Notification */}
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

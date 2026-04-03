import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const OutputBlock = ({ label, value }) => {
  if (value == null) {
    return null;
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1,
          overflowX: "auto",
          borderRadius: 1,
          bgcolor: "background.default",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Box>
    </Box>
  );
};

export default function TestResultCard({ test }) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor:
          test.status === "ACCEPTED"
            ? theme.palette.background.memo
            : theme.palette.background.memoError,
        color:
          theme.palette.mode === "dark"
            ? theme.palette.common.white
            : theme.palette.common.black,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        Status: {test.status}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mt: 0.5, mb: 1 }}
      >
        <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
        <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
        {test.phase && (
          <Typography variant="body2">Phase: {test.phase}</Typography>
        )}
        {test.exitCode != null && (
          <Typography variant="body2">Exit Code: {test.exitCode}</Typography>
        )}
        {test.timedOut && (
          <Typography variant="body2" color="error.main">
            Timed Out
          </Typography>
        )}
      </Stack>
      <OutputBlock label="Primary Output" value={test.output ?? "-"} />
      {test.stdout && test.stdout !== test.output && (
        <OutputBlock label="Stdout" value={test.stdout} />
      )}
      {test.stderr && <OutputBlock label="Stderr" value={test.stderr} />}
      {test.expectedOutput !== undefined && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Expect: {test.expectedOutput || "-"}
        </Typography>
      )}
    </Paper>
  );
}

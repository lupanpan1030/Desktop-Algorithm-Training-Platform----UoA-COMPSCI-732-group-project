import React from "react";
import { Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

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
      {test.output && (
        <Typography variant="body2">Output: {test.output}</Typography>
      )}
      {test.expectedOutput && (<Typography variant="body2">Expect: {test.expectedOutput}</Typography>)}
      <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
      <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
    </Paper>
  );
}

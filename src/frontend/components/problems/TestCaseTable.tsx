import React from "react";
import {
  alpha,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TestCase } from "../../hooks/useApi";

interface Props {
  testcases: TestCase[];
  onEdit: (testcase: TestCase) => void;
  onDelete: (testcase: TestCase) => void;
}

function truncate(value: string, limit = 96) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
}

export default function TestCaseTable({ testcases, onEdit, onDelete }: Props) {
  const theme = useTheme();

  return (
    <Stack spacing={1.1}>
      {testcases.map((testcase) => (
        <Paper
          key={testcase.testcaseId}
          variant="outlined"
          sx={{
            p: 1.4,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.background.paper, 0.44),
            borderColor: alpha(theme.palette.divider, 0.34),
            "& .testcase-row-actions": {
              opacity: 0,
              visibility: "hidden",
              transform: "translateY(-2px)",
              transition: "opacity 160ms ease, visibility 160ms ease, transform 160ms ease",
            },
            "&:hover .testcase-row-actions, &:focus-within .testcase-row-actions": {
              opacity: 1,
              visibility: "visible",
              transform: "translateY(0)",
            },
          }}
        >
          <Stack spacing={1}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                <Chip
                  size="small"
                  color={testcase.isSample ? "primary" : "default"}
                  label={testcase.isSample ? "Sample" : "Hidden"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${testcase.timeLimitMs} ms / ${testcase.memoryLimitMb} MB`}
                />
              </Stack>

              <Stack direction="row" spacing={0.3} className="testcase-row-actions">
                <Tooltip title="Edit test case" arrow>
                  <IconButton size="small" onClick={() => onEdit(testcase)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete test case" arrow>
                  <IconButton size="small" color="error" onClick={() => onDelete(testcase)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Stack spacing={0.7}>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Input
                </Typography>
                <Tooltip title={testcase.input} arrow>
                  <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: "pre-wrap" }}>
                    {truncate(testcase.input)}
                  </Typography>
                </Tooltip>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Expected output
                </Typography>
                <Tooltip title={testcase.expectedOutput} arrow>
                  <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: "pre-wrap" }}>
                    {truncate(testcase.expectedOutput)}
                  </Typography>
                </Tooltip>
              </div>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

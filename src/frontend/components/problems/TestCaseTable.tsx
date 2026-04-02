import React from "react";
import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TestCase } from "../../hooks/useApi";

interface Props {
  testcases: TestCase[];
  onEdit: (testcase: TestCase) => void;
  onDelete: (testcase: TestCase) => void;
}

function truncate(value: string, limit = 64) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
}

export default function TestCaseTable({ testcases, onEdit, onDelete }: Props) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Kind</strong></TableCell>
            <TableCell><strong>Input</strong></TableCell>
            <TableCell><strong>Expected Output</strong></TableCell>
            <TableCell><strong>Limits</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {testcases.map((testcase) => (
            <TableRow key={testcase.testcaseId} hover>
              <TableCell>
                <Chip
                  size="small"
                  color={testcase.isSample ? "primary" : "default"}
                  label={testcase.isSample ? "Sample" : "Hidden"}
                />
              </TableCell>
              <TableCell>
                <Tooltip title={testcase.input} arrow>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {truncate(testcase.input)}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title={testcase.expectedOutput} arrow>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {truncate(testcase.expectedOutput)}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                {testcase.timeLimitMs} ms / {testcase.memoryLimitMb} MB
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Edit test case" arrow>
                  <IconButton size="small" onClick={() => onEdit(testcase)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete test case" arrow>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(testcase)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

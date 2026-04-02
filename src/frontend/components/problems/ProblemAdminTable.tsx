import React from "react";
import {
  Chip,
  IconButton,
  Paper,
  Stack,
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
import type { ProblemSummary } from "../../hooks/useApi";

interface Props {
  problems: ProblemSummary[];
  selectedProblemId: number | null;
  onSelect: (problemId: number) => void;
  onEdit: (problem: ProblemSummary) => void;
  onDelete: (problem: ProblemSummary) => void;
}

const difficultyColorMap: Record<string, "success" | "warning" | "error" | "default"> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "error",
};

export default function ProblemAdminTable({
  problems,
  selectedProblemId,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 560 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Problem</strong></TableCell>
            <TableCell><strong>Meta</strong></TableCell>
            <TableCell><strong>Tests</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {problems.map((problem) => {
            const selected = problem.problemId === selectedProblemId;
            return (
              <TableRow
                hover
                key={problem.problemId}
                selected={selected}
                onClick={() => onSelect(problem.problemId)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Typography variant="subtitle2">{problem.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{problem.problemId}
                    {problem.externalProblemId
                      ? ` · external ${problem.externalProblemId}`
                      : ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      label={problem.difficulty}
                      color={difficultyColorMap[problem.difficulty] ?? "default"}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${problem.source} / ${problem.locale}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={problem.judgeReady ? "Judge Ready" : "Needs Tests"}
                      size="small"
                      color={problem.judgeReady ? "success" : "default"}
                    />
                  </Stack>
                </TableCell>
                <TableCell>{problem.testcaseCount}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit problem" arrow>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(problem);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete problem" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(problem);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

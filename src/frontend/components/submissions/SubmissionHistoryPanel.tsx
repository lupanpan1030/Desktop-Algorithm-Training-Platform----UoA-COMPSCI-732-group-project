import React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import type { SubmissionDetail, SubmissionListItem } from "../../hooks/useApi";
import TestResultCard from "../TestResultCard";

interface SubmissionHistoryPanelProps {
  submissions: SubmissionListItem[];
  totalSubmissionCount: number;
  availableStatuses: string[];
  statusFilter: string;
  selectedSubmissionId: number | null;
  selectedSubmission: SubmissionDetail | null;
  listLoading: boolean;
  detailLoading: boolean;
  errorMessage: string | null;
  languageLabels: Record<number, string>;
  onChangeStatusFilter: (status: string) => void;
  onRefresh: () => void;
  onSelectSubmission: (submissionId: number) => void;
  onRestoreSubmission: () => void;
}

const formatSubmissionDate = (submittedAt: string) => {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) {
    return submittedAt;
  }

  return date.toLocaleString();
};

const getStatusColor = (status: string): ChipProps["color"] => {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "WRONG_ANSWER":
    case "RUNTIME_ERROR":
    case "COMPILE_ERROR":
    case "TIME_LIMIT_EXCEEDED":
      return "error";
    default:
      return "default";
  }
};

export default function SubmissionHistoryPanel({
  submissions,
  totalSubmissionCount,
  availableStatuses,
  statusFilter,
  selectedSubmissionId,
  selectedSubmission,
  listLoading,
  detailLoading,
  errorMessage,
  languageLabels,
  onChangeStatusFilter,
  onRefresh,
  onSelectSubmission,
  onRestoreSubmission,
}: SubmissionHistoryPanelProps) {
  const isFiltered = statusFilter !== "ALL";
  const recordLabel = isFiltered
    ? `${submissions.length}/${totalSubmissionCount} shown`
    : `${totalSubmissionCount} record${totalSubmissionCount === 1 ? "" : "s"}`;
  const handleSelectWithKeyboard = (
    event: React.KeyboardEvent<HTMLDivElement>,
    submissionId: number
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSubmission(submissionId);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Typography variant="h6">Submission History</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={recordLabel} />
          <Tooltip title="Refresh submission history">
            <span>
              <IconButton
                size="small"
                aria-label="Refresh submission history"
                onClick={onRefresh}
                disabled={listLoading}
              >
                {listLoading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <FormControl size="small" sx={{ maxWidth: 220 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) => onChangeStatusFilter(event.target.value)}
        >
          <MenuItem value="ALL">All statuses</MenuItem>
          {availableStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {listLoading && totalSubmissionCount === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : totalSubmissionCount === 0 ? (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            No submissions yet. Submit a solution first to build a history for
            this problem.
          </Typography>
        </Paper>
      ) : submissions.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            No submissions match the current status filter.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5} role="listbox" aria-label="Submission history list">
          {submissions.map((submission) => {
            const selected = submission.submissionId === selectedSubmissionId;

            return (
              <Paper
                key={submission.submissionId}
                variant="outlined"
                onClick={() => onSelectSubmission(submission.submissionId)}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                onKeyDown={(event) => handleSelectWithKeyboard(event, submission.submissionId)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderColor: selected ? "primary.main" : "divider",
                  boxShadow: selected ? 2 : 0,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      Submission #{submission.submissionId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {languageLabels[submission.languageId] ??
                        `Language #${submission.languageId}`}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={getStatusColor(submission.status)}
                    label={submission.status}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  {formatSubmissionDate(submission.submittedAt)}
                </Typography>
              </Paper>
            );
          })}
        </Stack>
      )}

      {selectedSubmission && (
        <>
          <Divider />
          <Stack spacing={1}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Submission #{selectedSubmission.submissionId}
              </Typography>
              <Button variant="outlined" size="small" onClick={onRestoreSubmission}>
                Load Into Editor
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Submitted at {formatSubmissionDate(selectedSubmission.submittedAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Language:{" "}
              {languageLabels[selectedSubmission.languageId] ??
                `Language #${selectedSubmission.languageId}`}
            </Typography>
            <Chip
              size="small"
              sx={{ width: "fit-content" }}
              color={getStatusColor(selectedSubmission.status)}
              label={selectedSubmission.status}
            />
          </Stack>

          <Accordion disableGutters sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Submitted Code</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  overflowX: "auto",
                  borderRadius: 1,
                  bgcolor: "background.default",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              >
                {selectedSubmission.code}
              </Box>
            </AccordionDetails>
          </Accordion>

          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            selectedSubmission.results.map((test, index) => (
              <TestResultCard key={`${selectedSubmission.submissionId}-${index}`} test={test} />
            ))
          )}
        </>
      )}
    </Box>
  );
}

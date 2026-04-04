import React from "react";
import {
  alpha,
  Box,
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

function buildSecondaryMeta(problem: ProblemSummary) {
  const items = [
    `${problem.sampleCaseCount} sample / ${problem.hiddenCaseCount} hidden`,
    `${problem.source} / ${problem.locale}`,
  ];

  if (problem.sampleReferenceAvailable) {
    items.push("sample ref");
  }

  if (problem.sourceSlug) {
    items.push(problem.sourceSlug);
  }

  return items.join(" · ");
}

export default function ProblemAdminTable({
  problems,
  selectedProblemId,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme();

  return (
    <Stack spacing={1.1}>
      {problems.map((problem) => {
        const selected = problem.problemId === selectedProblemId;

        return (
          <Paper
            key={problem.problemId}
            variant="outlined"
            onClick={() => onSelect(problem.problemId)}
            sx={{
              p: 1.05,
              borderRadius: 3.5,
              cursor: "pointer",
              borderColor: selected
                ? alpha(theme.palette.primary.main, 0.42)
                : alpha(theme.palette.divider, 0.34),
              bgcolor: selected
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.background.paper, 0.44),
              transition:
                "transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
              "& .problem-row-actions": {
                opacity: selected ? 1 : 0,
                visibility: selected ? "visible" : "hidden",
                transform: selected ? "translateY(0)" : "translateY(-2px)",
                transition: "opacity 160ms ease, visibility 160ms ease, transform 160ms ease",
              },
              "&:hover": {
                transform: "translateY(-1px)",
                borderColor: alpha(theme.palette.primary.main, 0.3),
                boxShadow: `0 12px 26px ${alpha(theme.palette.primary.main, 0.08)}`,
              },
              "&:hover .problem-row-actions, &:focus-within .problem-row-actions": {
                opacity: 1,
                visibility: "visible",
                transform: "translateY(0)",
              },
            }}
          >
            <Stack spacing={0.8}>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {problem.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{problem.problemId}
                    {problem.externalProblemId ? ` · external ${problem.externalProblemId}` : ""}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.3} className="problem-row-actions" sx={{ flexShrink: 0 }}>
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
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                <Chip
                  label={problem.difficulty}
                  color={difficultyColorMap[problem.difficulty] ?? "default"}
                  size="small"
                />
                <Chip
                  label={problem.judgeReady ? "Judge ready" : "Needs tests"}
                  size="small"
                  variant={problem.judgeReady ? "filled" : "outlined"}
                />
                {problem.tags.length > 0 && (
                  <Chip label={`${problem.tags.length} tags`} size="small" variant="outlined" />
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {buildSecondaryMeta(problem)}
              </Typography>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

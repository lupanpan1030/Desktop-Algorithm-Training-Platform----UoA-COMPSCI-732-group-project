import React from "react";
import {
  alpha,
  Box,
  Chip,
  List,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssignmentLateOutlinedIcon from "@mui/icons-material/AssignmentLateOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { Link } from "react-router-dom";

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "success";
    case "MEDIUM":
      return "warning";
    case "HARD":
      return "error";
    default:
      return "default";
  }
}

function completionDescriptor(problem) {
  if (problem.completionState === "Completed") {
    return {
      icon: <TaskAltIcon sx={{ color: "success.main" }} />,
      label: "Completed",
    };
  }

  if (problem.completionState === "Attempted") {
    return {
      icon: <AssignmentLateOutlinedIcon sx={{ color: "warning.main" }} />,
      label: "Attempted",
    };
  }

  return {
    icon: <RadioButtonUncheckedRoundedIcon sx={{ color: "text.secondary" }} />,
    label: "Unattempted",
  };
}

function sourceLabel(source) {
  if (!source || source === "LOCAL") {
    return "Local";
  }

  if (source === "LEETCODE") {
    return "LeetCode";
  }

  return source
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProblemList({ problems }) {
  const theme = useTheme();

  return (
    <List
      disablePadding
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.9,
      }}
    >
      {problems.map((problem) => {
        const completion = completionDescriptor(problem);
        const sampleCaseCount = Number(problem.sampleCaseCount ?? 0);
        const hiddenCaseCount = Number(problem.hiddenCaseCount ?? 0);
        const secondaryMeta = [sourceLabel(problem.source)];

        if (hiddenCaseCount > 0) {
          secondaryMeta.push(`${hiddenCaseCount} hidden`);
        }

        if (sampleCaseCount > 0) {
          secondaryMeta.push(`${sampleCaseCount} sample`);
        }

        if (problem.tags?.length > 0) {
          secondaryMeta.push(problem.tags[0]);
        }

        return (
          <ListItemButton
            disableGutters
            component={Link}
            to={`/problems/${problem.problemId}`}
            key={problem.problemId}
            sx={{
              display: "block",
              p: 0,
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.34),
              bgcolor: alpha(theme.palette.background.paper, 0.36),
              transition:
                "transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
              "&:hover": {
                transform: "translateY(-1px)",
                borderColor: alpha(theme.palette.primary.main, 0.2),
                bgcolor: alpha(theme.palette.background.paper, 0.56),
                boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.07)}`,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.4}
              alignItems="stretch"
              sx={{ p: { xs: 1.05, md: 1.2 } }}
            >
              <Stack spacing={0.65} sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={0.8}
                  justifyContent="space-between"
                  alignItems={{ md: "center" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Tooltip title={completion.label} arrow placement="top">
                      <Box sx={{ display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {completion.icon}
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "0.98rem", md: "1rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {problem.title}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      size="small"
                      label={problem.difficulty}
                      color={getDifficultyColor(problem.difficulty)}
                    />
                    <Chip size="small" label={completion.label} variant="outlined" />
                    <Chip
                      size="small"
                      label={problem.judgeReady ? "Judge ready" : "Needs tests"}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "block", minHeight: 18 }}
                >
                  {secondaryMeta.join(" · ")}
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  flexShrink: 0,
                  pr: { md: 0.5 },
                }}
              >
                <ChevronRightRoundedIcon />
              </Box>
            </Stack>
          </ListItemButton>
        );
      })}
    </List>
  );
}

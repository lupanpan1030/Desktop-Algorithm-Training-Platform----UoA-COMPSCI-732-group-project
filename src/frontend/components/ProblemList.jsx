import React from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Box,
  Tooltip,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssignmentLateOutlinedIcon from "@mui/icons-material/AssignmentLateOutlined";
// import {TaskAltIcon,AssignmentLateOutlinedIcon} from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function ProblemList({ problems, filtersOpen }) {
  const getDifficultyColor = (difficulty) => {
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
  };

  return (
    <List
      disablePadding
      sx={{
        overflowY: "auto",
        maxHeight: {xs:`${filtersOpen ? "calc(100vh - 395px)" : "calc(100vh - 200px)"}`,sm:`${
          filtersOpen ? "calc(100vh - 310px)" : "calc(100vh - 200px)"
        }`},
      }}
    >
      {problems.map((problem) => (
        <ListItemButton
          disableGutters
          sx={{
            p: 1,
            "&:nth-of-type(odd)": { backgroundColor: "action.rowStripe" },
            "&:hover": { backgroundColor: "action.rowHover" },
          }}
          component={Link}
          to={`/problems/${problem.problemId}`}
          key={problem.problemId}
        >
          <Stack direction="row" spacing={2} alignItems="center" width="99%">
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box component="span">{problem.title}</Box>
                  {problem.completionState === "Completed" && (
                    <Tooltip title="Completed" arrow placement="right">
                      <TaskAltIcon
                        sx={{ color: "success.main", fontSize: 20 }}
                      />
                    </Tooltip>
                  )}
                  {problem.completionState === "Attempted" && (
                    <Tooltip title="Attempted" arrow placement="right">
                      <AssignmentLateOutlinedIcon
                        sx={{ color: "warning.main", fontSize: 20 }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              }
              slotProps={{ variant: "subtitle1", fontWeight: 500 }}
            />
            <Chip
              label={problem.difficulty}
              color={getDifficultyColor(problem.difficulty)}
              size="small"
              variant="outlined"
            />
          </Stack>
        </ListItemButton>
      ))}
    </List>
  );
}

import React from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssignmentLateOutlinedIcon from "@mui/icons-material/AssignmentLateOutlined";
import { Link } from "react-router-dom";
import { ResponsiveChip } from "./common/ResponsiveComponents";

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
    <List disablePadding sx={{ flexGrow: 1, overflowY: "auto" }}>
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
                  {/* <Box component="span" variant>{problem.title}</Box> */}
                  <Typography variant="h6">{problem.title}</Typography>
                  {problem.completionState === "Completed" && (
                    <Tooltip title="Completed" arrow placement="right">
                      <TaskAltIcon sx={{ color: "success.main" }} />
                    </Tooltip>
                  )}
                  {problem.completionState === "Attempted" && (
                    <Tooltip title="Attempted" arrow placement="right">
                      <AssignmentLateOutlinedIcon
                        sx={{ color: "warning.main" }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              }
              slotProps={{ variant: "subtitle1", fontWeight: 500 }}
            />
            <ResponsiveChip
              label={problem.difficulty}
              color={getDifficultyColor(problem.difficulty)}
              variant="outlined"
            />
          </Stack>
        </ListItemButton>
      ))}
    </List>
  );
}

import React from "react";
import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

export default function FiltersPanel({
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
  horizontal = false,
}) {
  return (
    <Stack
      spacing={horizontal ? 3 : 2}
      direction={horizontal ? "row" : "column"}
      sx={{ p: 2 }}
    >
      {/* Difficulty toggle */}
      <div>
        <Typography variant="body2" gutterBottom>
          Difficulty
        </Typography>
        <ToggleButtonGroup
          value={difficultyFilter}
          onChange={(_, v) => onDifficultyChange(v)} // keep array
          aria-label="difficulty filter"
          size="small"
        >
          {["EASY", "MEDIUM", "HARD"].map((level) => (
            <ToggleButton
              key={level}
              value={level}
              sx={{ fontSize: "0.75rem", px: 1.5 }}
            >
              {level}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {/* Completion status filter */}
      <div style={{ marginLeft: horizontal ? 32 : 0 }}>
        <Typography variant="body2" gutterBottom>
          Status
        </Typography>
        <ToggleButtonGroup
          value={statusFilter}
          onChange={(_, v) => onStatusChange(v)}
          aria-label="status filter"
          size="small"
          exclusive={false}
        >
          {["Completed", "Attempted", "Unattempted"].map((s) => (
            <ToggleButton
              key={s}
              value={s}
              sx={{ fontSize: "0.75rem", px: 1.5 }}
            >
              {s}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {/* Clear filters */}
      <Stack
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        sx={{ marginLeft: horizontal ? 32 : 0, pr: 4}}
      >
        <Typography variant="body2" gutterBottom>
          Clear
        </Typography>
        <IconButton
          onClick={() => {
            onDifficultyChange([]);
            onStatusChange([]);
          }}
          aria-label="clear filters"
          size="small"
        >
          <ReplayIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

import React from "react";
import {
  Box,
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
      direction={horizontal ? "row" : "column"}
      spacing={horizontal ? 3 : 1.5}
      useFlexGap
      sx={{
        p: 2,
        flexWrap: { xs: "wrap", sm: "nowrap" },
        alignItems: "center",
      }}
    >
      {/* Difficulty toggle */}
      <Box
        sx={{
          order: { xs: 1, sm: 1 },
        }}
      >
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
      </Box>

      {/* Completion status filter */}
      <Box
        sx={{
          order: { xs: 3, sm: 2 },
          flexBasis: { xs: "100%", sm: "auto" }, // forces its own row on xs
          alignSelf: "flex-start",
        }}
      >
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
      </Box>

      {/* Clear filters */}
      <Stack
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          order: { xs: 2, sm: 3 },
        }}
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

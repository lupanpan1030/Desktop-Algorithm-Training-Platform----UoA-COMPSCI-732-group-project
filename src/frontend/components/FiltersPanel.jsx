import React from "react";
import {
  Box,
  Stack,
  ToggleButton,
  Typography,
  IconButton,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import {ResponsiveToggleGroup} from "./common/ResponsiveComponents";

export default function FiltersPanel({
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <Stack
      sx={{
        px: 2,
        py: { xs: 0, sm: 1 },
        useFlexGap: true,
        flexDirection: "row",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        alignItems: "center",
        columnGap: 3,
        rowGap: 1,
      }}
    >
      {/* Difficulty toggle */}
      <Box
        sx={{
          order: { xs: 1, sm: 1 },
        }}
      >
        <Typography variant="body1" gutterBottom>
          Difficulty
        </Typography>
        <ResponsiveToggleGroup
          value={difficultyFilter}
          onChange={(_, v) => onDifficultyChange(v)} // keep array
          aria-label="difficulty filter"
        >
          {["EASY", "MEDIUM", "HARD"].map((level) => (
            <ToggleButton
              key={level}
              value={level}
            >
              {level}
            </ToggleButton>
          ))}
        </ResponsiveToggleGroup>
      </Box>

      {/* Completion status filter */}
      <Box
        sx={{
          order: { xs: 3, sm: 2 },
          flexBasis: { xs: "100%", sm: "auto" },
          alignSelf: "flex-start",
        }}
      >
        <Typography variant="body1" gutterBottom>
          Status
        </Typography>
        <ResponsiveToggleGroup
          value={statusFilter}
          onChange={(_, v) => onStatusChange(v)}
          aria-label="status filter"
          exclusive={false}
        >
          {["Completed", "Attempted", "Unattempted"].map((s) => (
            <ToggleButton
              key={s}
              value={s}
            >
              {s}
            </ToggleButton>
          ))}
        </ResponsiveToggleGroup>
      </Box>

      {/* Clear filters */}
      <Stack
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          order: { xs: 2, sm: 3 },
          display: { xs: "none", ssm: "flex" },   // hide on < ssm, show ≥ ssm
        }}
      >
        <Typography variant="body1" gutterBottom>
          Clear
        </Typography>
        <IconButton
          onClick={() => {
            onDifficultyChange([]);
            onStatusChange([]);
          }}
          aria-label="clear filters"
        >
          <ReplayIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}

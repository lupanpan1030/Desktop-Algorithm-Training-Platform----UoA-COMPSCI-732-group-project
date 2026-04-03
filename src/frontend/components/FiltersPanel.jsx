import React from "react";
import {
  alpha,
  Box,
  Chip,
  IconButton,
  Stack,
  ToggleButton,
  Typography,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { useTheme } from "@mui/material/styles";
import { ResponsiveToggleGroup } from "./common/ResponsiveComponents";

function countActiveFilters(difficultyFilter, statusFilter) {
  return difficultyFilter.length + statusFilter.length;
}

function FilterSection({ title, children }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", letterSpacing: 0.7, display: "block", mb: 0.9 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function FiltersPanel({
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
}) {
  const theme = useTheme();
  const activeFilterCount = countActiveFilters(difficultyFilter, statusFilter);

  return (
    <Stack
      sx={{
        height: "100%",
        minHeight: 0,
        p: 1.35,
        borderRadius: 4.5,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.34),
        bgcolor: alpha(theme.palette.background.paper, 0.34),
        backdropFilter: "blur(14px)",
      }}
      spacing={1.35}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 0.8, display: "block", lineHeight: 1.35 }}
          >
            Filters
          </Typography>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.1, mt: 0.25, fontWeight: 700 }}>
            Narrow the list
          </Typography>
        </Box>
        <IconButton
          onClick={() => {
            onDifficultyChange([]);
            onStatusChange([]);
          }}
          aria-label="clear filters"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.default, 0.48),
            width: 34,
            height: 34,
          }}
        >
          <ReplayIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip
          size="small"
          icon={<TuneRoundedIcon fontSize="small" />}
          label={`${activeFilterCount} active`}
          variant="outlined"
        />
        {difficultyFilter.length > 0 && (
          <Chip size="small" label={`Difficulty: ${difficultyFilter.join(", ")}`} />
        )}
        {statusFilter.length > 0 && (
          <Chip size="small" label={`Status: ${statusFilter.join(", ")}`} />
        )}
      </Stack>

      <FilterSection title="Difficulty">
        <ResponsiveToggleGroup
          value={difficultyFilter}
          onChange={(_, value) => onDifficultyChange(value)}
          aria-label="difficulty filter"
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {["EASY", "MEDIUM", "HARD"].map((level) => (
            <ToggleButton key={level} value={level}>
              {level}
            </ToggleButton>
          ))}
        </ResponsiveToggleGroup>
      </FilterSection>

      <FilterSection title="Status">
        <ResponsiveToggleGroup
          value={statusFilter}
          onChange={(_, value) => onStatusChange(value)}
          aria-label="status filter"
          exclusive={false}
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {["Completed", "Attempted", "Unattempted"].map((status) => (
            <ToggleButton key={status} value={status}>
              {status}
            </ToggleButton>
          ))}
        </ResponsiveToggleGroup>
      </FilterSection>

      <Box
        sx={{
          mt: "auto",
          pt: 0.9,
          borderTop: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.42),
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Filter by difficulty or progress.
        </Typography>
      </Box>
    </Stack>
  );
}

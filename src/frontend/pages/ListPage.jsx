import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  alpha,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import FiltersPanel from "../components/FiltersPanel";
import ProblemList from "../components/ProblemList";
import { useApi } from "../hooks/useApi";
import { useProblemLocale } from "../problem-locale";
import { useAiPageContext } from "../ai/useAiPageContext";

function buildCompletionSummary(problems) {
  return {
    completed: problems.filter((problem) => problem.completionState === "Completed").length,
    attempted: problems.filter((problem) => problem.completionState === "Attempted").length,
    unattempted: problems.filter((problem) => problem.completionState !== "Completed" && problem.completionState !== "Attempted").length,
  };
}

function SummaryCard({ label, value, helper }) {
  return (
    <Box
      sx={(theme) => ({
        py: 0.7,
        pl: 1.1,
        pr: 1,
        minWidth: 0,
        borderLeft: "2px solid",
        borderColor: alpha(theme.palette.primary.main, 0.34),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.25, lineHeight: 1.02 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.35, display: "block" }}>
        {helper}
      </Typography>
    </Box>
  );
}

export default function ListPage() {
  const theme = useTheme();
  const desktopFilters = useMediaQuery(theme.breakpoints.up("lg"));
  const [problems, setProblems] = useState([]);
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const { getProblems, loading, error } = useApi();
  const { locale } = useProblemLocale();
  const [filtersOpen, setFiltersOpen] = useState(desktopFilters);

  useEffect(() => {
    setFiltersOpen(desktopFilters);
  }, [desktopFilters]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProblems(locale, true);
        setProblems(data);
      } catch {
        setProblems([]);
      }
    }
    fetchData();
  }, [getProblems, locale]);

  const visibleProblems = useMemo(() => {
    return problems.filter((problem) => {
      const diffOK =
        !difficultyFilter.length || difficultyFilter.includes(problem.difficulty);
      const statusOK =
        !statusFilter.length || statusFilter.includes(problem.completionState);
      return diffOK && statusOK;
    });
  }, [difficultyFilter, problems, statusFilter]);

  const activeFilterCount = difficultyFilter.length + statusFilter.length;
  const completionSummary = useMemo(
    () => buildCompletionSummary(visibleProblems),
    [visibleProblems]
  );

  const pageContext = useMemo(
    () => ({
      pageKind: "problem-list",
      route: "/",
      pageTitle: "Problem List",
      summary: `Browsing ${visibleProblems.length} visible problems out of ${problems.length} in ${locale}.`,
      locale,
      facts: [
        {
          key: "visibleCount",
          label: "Visible problems",
          value: String(visibleProblems.length),
        },
        {
          key: "totalCount",
          label: "Total problems",
          value: String(problems.length),
        },
        {
          key: "difficultyFilter",
          label: "Difficulty filters",
          value: difficultyFilter.length ? difficultyFilter.join(", ") : "all",
        },
        {
          key: "statusFilter",
          label: "Status filters",
          value: statusFilter.length ? statusFilter.join(", ") : "all",
        },
      ],
      contextText: visibleProblems
        .slice(0, 8)
        .map(
          (problem, index) =>
            `${index + 1}. ${problem.title} [${problem.difficulty}] ${problem.completionState ?? "Unattempted"}`
        ),
      suggestedPrompts: [
        "Help me choose the next problem",
        "Explain these filters",
        "Recommend a good warm-up problem",
        "What should I solve next based on the visible list?",
      ],
    }),
    [
      difficultyFilter,
      locale,
      problems.length,
      statusFilter,
      visibleProblems,
    ]
  );

  useAiPageContext(pageContext);

  if (error && problems.length === 0) {
    return (
      <Alert severity="error" sx={{ borderRadius: 4 }}>
        Error loading problems: {error.message}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.6,
        alignItems: "start",
        gridTemplateColumns: {
          xs: "1fr",
          lg: filtersOpen ? "minmax(0, 1fr) minmax(220px, 248px)" : "1fr",
        },
      }}
    >
      {filtersOpen && (
        <Box
          sx={{
            minHeight: 0,
            order: { xs: 0, lg: 2 },
            alignSelf: "start",
            position: { lg: "sticky" },
            top: { lg: 0 },
          }}
        >
          <FiltersPanel
            difficultyFilter={difficultyFilter}
            statusFilter={statusFilter}
            onDifficultyChange={setDifficultyFilter}
            onStatusChange={setStatusFilter}
          />
        </Box>
      )}

      <Box
        component="section"
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          order: 1,
          minWidth: 0,
          borderTop: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.34),
        })}
      >
        <Box sx={{ px: { xs: 1.7, md: 2.1 }, pt: { xs: 1.55, md: 1.8 }, pb: 1.1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.1}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 0.72, display: "block", lineHeight: 1.35 }}
              >
                Catalog
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.15, lineHeight: 1.14 }}>
                Problem list
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, maxWidth: 620 }}>
                Scan progress, filter the catalog, and jump straight into the workspace.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              <Chip label={`${locale} workspace`} variant="outlined" />
              <Chip
                label={`${activeFilterCount} active filters`}
                variant={activeFilterCount > 0 ? "filled" : "outlined"}
              />
              <IconButton
                onClick={() => setFiltersOpen((previous) => !previous)}
                aria-label="toggle filters"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: alpha(theme.palette.background.default, 0.45),
                }}
              >
                <FilterListIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Box
            sx={{
              mt: 1.4,
              display: "grid",
              gap: 0.9,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                xl: "repeat(2, minmax(0, 180px)) 1fr",
              },
              alignItems: "stretch",
            }}
          >
            <SummaryCard
              label="Visible"
              value={visibleProblems.length}
              helper="Problems in scope"
            />
            <SummaryCard
              label="Fresh"
              value={completionSummary.unattempted}
              helper="Unattempted problems"
            />
            <Box
              sx={(theme) => ({
                px: 1.2,
                py: 1,
                display: "flex",
                alignItems: "center",
                borderLeft: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.42),
              })}
            >
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip size="small" label={`Completed ${completionSummary.completed}`} variant="outlined" />
                <Chip size="small" label={`Attempted ${completionSummary.attempted}`} variant="outlined" />
                <Chip size="small" label={`${activeFilterCount} active filters`} variant={activeFilterCount > 0 ? "filled" : "outlined"} />
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            px: { xs: 1.7, md: 2.1 },
            pb: 1.8,
          }}
        >
          {loading ? (
            <Box
              sx={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stack spacing={1.4} alignItems="center">
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading problem catalog...
                </Typography>
              </Stack>
            </Box>
          ) : visibleProblems.length ? (
            <ProblemList problems={visibleProblems} />
          ) : (
            <Box
              sx={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={(theme) => ({
                  px: 3,
                  py: 2.4,
                  maxWidth: 420,
                  textAlign: "center",
                  borderTop: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.42),
                })}
              >
                <Typography variant="h6">No problems found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                  Try clearing the filters or switching the workspace locale.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import FiltersPanel from "../components/FiltersPanel";
import ProblemList from "../components/ProblemList";
import { useApi } from "../hooks/useApi";
import { useProblemLocale } from "../problem-locale";
import { useAiPageContext } from "../ai/useAiPageContext";

export default function ListPage() {
  const [problems, setProblems] = useState([]);
  const [difficultyFilter, setDifficultyFilter] = useState([]); // [] = show all
  const [statusFilter, setStatusFilter] = useState([]); // [] = show all
  const { getProblems, loading, error } = useApi();
  const { locale } = useProblemLocale();

  const [filtersOpen, setFiltersOpen] = useState(false); // sidebar collapsed by default

  useEffect(() => {
    async function fetchData() {
      const data = await getProblems(locale, true);
      if (data) {
        setProblems(data);
      }
    }
    fetchData();
  }, [getProblems, locale]);

  const visibleProblems = useMemo(() => {
    return problems.filter((p) => {
      // difficulty filter
      const diffOK =
        !difficultyFilter.length || difficultyFilter.includes(p.difficulty);
      const statusOK =
        !statusFilter.length || statusFilter.includes(p.completionState);
      return diffOK && statusOK;
    });
  }, [problems, difficultyFilter, statusFilter]);

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

  if (error) {
    return <Typography>Error loading problems</Typography>;
  }

  // header is shown even if list is empty
  const header = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 1,
        mt: 1.5,
        pl: 0,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ m: 2, ml: 1 }}>
        Problem List
      </Typography>
      <IconButton
        onClick={() => setFiltersOpen((prev) => !prev)}
        aria-label="toggle filters"
      >
        <FilterListIcon />
      </IconButton>
    </Box>
  );

  return (
    <Box sx={{ pt: 3, px: 3 }}>
      <Paper
        sx={(theme) => ({
          p: 2,
          overflowX: "auto",
          display: "flex",
          flexDirection: "column",
          height: `calc(100vh - ${theme.spacing(14)})`,
          pb: 2,
        })}
      >
        {header}

        {/* Horizontal filters bar */}
        {filtersOpen && (
          <Box sx={{ mb: 2 }}>
            <FiltersPanel
              horizontal
              difficultyFilter={difficultyFilter}
              statusFilter={statusFilter}
              onDifficultyChange={setDifficultyFilter}
              onStatusChange={setStatusFilter}
            />
          </Box>
        )}

        {/* Problem list (takes full width) */}
        {loading ? (
          <Typography>Loading...</Typography>
        ) : visibleProblems.length ? (
          <ProblemList problems={visibleProblems} filtersOpen={filtersOpen} />
        ) : (
          <Typography>No problems found</Typography>
        )}
      </Paper>
    </Box>
  );
}

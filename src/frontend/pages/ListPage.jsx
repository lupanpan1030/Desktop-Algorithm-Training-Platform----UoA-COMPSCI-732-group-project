import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiltersPanel from '../components/FiltersPanel';
import ProblemList from '../components/ProblemList';
import { useApi } from '../hooks/useApi';

export default function ListPage() {
    const [problems, setProblems] = useState([]);
    const [difficultyFilter, setDifficultyFilter] = useState([]);   // [] = show all
    const [statusFilter, setStatusFilter] = useState([]);     // [] = show all
    const { getProblems, loading, error } = useApi();

    const [filtersOpen, setFiltersOpen] = useState(false);   // sidebar collapsed by default

    useEffect(() => {
        async function fetchData() {
            const data = await getProblems();
            if (data) {
                setProblems(data);
            }
        }
        fetchData();
    }, [getProblems]);

    const visibleProblems = useMemo(() => {
        return problems.filter(p => {
            // difficulty filter
            const diffOK = !difficultyFilter.length || difficultyFilter.includes(p.difficulty);
            // status filter (`Unattempted` when null/undefined)
            const statusOK = !statusFilter.length || statusFilter.includes(p.completionState);
            return diffOK && statusOK;
        });
    }, [problems, difficultyFilter, statusFilter]);

    if (error) {
        return <Typography>Error loading problems</Typography>;
    }

    // header is shown even if list is empty
    const header = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,    
          mt:1.5,
          pl: 0,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ mr: 1 }}>
          Problem List
        </Typography>
        <IconButton
          size="small"
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label="toggle filters"
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Box>
    );

    return (
      <Box sx={{ pt: 3, px: 3 }}>
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
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

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiltersPanel from '../components/FiltersPanel';
import ProblemList from '../components/ProblemList';

export default function HomePage() {
    const [problems, setProblems] = useState([]);
    const [difficultyFilter, setDifficultyFilter] = useState([]);   // [] = show all
    const [statusFilter, setStatusFilter]       = useState([]);     // [] = show all
    const [error, setError] = useState(false);

    const [filtersOpen, setFiltersOpen] = useState(false);   // sidebar collapsed by default

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('http://localhost:6785/problems');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('Invalid data');
                setProblems(data);
            } catch (e) {
                setError(true);
            }
        }
        fetchData();
    }, []);

    const visibleProblems = useMemo(() => {
        return problems.filter(p => {
            // difficulty filter
            const diffOK = !difficultyFilter.length || difficultyFilter.includes(p.difficulty);

            // status filter (`Unattempted` when null/undefined)
            const status = p.completionState ?? 'Unattempted';
            const statusOK = !statusFilter.length || statusFilter.includes(status);

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
        <Typography variant="h5" component="h2" sx={{ mr: 1 }}>
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
        <Paper elevation={0} sx={{ p: 2, overflowX: 'auto' }}>
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
        {visibleProblems.length ? (
          <ProblemList problems={visibleProblems} />
        ) : (
          <Typography>No problems found</Typography>
        )}
        </Paper>
      </Box>
    );
}

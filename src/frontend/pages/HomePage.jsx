import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import ProblemList from '../components/ProblemList';

export default function HomePage() {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('http://localhost:6785/problems');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('Invalid data');
                setProblems(data);
                setFilteredProblems(data);
            } catch (e) {
                setError(true);
            }
        }
        fetchData();
    }, []);

    const handleDifficultyChange = (event, newValue) => {
        setSelectedDifficulty(newValue);
        if (newValue === 'ALL') {
            setFilteredProblems(problems);
        } else {
            setFilteredProblems(problems.filter(problem => problem.difficulty === newValue));
        }
    };

    if (error) {
        return <Typography>Error loading problems</Typography>;
    }

    if (filteredProblems.length === 0) {
        return (
            <Box>
                <Tabs
                    value={selectedDifficulty}
                    onChange={handleDifficultyChange}
                    centered
                    sx={{ mb: 2 }}
                >
                    <Tab value="ALL" label="All" />
                    <Tab value="EASY" label="Easy" />
                    <Tab value="MEDIUM" label="Medium" />
                    <Tab value="HARD" label="Hard" />
                </Tabs>
                <Typography>No problems found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Tabs
                value={selectedDifficulty}
                onChange={handleDifficultyChange}
                centered
                sx={{ mb: 2 }}
            >
                <Tab value="ALL" label="All" />
                <Tab value="EASY" label="Easy" />
                <Tab value="MEDIUM" label="Medium" />
                <Tab value="HARD" label="Hard" />
            </Tabs>
            <ProblemList problems={filteredProblems} />
        </Box>
    );
}

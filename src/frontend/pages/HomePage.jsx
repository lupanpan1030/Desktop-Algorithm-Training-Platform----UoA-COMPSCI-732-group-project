import React from 'react';
import { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

import ProblemList from '../components/ProblemList';

export default function HomePage() {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:6785/problems');
            const data = await response.json();
            setProblems(data);
            setFilteredProblems(data);
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
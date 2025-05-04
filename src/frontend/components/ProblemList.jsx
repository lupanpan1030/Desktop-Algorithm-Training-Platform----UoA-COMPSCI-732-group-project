import React from "react";
import { List, ListItemButton, ListItemText, Chip, Stack } from "@mui/material";
import { Link } from "react-router-dom";

export default function ProblemList({problems}) {
    const getDifficultyColor = (difficulty) => {
        switch(difficulty) {
            case 'EASY': return 'success';
            case 'MEDIUM': return 'warning';
            case 'HARD': return 'error';
            default: return 'default';
        }
    };

    return (
        <List>
            {problems.map((problem) => (
                <ListItemButton 
                    component={Link} 
                    to={`/problems/${problem.problemId}`} 
                    key={problem.problemId}
                > 
                    <Stack direction="row" spacing={2} alignItems="center" width="100%">
                        <ListItemText primary={problem.title} />
                        <Chip 
                            label={problem.difficulty} 
                            color={getDifficultyColor(problem.difficulty)}
                            size="small"
                        />
                    </Stack>
                </ListItemButton>
            ))}
        </List>
    );
}
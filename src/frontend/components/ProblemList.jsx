import React from "react";
import { List, ListItemButton, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";

export default function ProblemList({problems}) {
    return (
        <List>
            {problems.map((problem) => (
                <ListItemButton component={Link} to={`/problems/${problem.problemId}`} key={problem.problemId}> 
                    <ListItemText primary={problem.title} />
                </ListItemButton>
            ))}
        </List>
    );
}
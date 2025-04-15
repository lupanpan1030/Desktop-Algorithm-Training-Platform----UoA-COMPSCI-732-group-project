import React, { useState, useEffect } from "react";
import ProblemContent from "../components/ProblemContent";
import Editor from "../components/Editor";
import Result from "../components/Result";
import { Grid, Container } from "@mui/material";
import { useParams } from "react-router-dom";

export default function DetailPage () {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProblem() {
            try {
                const response = await fetch(`http://localhost:6785/problems/${id}`);
                if (!response.ok) {
                    throw new Error('Problem not found');
                }
                const data = await response.json();
                setProblem(data);
            } catch (error) {
                console.error('Error fetching problem:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProblem();
    }, [id]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={2}>
                {/* Left half：Problem content */}
                <Grid item xs={6}>
                    {loading ? <p>Loading...</p> : problem ? <ProblemContent problem={problem} /> : <p>Problem does not exist.</p>}
                </Grid>

                {/* Right half：Code Editor and Running Result */}
                <Grid item xs={6} container direction="column" spacing={2}>
                    <Grid item>
                        <Editor />
                    </Grid>
                    <Grid item>
                        <Result />
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
}
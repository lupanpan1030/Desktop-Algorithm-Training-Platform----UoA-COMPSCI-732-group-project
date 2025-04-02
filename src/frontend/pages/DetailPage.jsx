import React from "react";
import ProblemContent from "../components/ProblemContent";
import Editor from "../components/Editor";
import Result from "../components/Result";
import { Grid, Container } from "@mui/material";
import allProblems from '../problems.json';
import { useParams } from "react-router-dom";

export default function DetailPage () {
    const { id } = useParams();
    const problem = allProblems.find((prob) => prob.id===parseInt(id));
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={2}>
                {/* 左半部分：题目内容 */}
                <Grid item xs={6}>
                    {problem ? <ProblemContent problem={problem} /> : <p>加载中...</p>}
                </Grid>

                {/* 右半部分：代码编辑器和执行结果 */}
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
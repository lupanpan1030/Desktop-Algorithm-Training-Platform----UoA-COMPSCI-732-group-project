import React, { useState, useEffect, useCallback } from "react";
import ProblemContent from "../components/ProblemContent";
import CodeEditor from "../components/Editor";
import Result from "../components/Result";
import { useParams } from "react-router-dom";
import { Paper, Box, Typography, CircularProgress } from "@mui/material";
import "../styles/DetailPage.css"; 
import CodeSubmission from "../components/Run&SubmitButton";

export default function DetailPage () {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorState, setEditorState] = useState({ code: '', language: 'python' });
    const [languageMap, setLanguageMap] = useState({});
    const [languages, setLanguages] = useState([]);

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

    // Get a list of supported programming languages and create a mapping
    useEffect(() => {
        async function fetchLanguages() {
            try {
                const response = await fetch('http://localhost:6785/language');
                if (response.ok) {
                    const data = await response.json();
                    setLanguages(data);
                    
                    // Creating Language Name to ID Mappings
                    const mapping = {};
                    data.forEach(lang => {
                        mapping[lang.name.toLowerCase()] = lang.language_id;
                    });
                    setLanguageMap(mapping);
                }
            } catch (error) {
                console.error('Error fetching languages:', error);
                // Use the default mapping as a fallback
                setLanguageMap({
                    'python': 1,
                    'javascript': 2,
                    'java': 3,
                    'c++': 4
                });
            }
        }
        fetchLanguages();
    }, []);

    const handleCodeChange = useCallback((newState) => {
        setEditorState(newState);
    }, []);

    // Get languageId
    const getLanguageId = () => {
        return languageMap[editorState.language.toLowerCase()] || 1; 
    };

    return (
        <div className="detail-page-container">
            <div className="detail-content">
                {/* Left half: Problem content */}
                <Paper className="problem-content" elevation={2}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ) : problem ? (
                        <ProblemContent problem={problem} />
                    ) : (
                        <Box sx={{ p: 3 }}>
                            <Typography>Problem not found or server connection error.</Typography>
                        </Box>
                    )}
                </Paper>

                {/* Right half: Code Editor and Running Result */}
                <div className="editor-result-container">
                    <Paper className="editor-section" elevation={2}>
                        <CodeEditor onCodeChange={handleCodeChange}
                        availableLanguages={languages}
                         />
                    </Paper>
                    <Paper className="result-section" elevation={2}>
                    {problem && (
                            <CodeSubmission 
                                problemId={id} 
                                code={editorState.code} 
                                languageId={getLanguageId()} 
                            />
                        )}
                   
                    </Paper>
                </div>
            </div>
        </div>
    );
}
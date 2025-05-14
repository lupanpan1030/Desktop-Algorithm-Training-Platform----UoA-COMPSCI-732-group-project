import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { marked } from 'marked';
import DOMPurify from '../utils/dompurifyConfig';

export default function ProblemContent({ problem }) {
    if (!problem) {
        return <Typography>No problem data available</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                {problem.title}
            </Typography>

            {problem.difficulty && (
                <Box
                    sx={{
                        my: 1,
                        display: 'inline-block',
                        px: 2,
                        py: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 25,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="subtitle2" display="inline">
                        Difficulty:
                    </Typography>
                    <Typography
                        variant="body2"
                        display="inline"
                        sx={{
                            ml: 1,
                            color: problem.difficulty.toLowerCase() === 'easy'
                                ? 'success.main'
                                : problem.difficulty.toLowerCase() === 'medium'
                                    ? 'warning.main'
                                    : 'error.main'
                        }}
                    >
                        {problem.difficulty}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />
            
            <Typography
              component="div"
              variant="body1"
              paragraph
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked(problem.description))
              }}
            />

            {problem.examples && problem.examples.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Examples
                    </Typography>
                    
                    {problem.examples.map((example, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Example {index + 1}:
                            </Typography>
                            {example.input && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2">Input:</Typography>
                                    <Typography 
                                        variant="body2" 
                                        component="pre" 
                                        sx={{ 
                                            p: 1, 
                                            bgcolor: 'action.hover',
                                            borderRadius: 1,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {example.input}
                                    </Typography>
                                </Box>
                            )}
                            {example.output && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2">Output:</Typography>
                                    <Typography 
                                        variant="body2" 
                                        component="pre" 
                                        sx={{ 
                                            p: 1, 
                                            bgcolor: 'action.hover',
                                            borderRadius: 1,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {example.output}
                                    </Typography>
                                </Box>
                            )}
                            {example.explanation && (
                                <Box>
                                    <Typography variant="subtitle2">Explanation:</Typography>
                                    <Typography variant="body2">
                                        {example.explanation}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            )}
            
            {problem.constraints && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Constraints
                    </Typography>
                    <ul>
                        {Array.isArray(problem.constraints) ? (
                            problem.constraints.map((constraint, index) => (
                                <li key={index}>
                                    <Typography variant="body2">{constraint}</Typography>
                                </li>
                            ))
                        ) : (
                            <Typography variant="body2">{problem.constraints}</Typography>
                        )}
                    </ul>
                </Box>
            )}
            
        </Box>
    );
}
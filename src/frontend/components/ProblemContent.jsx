import React from 'react';
import { Box, Typography, Divider, Stack, ToggleButton, ToggleButtonGroup, Chip, Paper } from '@mui/material';
import { marked } from 'marked';
import DOMPurify from '../utils/dompurifyConfig';

function formatLocaleLabel(locale) {
    if (locale === 'zh-CN') {
        return '中文';
    }

    return 'English';
}

export default function ProblemContent({ problem, onLocaleChange }) {
    if (!problem) {
        return <Typography>No problem data available</Typography>;
    }

    const starterCodeLanguages = [...new Set(
        (problem.starterCodes || []).map((starterCode) => starterCode.languageName)
    )];

    return (
        <Box sx={{ p: 2 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
            >
                <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                    {problem.title}
                </Typography>

                {problem.availableLocales?.length > 1 && (
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={problem.locale}
                        onChange={(_, nextLocale) => {
                            if (nextLocale && onLocaleChange) {
                                onLocaleChange(nextLocale);
                            }
                        }}
                    >
                        {problem.availableLocales.map((locale) => (
                            <ToggleButton key={locale} value={locale}>
                                {formatLocaleLabel(locale)}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                )}
            </Stack>

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

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip label={`${problem.source} / ${problem.locale}`} size="small" variant="outlined" />
                <Chip
                    label={problem.judgeReady ? 'Judge Ready' : 'Needs More Tests'}
                    size="small"
                    color={problem.judgeReady ? 'success' : 'default'}
                />
                <Chip label={`${problem.testcaseCount} testcases`} size="small" variant="outlined" />
                <Chip
                    label={`${problem.sampleCaseCount} sample / ${problem.hiddenCaseCount} hidden`}
                    size="small"
                    variant="outlined"
                />
                {problem.externalProblemId && (
                    <Chip label={`External ${problem.externalProblemId}`} size="small" variant="outlined" />
                )}
                {problem.sourceSlug && (
                    <Chip label={problem.sourceSlug} size="small" variant="outlined" />
                )}
            </Stack>

            {problem.tags?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Tags
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {problem.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                        ))}
                    </Stack>
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

            {problem.sampleTestcase && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Imported Sample Testcase Reference
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                                m: 0,
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {problem.sampleTestcase}
                        </Typography>
                    </Paper>
                </Box>
            )}

            {starterCodeLanguages.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Starter Code Available
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {starterCodeLanguages.map((languageName) => (
                            <Chip key={languageName} label={languageName} size="small" variant="outlined" />
                        ))}
                    </Stack>
                </Box>
            )}

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

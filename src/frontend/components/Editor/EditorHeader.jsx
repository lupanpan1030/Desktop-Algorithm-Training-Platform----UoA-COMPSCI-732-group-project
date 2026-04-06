import React from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LanguageSelector from './LanguageSelector';

export default function EditorHeader({ 
    language, 
    languages, 
    handleLanguageChange,
    onResetToStarter,
    canResetToStarter,
    loading,
    error
}) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexWrap: 'wrap',
                rowGap: 1.15,
                columnGap: 1,
                mb: 1.25,
                pb: 1.1,
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.42),
            }}
        >
            <Box>
                <Typography
                    variant="overline"
                    sx={{ color: 'text.secondary', letterSpacing: 0.72, display: 'block', lineHeight: 1.2 }}
                >
                    Solve Surface
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1.08 }}>
                    Code Editor
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onResetToStarter}
                    disabled={!canResetToStarter}
                    sx={{ borderRadius: 999, px: 1.4, textTransform: 'none' }}
                >
                    Reset to Starter
                </Button>
                {loading && <CircularProgress size={20} />}
                {error && (
                    <Typography variant="caption" color="error">
                        Failed to load languages
                    </Typography>
                )}
                <LanguageSelector
                    language={language}
                    languages={languages}
                    handleLanguageChange={handleLanguageChange}
                />
            </Box>
        </Box>
    );
} 

import React from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
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
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, columnGap : 1 }}>
            <Typography variant="h6">Code Editor</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onResetToStarter}
                    disabled={!canResetToStarter}
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

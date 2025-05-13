import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import LanguageSelector from './LanguageSelector';

export default function EditorHeader({ 
    language, 
    languages, 
    handleLanguageChange,
    loading,
    error
}) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Code Editor</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
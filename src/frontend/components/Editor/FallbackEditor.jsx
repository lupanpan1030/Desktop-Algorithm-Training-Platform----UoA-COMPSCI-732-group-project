import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { normalizeStarterLanguageKey } from '../../utils/starterCode';

export default function FallbackEditor({ 
    code, 
    language, 
    languages, 
    handleEditorChange, 
    handleLanguageChange, 
    onResetToStarter,
    canResetToStarter,
    monacoError 
}) {
    const navigate = useNavigate();
    const theme = useTheme();
    const handleAddLanguage = () => {
        navigate('/languages');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    flexWrap: 'wrap',
                    gap: 1.1,
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onResetToStarter}
                        disabled={!canResetToStarter}
                        sx={{ borderRadius: 999, px: 1.4, textTransform: 'none' }}
                    >
                        Reset to Starter
                    </Button>
                    <FormControl size="small">
                        <InputLabel>Language</InputLabel>
                        <Select
                            value={language}
                            label="Language"
                            onChange={handleLanguageChange}
                            sx={{ minWidth: 150 }}
                        >
                            {languages.map((lang) => (
                                <MenuItem
                                    key={lang.language_id ?? lang.languageId}
                                    value={normalizeStarterLanguageKey(lang.name) || lang.name.toLowerCase()}
                                >
                                    {lang.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Tooltip title="Add new language">
                        <IconButton size="small" onClick={handleAddLanguage}>
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box
                sx={{
                    p: 1.2,
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.46 : 0.7),
                    borderRadius: 3,
                    bgcolor: alpha(
                        theme.palette.background.default,
                        theme.palette.mode === 'dark' ? 0.74 : 0.88
                    ),
                }}
            >
                <Typography color="error" variant="subtitle2" sx={{ mb: 1 }}>
                    Monaco Editor could not be loaded. Using basic editor instead.
                </Typography>
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    Error: {monacoError?.message || 'Unknown error'}
                </Typography>
                <textarea
                    value={code}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    style={{
                        width: '100%',
                        height: 'calc(100% - 30px)',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        resize: 'none',
                        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#faf6ea',
                        color: theme.palette.mode === 'dark' ? '#d4d4d4' : '#18212f'
                    }}
                    placeholder={`Write your ${language} code here...`}
                />
            </Box>
        </Box>
    );
} 

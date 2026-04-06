import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Button } from '@mui/material';
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
    const handleAddLanguage = () => {
        navigate('/languages');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Code Editor</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onResetToStarter}
                        disabled={!canResetToStarter}
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

            <Box sx={{ p: 2, flex: 1, overflow: 'hidden' }}>
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
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4'
                    }}
                    placeholder={`Write your ${language} code here...`}
                />
            </Box>
        </Box>
    );
} 

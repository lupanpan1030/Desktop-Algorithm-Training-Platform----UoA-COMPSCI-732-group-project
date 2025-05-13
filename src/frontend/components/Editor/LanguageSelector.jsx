import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

export default function LanguageSelector({ 
    language, 
    languages, 
    handleLanguageChange 
}) {
    const navigate = useNavigate();
    const handleAddLanguage = () => {
        navigate('/languages');
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small">
                <InputLabel>Language</InputLabel>
                <Select
                    value={language}
                    label="Language"
                    onChange={handleLanguageChange}
                    sx={{ minWidth: 150 }}
                >
                    {languages.map((lang) => (
                        <MenuItem key={lang.language_id ?? lang.languageId} value={lang.name.toLowerCase()}>
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
    );
} 
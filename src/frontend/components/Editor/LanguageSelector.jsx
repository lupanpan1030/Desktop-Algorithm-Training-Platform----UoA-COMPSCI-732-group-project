import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';


export default function LanguageSelector({ 
    language, 
    languages, 
    handleLanguageChange 
}) {
    
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

        </Box>
    );
} 
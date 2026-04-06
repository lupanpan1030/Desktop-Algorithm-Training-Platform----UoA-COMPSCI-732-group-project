import React from 'react';
import { Box, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import { alpha, useTheme } from "@mui/material/styles";

// Some default settings for the editor
const editorOptions = {
    fontSize: 14,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: true,
};

export default function MonacoConfig({
    language,
    code,
    handleEditorChange,
    handleEditorDidMount,
    handleEditorWillMount
}) {
    const muiTheme = useTheme(); 
    return (
        <Box sx={{ 
            flex: 1, 
            minHeight: 0,
            overflow: 'hidden', 
            border: '1px solid',
            borderColor: alpha(muiTheme.palette.divider, muiTheme.palette.mode === 'dark' ? 0.46 : 0.7),
            borderRadius: 3,
            position: 'relative',
            bgcolor: alpha(
                muiTheme.palette.background.default,
                muiTheme.palette.mode === 'dark' ? 0.74 : 0.88
            ),
            boxShadow: `inset 0 1px 0 ${alpha(
                muiTheme.palette.common.white,
                muiTheme.palette.mode === 'dark' ? 0.04 : 0.68
            )}`
        }}>
            <Editor
                height="100%"
                defaultLanguage="python"
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                beforeMount={handleEditorWillMount}
                onValidate={() => {}} // Avoid validation errors
                theme={muiTheme.palette.mode === 'dark' ? 'customDark' : 'customLight'}
                loading={
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%',
                        flexDirection: 'column'
                    }}>
                        <Typography sx={{ mb: 1 }}>Loading editor...</Typography>
                        <Typography variant="caption" color="text.secondary">
                            (First load may take a moment)
                        </Typography>
                    </Box>
                }
                options={editorOptions}
            />
        </Box>
    );
} 

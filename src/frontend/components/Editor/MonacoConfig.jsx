import React from 'react';
import { Box, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';

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
    return (
        <Box sx={{ 
            flex: 1, 
            overflow: 'hidden', 
            border: '1px solid rgba(0, 0, 0, 0.12)', 
            borderRadius: 1,
            position: 'relative'
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
                theme="vs-dark"
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
import { loader } from '@monaco-editor/react';

const isPackaged = window.location.protocol === 'file:';
loader.config({
  paths: { vs: isPackaged ? '../vs' : '/vs' }
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';

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

// 统一语言映射
const monacoLanguageMap = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  'c++': 'cpp',
  cpp: 'cpp',
};

export default function CodeEditor({ onCodeChange }) {
    const editorRef = useRef(null);
    const [code, setCode] = useState('');
    // 统一内部语言变量为小写（如'python','c++','java','javascript','cpp'）
    const [language, setLanguage] = useState('python');
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [monacoError, setMonacoError] = useState(null);
    // Default language list works as backup when backend is unavailable
    const [languages, setLanguages] = useState([
        { language_id: 1, name: 'Python' },
        { language_id: 2, name: 'JavaScript' },
        { language_id: 3, name: 'Java' },
        { language_id: 4, name: 'C++' }
    ]);
    

    // Fetch language list from backend
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await fetch('http://localhost:6785/languages');
                if (response.ok) {
                    const data = await response.json();
                    setLanguages(data);
                }
            } catch (error) {
                console.error('Error fetching languages:', error);
                // Use default language list to avoid errors 
            }
        };
        fetchLanguages();
    }, []);

    // Additional loading timeout detection
    useEffect(() => {      
      console.log('Monaco编辑器加载中...');
      const timeoutId = setTimeout(() => {
        if (!isEditorReady) {
          console.warn('Monaco编辑器加载超时 - 切换到fallback编辑器');
          setMonacoError(new Error('加载超时 - Monaco编辑器资源无法加载'));
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }, [isEditorReady, isPackaged]);

    // Listen for global errors and capture Monaco-related errors
    useEffect(() => {
        const handleGlobalError = (event) => {
            console.log('Checking error:', event.message || 'Unknown error');
            if (
                event.message && 
                (event.message.includes('Monaco') || 
                 event.message.includes('monaco') ||
                 event.filename?.includes('monaco') ||
                 event.error?.stack?.includes('monaco'))
            ) {
                console.error('Monaco related error detected:', event);
                setMonacoError(new Error(event.message || 'Monaco initialization error'));
            }
        };

        window.addEventListener('error', handleGlobalError);
        return () => window.removeEventListener('error', handleGlobalError);
    }, []);

    // Use useCallback to memoize the function 
    const handleEditorChange = useCallback((value) => {
        setCode(value || '');
    }, []);

    // 统一下拉菜单、Monaco、父组件onCodeChange的language
    const handleLanguageChange = useCallback((event) => {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        
        // Immediately notify parent component of language change
        if (onCodeChange) {
            onCodeChange({ code, language: newLanguage });
        }
    }, [code, onCodeChange]);

    // Handle editor mount successfully
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        setIsEditorReady(true);
        setMonacoError(null);
        
    }, []);

    // Handle editor mount error
    const handleEditorWillMount = useCallback((monaco) => {
        try {
    
            // 👇 The logic of original theme setting remains
            monaco.editor.defineTheme('customTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#1e1e1e',
                }
            });
        } catch (error) {
            console.error('Monaco configuration error:', error);
            setMonacoError(error);
        }
    }, []);
    

    // Handle editor loading error
    const handleEditorError = useCallback((error) => {
        console.error('Monaco editor loading error:', error);
        setMonacoError(error);
    }, []);

    // When code changes, notify the parent component. Use useEffect to avoid circular updates
    useEffect(() => {
        if (onCodeChange) {
            onCodeChange({ code, language });
        }
    }, [code, language, onCodeChange]);

    // Set focus on editor when it is ready
    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            setTimeout(() => {
                editorRef.current.focus();
            }, 100);
        }
    }, [isEditorReady]);

    // If there's a Monaco error or it hasn't loaded after 8 seconds, use the fallback editor
    if (monacoError) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Code Editor</Typography>
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Code Editor</Typography>
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
            </Box>

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
                    language={monacoLanguageMap[language] || 'plaintext'}
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
        </Box>
    );
}
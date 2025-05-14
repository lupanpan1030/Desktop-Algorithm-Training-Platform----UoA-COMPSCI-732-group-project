import { loader } from '@monaco-editor/react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import FallbackEditor from './FallbackEditor';
import EditorHeader from './EditorHeader';
import MonacoConfig from './MonacoConfig';
import useApi from '../../hooks/useApi';

const isPackaged = window.location.protocol === 'file:';
loader.config({
  paths: { vs: isPackaged ? '../vs' : '/vs' }
});

// Unified language mapping
const monacoLanguageMap = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  'c++': 'cpp',
  cpp: 'cpp',
  rust: 'rust',
  'c#': 'csharp',
  csharp: 'csharp',
  go: 'go',
  ruby: 'ruby',
  swift: 'swift',
};

export default function CodeEditor({ onCodeChange, problemId }) {
    const editorRef = useRef(null);
    const { getLanguages, loading: languagesLoading, error: languagesError } = useApi();
    const [code, setCode] = useState(() => {
        const savedCode = localStorage.getItem(`editorCode_${problemId}`);
        return savedCode || '';
    });
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem(`editorLanguage_${problemId}`);
        return savedLanguage || 'python';
    });
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [monacoError, setMonacoError] = useState(null);
    const [languages, setLanguages] = useState([
        { language_id: 1, name: 'Python' },
        { language_id: 2, name: 'JavaScript' },
        { language_id: 3, name: 'Java' },
        { language_id: 4, name: 'C++' }
    ]);

    // Fetch language list from backend using useApi
    useEffect(() => {
        const fetchLanguages = async () => {
            const data = await getLanguages();
            if (data) {
                setLanguages(data);
            }
        };
        fetchLanguages();
    }, [getLanguages]);

    // Additional loading timeout detection
    useEffect(() => {      
        console.log('Monaco Editor loading...');
        const timeoutId = setTimeout(() => {
            if (!isEditorReady) {
                console.warn('Monaco Editor loading timeout - switching to fallback editor');
                setMonacoError(new Error('Loading timeout - Monaco Editor resources cannot be loaded'));
            }
        }, 10000);
        
        return () => clearTimeout(timeoutId);
    }, [isEditorReady, isPackaged]);

    // Listen for global errors and capture Monaco-related errors
    useEffect(() => {
        const handleGlobalError = (event) => {
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

    const handleEditorChange = useCallback((value) => {
        const newCode = value || '';
        setCode(newCode);
        localStorage.setItem(`editorCode_${problemId}`, newCode);
    }, [problemId]);

    const handleLanguageChange = useCallback((event) => {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        localStorage.setItem(`editorLanguage_${problemId}`, newLanguage);
        if (onCodeChange) {
            onCodeChange({ code, language: newLanguage });
        }
    }, [code, onCodeChange, problemId]);

    // When problemId changes, clear the cache of other problems
    useEffect(() => {
        const keys = Object.keys(localStorage);
        const editorKeys = keys.filter(key => 
            (key.startsWith('editorCode_') || key.startsWith('editorLanguage_')) && 
            !key.endsWith(`_${problemId}`)
        );
        editorKeys.forEach(key => localStorage.removeItem(key));
    }, [problemId]);

    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        setIsEditorReady(true);
        setMonacoError(null);
    }, []);
    const handleEditorWillMount = useCallback((monaco) => {
        try {
            monaco.editor.defineTheme('customLight', {
                base: 'vs',
                inherit: true,
                rules: [],
                colors: { 'editor.background': '#f5f2e3' },
            });
            monaco.editor.defineTheme('customDark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: { 'editor.background': '#303030' },
            });
        } catch (error) {
            console.error('Monaco configuration error:', error);
            setMonacoError(error);
        }
    }, []);

    // When code changes, notify the parent component
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

    if (monacoError) {
        return (
            <FallbackEditor
                code={code}
                language={language}
                languages={languages}
                handleEditorChange={handleEditorChange}
                handleLanguageChange={handleLanguageChange}
                monacoError={monacoError}
            />
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <EditorHeader
                language={language}
                languages={languages}
                handleLanguageChange={handleLanguageChange}
                loading={languagesLoading}
                error={languagesError}
            />
            <MonacoConfig
                language={monacoLanguageMap[language] || 'plaintext'}
                code={code}
                handleEditorChange={handleEditorChange}
                handleEditorDidMount={handleEditorDidMount}
                handleEditorWillMount={handleEditorWillMount}
            />
        </Box>
    );
}
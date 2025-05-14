import { loader } from '@monaco-editor/react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import FallbackEditor from './FallbackEditor';
import EditorHeader from './EditorHeader';
import MonacoConfig from './MonacoConfig';
import useApi from '../../hooks/useApi';
import { saveCodeToLocalStorage, getCodeFromLocalStorage } from '../../utils/localStorageHelper';


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
    const [languageMap, setLanguageMap] = useState({});
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
                
                // Create language mapping for localStorage
                const mapping = {};
                data.forEach(lang => {
                    const key = lang.name.toLowerCase();
                    mapping[key] = lang.languageId;
                    // Handle C++ / CPP mapping
                    if (key === 'c++') mapping['cpp'] = lang.languageId;
                });
                setLanguageMap(mapping);
            }
        };
        fetchLanguages();
    }, [getLanguages]);

    // Load saved code when component mounts or problem/language changes
    useEffect(() => {
        // Only try to load code once we have the language map
        if (Object.keys(languageMap).length > 0) {
            const savedLanguage = localStorage.getItem(`editorLanguage_${problemId}`) || 'python';
            setLanguage(savedLanguage);
            
            const savedCode = getCodeFromLocalStorage(problemId, savedLanguage, languageMap);
            setCode(savedCode);
        }
    }, [problemId, languageMap]);

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
        // Save code to localStorage using helper function
        if (Object.keys(languageMap).length > 0) {
            saveCodeToLocalStorage(problemId, language, newCode, languageMap);
        }
    }, [problemId, language, languageMap]);

    const handleLanguageChange = useCallback((event) => {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        localStorage.setItem(`editorLanguage_${problemId}`, newLanguage);
        // Load saved code for the new language
        let savedCode = '';
        if (Object.keys(languageMap).length > 0) {
            savedCode = getCodeFromLocalStorage(problemId, newLanguage, languageMap);
            setCode(savedCode);
        }
        if (onCodeChange) {
            onCodeChange({ code: savedCode, language: newLanguage });
        }
    }, [code, onCodeChange, problemId, languageMap]);

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

    // Save code on any button click throughout the application
    useEffect(() => {
        const handleButtonClick = () => {
            if (Object.keys(languageMap).length > 0) {
                saveCodeToLocalStorage(problemId, language, code, languageMap);
            }
        };

        // Add listener to all buttons in the document
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', handleButtonClick);
        });

        return () => {
            // Clean up listeners when component unmounts
            buttons.forEach(button => {
                button.removeEventListener('click', handleButtonClick);
            });
        };
    }, [problemId, language, code, languageMap]);

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
import { loader } from '@monaco-editor/react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import FallbackEditor from './FallbackEditor';
import EditorHeader from './EditorHeader';
import MonacoConfig from './MonacoConfig';
import useApi from '../../hooks/useApi';
import {
    getCodeDraftFromLocalStorage,
    getEditorLanguagePreference,
    saveCodeToLocalStorage,
    saveEditorLanguagePreference,
} from '../../utils/localStorageHelper';
import {
    getStarterCodeForLanguage,
    normalizeStarterLanguageKey,
} from '../../utils/starterCode';


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

export default function CodeEditor({
    onCodeChange,
    problemId,
    loadedDraft,
    starterCodes = [],
}) {
    const editorRef = useRef(null);
    const hasUserInteractedRef = useRef(false);
    const lastAppliedDraftRef = useRef(null);
    const pendingHydrationLanguageRef = useRef(null);
    const { getLanguages, loading: languagesLoading, error: languagesError } = useApi();
    const [code, setCode] = useState(() => {
        const savedLanguage = getEditorLanguagePreference(problemId) || 'python';
        const draft = getCodeDraftFromLocalStorage(problemId, savedLanguage);
        return draft.exists ? draft.code : '';
    });
    const [language, setLanguage] = useState(() => {
        const savedLanguage = getEditorLanguagePreference(problemId);
        return normalizeStarterLanguageKey(savedLanguage || 'python') || 'python';
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
    const resolveStarterCode = useCallback((nextLanguage) => {
        return getStarterCodeForLanguage(nextLanguage, starterCodes);
    }, [starterCodes]);

    const persistCode = useCallback((nextLanguage, nextCode) => {
        saveCodeToLocalStorage(problemId, nextLanguage, nextCode, languageMap);
    }, [languageMap, problemId]);

    // Fetch language list from backend using useApi
    useEffect(() => {
        const fetchLanguages = async () => {
            const data = await getLanguages();
            if (data == null) {
                return;
            }

            setLanguages(data);
            
            // Create language mapping for localStorage
            const mapping = {};
            data.forEach(lang => {
                const key = lang.name.toLowerCase();
                mapping[key] = lang.languageId;
                const normalizedKey = normalizeStarterLanguageKey(lang.name);
                if (normalizedKey) {
                    mapping[normalizedKey] = lang.languageId;
                }
            });
            setLanguageMap(mapping);
        };
        fetchLanguages();
    }, [getLanguages]);

    // Reset editor state when the problem changes.
    useEffect(() => {
        const savedLanguage =
            normalizeStarterLanguageKey(getEditorLanguagePreference(problemId) || 'python') ||
            'python';
        const draft = getCodeDraftFromLocalStorage(problemId, savedLanguage);

        hasUserInteractedRef.current = false;
        pendingHydrationLanguageRef.current = savedLanguage;
        lastAppliedDraftRef.current = null;

        setLanguage(savedLanguage);
        setCode(draft.exists ? draft.code : '');
    }, [problemId]);

    // Hydrate starter code or migrate older drafts without overwriting active edits.
    useEffect(() => {
        if (pendingHydrationLanguageRef.current && language !== pendingHydrationLanguageRef.current) {
            return;
        }

        if (hasUserInteractedRef.current) {
            return;
        }

        const draft = getCodeDraftFromLocalStorage(problemId, language, languageMap);
        const starterCode = draft.exists ? '' : resolveStarterCode(language);
        const nextCode = draft.exists ? draft.code : starterCode || '';

        if (nextCode !== code) {
            setCode(nextCode);
        }

        if (!draft.exists && starterCode) {
            persistCode(language, starterCode);
        }

        pendingHydrationLanguageRef.current = null;
    }, [code, language, languageMap, persistCode, problemId, resolveStarterCode]);

    useEffect(() => {
        if (!loadedDraft?.revision) {
            return;
        }

        if (lastAppliedDraftRef.current === loadedDraft.revision) {
            return;
        }

        const nextLanguage = normalizeStarterLanguageKey(loadedDraft.language || 'python') || 'python';
        const nextCode = loadedDraft.code || '';

        hasUserInteractedRef.current = true;
        pendingHydrationLanguageRef.current = null;
        setLanguage(nextLanguage);
        setCode(nextCode);
        persistCode(nextLanguage, nextCode);
        lastAppliedDraftRef.current = loadedDraft.revision;

        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, [loadedDraft, persistCode]);

    // Additional loading timeout detection
    useEffect(() => {      
        const timeoutId = setTimeout(() => {
            if (!isEditorReady) {
                console.warn('Monaco Editor loading timeout - switching to fallback editor');
                setMonacoError(new Error('Loading timeout - Monaco Editor resources cannot be loaded'));
            }
        }, 10000);
        
        return () => clearTimeout(timeoutId);
    }, [isEditorReady]);

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
        hasUserInteractedRef.current = true;
        setCode(newCode);
        saveCodeToLocalStorage(problemId, language, newCode, languageMap);
    }, [problemId, language, languageMap]);

    const handleLanguageChange = useCallback((event) => {
        const newLanguage = normalizeStarterLanguageKey(event.target.value) || 'python';
        hasUserInteractedRef.current = false;
        pendingHydrationLanguageRef.current = newLanguage;
        setLanguage(newLanguage);
        saveEditorLanguagePreference(problemId, newLanguage);
        // Load saved code for the new language
        const draft = getCodeDraftFromLocalStorage(problemId, newLanguage, languageMap);
        const starterCode = draft.exists ? '' : resolveStarterCode(newLanguage);
        const nextCode = draft.exists ? draft.code : starterCode || '';
        setCode(nextCode);
        if (!draft.exists && starterCode) {
            persistCode(newLanguage, starterCode);
        }
        if (onCodeChange) {
            onCodeChange({ code: nextCode, language: newLanguage });
        }
    }, [languageMap, onCodeChange, persistCode, problemId, resolveStarterCode]);

    const handleResetToStarter = useCallback(() => {
        const starterCode = resolveStarterCode(language);
        if (!starterCode) {
            return;
        }

        hasUserInteractedRef.current = true;
        setCode(starterCode);
        persistCode(language, starterCode);

        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, [language, persistCode, resolveStarterCode]);

    const handleEditorDidMount = useCallback((editor, _monaco) => {
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
                onResetToStarter={handleResetToStarter}
                canResetToStarter={Boolean(resolveStarterCode(language))}
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
                onResetToStarter={handleResetToStarter}
                canResetToStarter={Boolean(resolveStarterCode(language))}
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

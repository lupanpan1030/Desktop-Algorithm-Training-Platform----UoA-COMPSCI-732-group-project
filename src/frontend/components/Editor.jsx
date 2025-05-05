import { loader } from '@monaco-editor/react';
loader.config({ paths: { vs: '/vs' } });

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

// 一些编辑器默认设置
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

export default function CodeEditor({ onCodeChange }) {
    const editorRef = useRef(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [monacoError, setMonacoError] = useState(null);
    // 默认语言列表，在无法连接后端时作为备用
    const [languages, setLanguages] = useState([
        { language_id: 1, name: 'Python' },
        { language_id: 2, name: 'JavaScript' },
        { language_id: 3, name: 'Java' },
        { language_id: 4, name: 'C++' }
    ]);
    const navigate = useNavigate();
    const handleAddLanguage = () => {
  navigate('/languages');   // 跳转到 Language 管理页面
};

    

    // 获取支持的编程语言列表
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
                // 使用默认语言列表，不显示错误
            }
        };
        fetchLanguages();
    }, []);

    // 添加加载超时检测
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!isEditorReady) {
                console.warn('Monaco editor loading timeout - switching to fallback editor');
                setMonacoError(new Error('Loading timeout'));
            }
        }, 8000); // 8秒后超时
        
        return () => clearTimeout(timeoutId);
    }, [isEditorReady]);

    // 监听全局错误，捕获Monaco相关错误
    useEffect(() => {
        const handleGlobalError = (event) => {
            if (
                event.message && 
                (event.message.includes('Monaco') || 
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

    // 使用useCallback包装，确保函数引用稳定
    const handleEditorChange = useCallback((value) => {
        setCode(value || '');
    }, []);

    const handleLanguageChange = useCallback((event) => {
        setLanguage(event.target.value);
    }, []);

    // 处理编辑器成功挂载
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        setIsEditorReady(true);
        setMonacoError(null);
        // 可以在这里添加更多编辑器初始化逻辑
    }, []);

    // 处理编辑器加载错误
    const handleEditorWillMount = useCallback((monaco) => {
        try {
    
            // 👇 你的原主题设置逻辑继续保留
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
    

    // 处理加载错误
    const handleEditorError = useCallback((error) => {
        console.error('Monaco editor loading error:', error);
        setMonacoError(error);
    }, []);

    // 当代码或语言改变时，通知父组件 - 使用useEffect避免循环更新
    useEffect(() => {
        if (onCodeChange) {
            onCodeChange({ code, language });
        }
    }, [code, language, onCodeChange]);

    // 当编辑器引用存在时，设置焦点
    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            setTimeout(() => {
                editorRef.current.focus();
            }, 100);
        }
    }, [isEditorReady]);

    // 如果有Monaco错误或者8秒后还未加载完成，直接使用备用编辑器
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

                  <Tooltip title="Add new language">
                    <IconButton size="small" onClick={handleAddLanguage}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                    language={language}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    beforeMount={handleEditorWillMount}
                    onValidate={() => {}} // 防止验证错误
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
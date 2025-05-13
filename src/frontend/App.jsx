import React from 'react';
import { useState, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import NavBar from './components/common/NavBar';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import { useAppTheme } from './theme';
import LanguageAdmin from "./pages/LanguageAdmin.tsx";
import './styles/global.css';

function App() {
    // Read state of Dark Mode from localStorage and set it to darkMode
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem("darkMode");
        return stored === null ? true : stored === "true"; 
    });

    // Clear editor cache when app starts
    useEffect(() => {
        // 获取所有 localStorage 的 key
        const keys = Object.keys(localStorage);
        // 找出所有 editorCode_ 和 editorLanguage_ 开头的 key
        const editorKeys = keys.filter(key => 
            key.startsWith('editorCode_') || key.startsWith('editorLanguage_')
        );
        // 删除这些 key
        editorKeys.forEach(key => localStorage.removeItem(key));
    }, []);
    
    // Listen to the change of darkMode，and store into localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    // theme
    const theme = useAppTheme(darkMode);

    return (
        <HashRouter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100vh', 
                    width: '100vw',
                    overflow: 'hidden'
                }}>
                    <NavBar darkMode={darkMode} setDarkMode={setDarkMode}/>
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        overflow: 'hidden'
                    }}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/problems/:id" element={<DetailPage />} />
                            <Route path="/languages" element={<LanguageAdmin />} />
                        </Routes>
                    </div>
                </div>
            </ThemeProvider>
        </HashRouter>
    );
}

export default App;
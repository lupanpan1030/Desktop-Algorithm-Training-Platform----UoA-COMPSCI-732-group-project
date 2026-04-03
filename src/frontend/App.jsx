import React from 'react';
import { useState, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from "@mui/material";
import NavBar from './components/common/NavBar';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import { useAppTheme } from './theme';
import LanguageAdmin from "./pages/LanguageAdmin.tsx";
import ProblemAdmin from "./pages/ProblemAdmin.tsx";
import { ProblemLocaleProvider } from "./problem-locale";
import { GlobalAiAssistantProvider } from "./ai/GlobalAiAssistantProvider";
import GlobalAiAssistantShell from "./components/ai/GlobalAiAssistantShell";
import './styles/global.css';

function App() {
    // Read state of Dark Mode from localStorage and set it to darkMode
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem("darkMode");
        return stored === null ? true : stored === "true"; 
    });

    // Listen to the change of darkMode，and store into localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", String(darkMode));
    }, [darkMode]);

    // theme
    const theme = useAppTheme(darkMode);

    return (
        <ProblemLocaleProvider>
            <HashRouter>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <GlobalAiAssistantProvider>
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
                                    <Route path="/" element={<ListPage />} />
                                    <Route path="/problems/:id" element={<DetailPage />} />
                                    <Route path="/admin/problems" element={<ProblemAdmin />} />
                                    <Route path="/languages" element={<LanguageAdmin />} />
                                </Routes>
                            </div>
                        </div>
                        <GlobalAiAssistantShell />
                    </GlobalAiAssistantProvider>
                </ThemeProvider>
            </HashRouter>
        </ProblemLocaleProvider>
    );
}

export default App;

import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import NavBar from './components/common/NavBar';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import { useAppTheme } from './theme';
import './styles/global.css';

function App() {
    // Read state of Dark Mode from localStorage and set it to darkMode
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    // Listen to the change of darkMode，and store into localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    // theme
    const theme = useAppTheme(darkMode);

    return (
        <BrowserRouter basename="/main_window">
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
                        </Routes>
                    </div>
                </div>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
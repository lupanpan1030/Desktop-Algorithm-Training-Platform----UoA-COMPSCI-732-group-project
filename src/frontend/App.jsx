import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import NavBar from './components/common/NavBar';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import { useAppTheme } from './theme';
import CodeSubmit from './components/Run&SubmitButton'

function App() {
    // 从 localStorage 读取 Dark Mode 设置
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    // 监听 darkMode 变化，存入 localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    // 主题
    const theme = useAppTheme(darkMode);

    return (
        <BrowserRouter basename="/main_window">
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <NavBar darkMode={darkMode} setDarkMode={setDarkMode}/>
                <Container>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/problems/:id" element={<DetailPage />} />
                        
                    </Routes>
                <CodeSubmit/>
                </Container>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
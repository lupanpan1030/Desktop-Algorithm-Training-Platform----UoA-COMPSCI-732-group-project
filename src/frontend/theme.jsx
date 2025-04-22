import { createTheme } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
    return useMemo(() => {
        return createTheme({
            palette: {
                mode: darkMode ? "dark" : "light",
                background: {
                    default: darkMode ? "#121212" : "#ffffff",
                    paper: darkMode ? "#1e1e1e" : "#f5f5f5",
                },
            },
            components: {
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            background: darkMode ? "#1e1e1e" : "#f5f5f5",
                        },
                    },
                },
            },
        });
    }, [darkMode]);
}
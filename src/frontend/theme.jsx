import { createTheme } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
    return useMemo(() => {
        return createTheme({
            palette: {
                mode: darkMode ? "dark" : "light",
                background: {
                    default: darkMode ? "#121212" :"#fff3e0", 
                    paper: darkMode ? "#1e1e1e" : "#f5ebdd",   
                },
                primary: {
                    main: darkMode ? "#lelele" : "#f5ebdd",    
                },
            },
            components: {
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            background: darkMode ? "#1e1e1e" : "#f5ebdd",
                        },
                    },
                },
            },
        });
    }, [darkMode]);
}
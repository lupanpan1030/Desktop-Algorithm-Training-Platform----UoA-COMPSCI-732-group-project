import { createTheme } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
    return useMemo(() => {
        return createTheme({
            palette: {
                mode: darkMode ? "dark" : "light",
            },
        });
    }, [darkMode]);
}
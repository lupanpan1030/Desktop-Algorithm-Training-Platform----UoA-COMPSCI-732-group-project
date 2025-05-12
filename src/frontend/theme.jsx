import { createTheme, alpha } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
  return useMemo(() => {
    const stripeAlpha = darkMode ? 0.3 : 0.02;
    const hoverAlpha = darkMode ? 0.15 : 0.06;

    return createTheme({
      palette: {
        mode: darkMode ? "dark" : "light",
        background: {
          default: darkMode ? "#121212" : "#fff3e0",
          paper: darkMode ? "#1e1e1e" : "#f5ebdd",
        },
        primary: {
          main: darkMode ? "#fff" : "rgba(0, 0, 0, 0.80)",
        },
        action: {
          rowStripe: alpha("#000", stripeAlpha),
          rowHover: alpha("#000", hoverAlpha),
        },
      },
      components: {
        MuiAppBar: {
          defaultProps: {
            elevation: darkMode ? 0 : 4,
          },
          styleOverrides: {
            root: ({ theme }) => ({
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.primary.main,
            }),
          },
        },
        MuiPaper: {
          defaultProps: {
            elevation: 0,
          },
        },
      },
    });
  }, [darkMode]);
}

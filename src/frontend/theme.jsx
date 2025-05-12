import { createTheme, alpha, responsiveFontSizes } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
  return useMemo(() => {
    const stripeAlpha = darkMode ? 0.3 : 0.02;
    const hoverAlpha = darkMode ? 0.15 : 0.06;

    let theme = createTheme({
      breakpoints: {
        values: {
          xs: 0,
          sm: 700,
        },
      },
      palette: {
        mode: darkMode ? "dark" : "light",
        background: {
          default: darkMode ? "#121212" : "#fff3e0", // dark black : light sandy yellow
          paper: darkMode ? "#1e1e1e" : "#f5ebdd", // lighter balck : sandy yellow
        },
        primary: {
          main: darkMode ? "#454545" : "#d0d0d0", // grey
        },
        secondary: {
          main: darkMode ? "#4c8164" : "#a8c1b3", // green
        },
        action: {
          rowStripe: alpha("#000", stripeAlpha),
          rowHover: alpha("#000", hoverAlpha),
        },
      },
      components: {
        // written in alphabetical order
        MuiAppBar: {
          defaultProps: {
            elevation: darkMode ? 1 : 4,
          },
          styleOverrides: {
            root: ({ theme }) => ({
              backgroundColor: theme.palette.background.paper, // default is primary.main
              color: theme.palette.text.primary, //default is primary.contrastText
            }),
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: ({ theme }) => ({
              "&.Mui-focused": {
                color: theme.palette.text.primary, //default is primary.main
              },
            }),
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: ({ theme }) => ({
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: "1.5px", // make it slightly thinner than default
                borderColor: theme.palette.text.secondary, //default is primary.main
              },
            }),
          },
        },
        MuiPaper: {
          defaultProps: {
            elevation: darkMode ? 1 : 0,
          },
        },
        MuiSvgIcon: {
          styleOverrides: {
            root: ({ theme }) => ({
              fontSize: theme.typography.pxToRem(20), // ≈1.25rem
              [theme.breakpoints.up("sm")]: {
                fontSize: theme.typography.pxToRem(24), // ≈1.5rem
              },
            }),
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: ({ theme }) => ({
              fontSize: theme.typography.pxToRem(12),
              [theme.breakpoints.up("sm")]: {
                fontSize: theme.typography.pxToRem(15),
              },
            }),
          },
        },
      },
      typography: {
        h4: {
          fontSize: "1.9rem", // default 2.125rem
        },
        h5: {},
      },
    });
    theme = responsiveFontSizes(
      theme,
      {
        breakpoints: ["sm"],
        factor: 2,
      },
      [darkMode]
    );
    return theme;
  });
}

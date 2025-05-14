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
          default: darkMode ? "#121212" : "#f2efdc", // dark black : very light green
          paper: darkMode ? "#1e1e1e" : "#fffae8", //      black : very light yellow
          memo: darkMode ? "#303030" : "#edf7ed", // light black: light mint green
          memoError: darkMode ? "#7d3333" : "#ffeff1", // dark red : light pink
        },
        primary: {
          main: darkMode ? "#454545" : "#eae5cf", //  gray : mint green
        },
        secondary: {
          main: darkMode ? "#4c8164" : "#cfd082", // green : grass
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
        MuiButton: {
          styleOverrides: {
            // when hover, add opacity and make it lighter (default is darker)
            containedPrimary: ({ theme }) => ({
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.9),
              },
            }),
            containedSecondary: ({ theme }) => ({
              "&:hover": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.9),
              },
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
        MuiTable: {
          styleOverrides: {
            root: ({ theme }) => ({
              borderCollapse: "collapse",
              "& .MuiTableCell-root": {
                border: `1px solid ${theme.palette.divider}`,
              },
            }),
          },
        },
        MuiTableCell: {
          defaultProps: {
            align: "center",
          },
          styleOverrides: {
            head: ({ theme }) => ({
              ...theme.typography.body1,
              fontWeight: theme.typography.fontWeightBold,
              textAlign: "center",
            }),
            body: ({ theme }) => ({
              ...theme.typography.body1,
              textAlign: "center",
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

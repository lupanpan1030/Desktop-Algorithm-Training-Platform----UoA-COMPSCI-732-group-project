import { alpha, createTheme, responsiveFontSizes } from "@mui/material";
import { useMemo } from "react";

export function useAppTheme(darkMode) {
  return useMemo(() => {
    const palette = darkMode
      ? {
          mode: "dark",
          background: {
            default: "#0B1220",
            paper: "#111827",
            memo: "#0F2A21",
            memoError: "#32151C",
          },
          primary: {
            main: "#3B82F6",
            light: "#60A5FA",
            dark: "#1D4ED8",
          },
          secondary: {
            main: "#38BDF8",
            light: "#7DD3FC",
            dark: "#0284C7",
          },
          success: {
            main: "#34D399",
          },
          warning: {
            main: "#F97316",
          },
          text: {
            primary: "#E5EEF8",
            secondary: "#94A3B8",
          },
          divider: "#334155",
          action: {
            rowStripe: alpha("#FFFFFF", 0.02),
            rowHover: alpha("#60A5FA", 0.08),
          },
        }
      : {
          mode: "light",
          background: {
            default: "#F3F7FC",
            paper: "#FFFFFF",
            memo: "#EEFDF6",
            memoError: "#FFF1F2",
          },
          primary: {
            main: "#2563EB",
            light: "#60A5FA",
            dark: "#1D4ED8",
          },
          secondary: {
            main: "#0EA5E9",
            light: "#7DD3FC",
            dark: "#0284C7",
          },
          success: {
            main: "#059669",
          },
          warning: {
            main: "#EA580C",
          },
          text: {
            primary: "#0F172A",
            secondary: "#475569",
          },
          divider: "#D6E0EB",
          action: {
            rowStripe: alpha("#0F172A", 0.02),
            rowHover: alpha("#2563EB", 0.06),
          },
        };

    let theme = createTheme({
      breakpoints: {
        values: {
          xs: 0,
          ssm: 400,
          sm: 720,
          md: 960,
          lg: 1280,
          xl: 1600,
        },
      },
      palette,
      shape: {
        borderRadius: 4,
      },
      typography: {
        fontFamily: '"DM Sans", "Avenir Next", "Segoe UI", sans-serif',
        h1: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontWeight: 700,
          letterSpacing: "-0.04em",
        },
        h2: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontWeight: 700,
          letterSpacing: "-0.04em",
        },
        h3: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontWeight: 700,
          letterSpacing: "-0.04em",
        },
        h4: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontSize: "1.95rem",
          fontWeight: 700,
          letterSpacing: "-0.04em",
        },
        h5: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontWeight: 700,
          letterSpacing: "-0.03em",
        },
        h6: {
          fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
          fontWeight: 700,
          letterSpacing: "-0.02em",
        },
        overline: {
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          lineHeight: 1.35,
        },
        subtitle1: {
          fontWeight: 600,
        },
        subtitle2: {
          fontWeight: 700,
        },
        button: {
          fontWeight: 700,
          textTransform: "none",
          letterSpacing: 0,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: (theme) => ({
            body: {
              margin: 0,
              minHeight: "100vh",
              width: "100vw",
              overflow: "hidden",
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              fontFamily: theme.typography.fontFamily,
              fontFeatureSettings: '"cv11", "ss01"',
            },
            "#root": {
              height: "100%",
              width: "100%",
            },
            "::selection": {
              backgroundColor: alpha(theme.palette.primary.main, 0.28),
            },
          }),
        },
        MuiButton: {
          styleOverrides: {
            root: ({ theme }) => ({
              borderRadius: 999,
              paddingInline: theme.spacing(2),
              boxShadow: "none",
            }),
          },
        },
        MuiChip: {
          styleOverrides: {
            root: () => ({
              borderRadius: 999,
              fontWeight: 600,
            }),
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: ({ theme }) => ({
              borderRadius: 20,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: 1.5,
                borderColor: theme.palette.primary.main,
              },
            }),
          },
        },
        MuiPaper: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: () => ({
              backgroundImage: "none",
            }),
          },
        },
        MuiSvgIcon: {
          styleOverrides: {
            root: ({ theme }) => ({
              fontSize: theme.typography.pxToRem(20),
              [theme.breakpoints.up("md")]: {
                fontSize: theme.typography.pxToRem(22),
              },
            }),
          },
        },
        MuiTab: {
          styleOverrides: {
            root: ({ theme }) => ({
              minHeight: 40,
              paddingInline: theme.spacing(1.5),
              borderRadius: 999,
              fontWeight: 700,
            }),
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              display: "none",
            },
            flexContainer: {
              gap: 8,
            },
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
              borderRadius: 999,
              fontSize: theme.typography.pxToRem(12),
              [theme.breakpoints.up("md")]: {
                fontSize: theme.typography.pxToRem(14),
              },
            }),
          },
        },
      },
    });

    theme = responsiveFontSizes(theme, {
      breakpoints: ["sm", "md", "lg"],
      factor: 2,
    });

    return theme;
  }, [darkMode]);
}

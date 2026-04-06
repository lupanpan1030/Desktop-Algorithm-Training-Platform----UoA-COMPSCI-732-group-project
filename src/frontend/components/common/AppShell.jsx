import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  ButtonBase,
  Chip,
  Drawer,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useProblemLocale } from "../../problem-locale";

const WORKSPACE_STORAGE_KEY = "lastWorkspacePath";
const railWidth = 124;

function shouldUseCompactHeader(pathname) {
  return (
    pathname === "/" ||
    pathname === "/admin/problems" ||
    pathname === "/languages" ||
    pathname === "/settings/ai"
  );
}

function resolvePageMeta(pathname) {
  if (matchPath("/problems/:id", pathname)) {
    return {
      eyebrow: "AI Learning Workspace",
      title: "Workspace",
      description:
        "Read the prompt, iterate in the editor, and inspect execution history in one focused layout.",
    };
  }

  if (pathname === "/admin/problems") {
    return {
      eyebrow: "Curation Console",
      title: "Problem Curation",
      description:
        "Review imported content, testcase coverage, starter code, and judge readiness from one workspace.",
    };
  }

  if (pathname === "/languages") {
    return {
      eyebrow: "Runtime Configuration",
      title: "Languages",
      description:
        "Manage compile and runtime settings for the programming environments available in the local judge.",
    };
  }

  if (pathname === "/settings/ai") {
    return {
      eyebrow: "Assistant Runtime",
      title: "Assistant",
      description:
        "Configure provider mode, API credentials, and runtime defaults for the global AI companion.",
    };
  }

  return {
    eyebrow: "AI Learning Workspace",
    title: "Problems",
    description:
      "Browse localized problems, filter by progress, and decide what to solve next.",
  };
}

function NavigationRailButton({ active, icon, label, to, onClick }) {
  return (
    <ButtonBase
      component={Link}
      to={to}
      onClick={onClick}
      sx={(theme) => ({
        width: "100%",
        borderRadius: 4,
        px: 1,
        py: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 0.8,
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid",
        borderColor: active
          ? alpha(theme.palette.primary.main, 0.32)
          : alpha(theme.palette.divider, 0.45),
        backgroundColor: active
          ? alpha(theme.palette.primary.main, 0.14)
          : alpha(theme.palette.background.paper, 0.42),
        transition:
          "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: alpha(theme.palette.primary.main, 0.3),
          backgroundColor: active
            ? alpha(theme.palette.primary.main, 0.18)
            : alpha(theme.palette.background.paper, 0.72),
        },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: active ? theme.palette.common.white : theme.palette.text.secondary,
          background: active
            ? `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            : alpha(theme.palette.background.default, 0.62),
        })}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={(theme) => ({
          fontWeight: 700,
          color: active ? theme.palette.text.primary : theme.palette.text.secondary,
          letterSpacing: 0.2,
          lineHeight: 1.2,
          textAlign: "center",
        })}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}

function RailContent({
  pathname,
  workspacePath,
  onNavigate,
}) {
  const navItems = [
    {
      key: "problems",
      label: "Problems",
      to: "/",
      active: pathname === "/",
      icon: <FormatListBulletedRoundedIcon fontSize="small" />,
    },
    {
      key: "workspace",
      label: "Workspace",
      to: workspacePath,
      active: Boolean(matchPath("/problems/:id", pathname)),
      icon: <CodeRoundedIcon fontSize="small" />,
    },
    {
      key: "curation",
      label: "Curation",
      to: "/admin/problems",
      active: pathname === "/admin/problems",
      icon: <RouteRoundedIcon fontSize="small" />,
    },
    {
      key: "languages",
      label: "Languages",
      to: "/languages",
      active: pathname === "/languages",
      icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
    },
    {
      key: "assistant",
      label: "Assistant",
      to: "/settings/ai",
      active: pathname === "/settings/ai",
      icon: <SmartToyRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Stack sx={{ height: "100%", p: 1.35 }}>
      <Stack spacing={1.25} alignItems="center" sx={{ px: 0.4 }}>
        <Box
          sx={(theme) => ({
            width: 54,
            height: 54,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: theme.palette.common.white,
            background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: `0 18px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
          })}
        >
          <AutoAwesomeRoundedIcon />
        </Box>
        <Box sx={{ width: "100%", textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", letterSpacing: 0.35, lineHeight: 1.1 }}
          >
            Algo
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, lineHeight: 1.08, letterSpacing: 0.1 }}
          >
            Workspace
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.1} sx={{ mt: 3 }}>
        {navItems.map((item) => (
          <NavigationRailButton
            key={item.key}
            active={item.active}
            icon={item.icon}
            label={item.label}
            to={item.to}
            onClick={onNavigate}
          />
        ))}
      </Stack>

      <Box sx={{ flex: 1 }} />
    </Stack>
  );
}

export default function AppShell({ darkMode, setDarkMode, children }) {
  const location = useLocation();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const { locale, setLocale } = useProblemLocale();
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  const pathname = location.pathname;
  const pageMeta = useMemo(() => resolvePageMeta(pathname), [pathname]);
  const compactHeader = shouldUseCompactHeader(pathname);
  const workspacePath = useMemo(() => {
    if (matchPath("/problems/:id", pathname)) {
      return pathname;
    }

    return localStorage.getItem(WORKSPACE_STORAGE_KEY) || "/";
  }, [pathname]);

  useEffect(() => {
    if (matchPath("/problems/:id", pathname)) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, pathname);
    }
  }, [pathname]);

  const rail = (
    <RailContent
      pathname={pathname}
      workspacePath={workspacePath}
      onNavigate={() => setMobileRailOpen(false)}
    />
  );

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: theme.palette.background.default,
        backgroundImage: `radial-gradient(circle at top left, ${alpha(
          theme.palette.primary.light,
          theme.palette.mode === "dark" ? 0.12 : 0.1
        )} 0%, transparent 30%), radial-gradient(circle at bottom right, ${alpha(
          theme.palette.secondary.light,
          theme.palette.mode === "dark" ? 0.1 : 0.08
        )} 0%, transparent 24%)`,
      })}
    >
      {compact ? (
        <Drawer
          open={mobileRailOpen}
          onClose={() => setMobileRailOpen(false)}
          PaperProps={{
            sx: {
              width: 276,
              bgcolor: "background.paper",
              backgroundImage: "none",
            },
          }}
        >
          {rail}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: railWidth,
            p: 1.3,
            pb: 2,
            flexShrink: 0,
          }}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              height: "100%",
              borderRadius: 8,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.42),
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: "blur(18px)",
              overflow: "hidden",
            })}
          >
            {rail}
          </Paper>
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box sx={{ px: { xs: 2, md: 0 }, pt: { xs: 2, md: 2 }, pr: { md: 3 } }}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              borderRadius: 7,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.4),
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: "blur(18px)",
              px: { xs: 1.4, md: compactHeader ? 1.7 : 2.5 },
              py: { xs: 1.3, md: compactHeader ? 1.15 : 2 },
            })}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={compactHeader ? 1.2 : 2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                {compact && (
                  <IconButton
                    aria-label="open navigation"
                    onClick={() => setMobileRailOpen(true)}
                    sx={{ mt: 0.25 }}
                  >
                    <MenuRoundedIcon />
                  </IconButton>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", letterSpacing: 0.6 }}
                  >
                    {pageMeta.eyebrow}
                  </Typography>
            <Typography
              variant={compactHeader ? "h5" : "h4"}
              sx={{ lineHeight: 1.1, mt: compactHeader ? 0.15 : 0.35 }}
            >
              {pageMeta.title}
            </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: compactHeader ? 0.3 : 0.8,
                      maxWidth: 720,
                      ...(compactHeader
                        ? { display: "none" }
                        : {
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }),
                    }}
                  >
                    {pageMeta.description}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction={{ xs: "row", md: "row" }}
                spacing={1}
                alignItems="center"
                justifyContent={{ xs: "space-between", md: "flex-end" }}
                sx={{ flexWrap: "wrap" }}
              >
                {!compactHeader && (
                  <Chip
                    size="small"
                    label={locale === "zh-CN" ? "Chinese workspace" : "English workspace"}
                    variant="outlined"
                  />
                )}
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={locale}
                  onChange={(_, nextLocale) => {
                    if (nextLocale) {
                      setLocale(nextLocale);
                    }
                  }}
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 1.4,
                      py: 0.6,
                      textTransform: "none",
                    },
                  }}
                >
                  <ToggleButton value="en">EN</ToggleButton>
                  <ToggleButton value="zh-CN">中文</ToggleButton>
                </ToggleButtonGroup>
                <IconButton
                  aria-label="toggle dark mode"
                  onClick={() => setDarkMode(!darkMode)}
                  sx={(theme) => ({
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.5),
                    bgcolor: alpha(theme.palette.background.default, 0.45),
                  })}
                >
                  {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, px: { xs: 2, md: 0 }, py: 2, pr: { md: 3 }, overflow: "hidden" }}>
          <Box
            sx={{
              height: "100%",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              pr: 0.4,
              pb: { xs: 10, md: 2 },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

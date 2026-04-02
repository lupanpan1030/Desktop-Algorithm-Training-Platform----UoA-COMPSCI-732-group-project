import React from "react";
import { AppBar, Toolbar, IconButton, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { ResponsiveButton } from "./ResponsiveComponents";
import { useProblemLocale } from "../../problem-locale";

export default function NavBar({ darkMode, setDarkMode }) {
  const { locale, setLocale } = useProblemLocale();

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", gap: 2 }}>
          <ResponsiveButton
            baseSize="large"
            component={Link}
            to="/"
            color="inherit"
          >
            List
          </ResponsiveButton>
          <ResponsiveButton
            baseSize="large"
            component={Link}
            to="/languages"
            color="inherit"
          >
            Languages
          </ResponsiveButton>
          <ResponsiveButton
            baseSize="large"
            component={Link}
            to="/admin/problems"
            color="inherit"
          >
            Problem Admin
          </ResponsiveButton>
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={locale}
          onChange={(_, nextLocale) => {
            if (nextLocale) {
              setLocale(nextLocale);
            }
          }}
          sx={{ mr: 1 }}
        >
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="zh-CN">中文</ToggleButton>
        </ToggleButtonGroup>

        <IconButton
          onClick={() => setDarkMode(!darkMode)}
          color="inherit"
          size="large"
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

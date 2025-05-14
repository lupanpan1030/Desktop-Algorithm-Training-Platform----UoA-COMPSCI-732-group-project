import React from "react";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { ResponsiveButton } from "./ResponsiveComponents";

export default function NavBar({ darkMode, setDarkMode }) {
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
        </Box>

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

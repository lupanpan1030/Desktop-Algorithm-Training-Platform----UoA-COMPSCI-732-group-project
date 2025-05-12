import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Button } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function NavBar({ darkMode, setDarkMode }) {
    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                  <Button component={Link} to="/" color="inherit">
                    List
                  </Button>
                  <Button component={Link} to="/languages" color="inherit">
                    Languages
                  </Button>
                </Box>

                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}
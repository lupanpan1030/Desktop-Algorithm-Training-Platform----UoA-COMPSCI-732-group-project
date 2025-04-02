import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function NavBar({ darkMode, setDarkMode }) {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" sx={{flexGrow: 1}}>
                    <Link to={"/"} style={{textDecoration: "none", color: "inherit"}}>
                        Home
                    </Link>
                </Typography>

                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}
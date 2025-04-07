import React from 'react';
import App from './App';
import './styles/global.css';

// This file serves as the main entry point for the React application
// The actual rendering is done in the renderer.ts file

export default function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('👋 Hello from the renderer process!');

// This file serves as the main entry point for the React application
// The actual rendering is done in the renderer.ts file

export default function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

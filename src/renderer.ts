/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './frontend/App';

// Find the root element
const container = document.getElementById('root');

// Make sure it exists
if (!container) {
  throw new Error('Root element not found');
}

// Create a root
const root = createRoot(container);

// Render your React component
root.render(React.createElement(App));

console.log('👋 This message is being logged by "renderer.js", included via webpack');

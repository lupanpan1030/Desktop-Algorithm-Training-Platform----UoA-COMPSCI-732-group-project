// Anti Stabilization Function
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): T => {
  let timer: number | null = null;
  return function (...args: Parameters<T>) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => fn(...args), delay);
  } as T;
};

// Replace global ResizeObserver (development mode only)
if (
  typeof window !== 'undefined' &&
  'ResizeObserver' in window &&
  process.env.NODE_ENV === 'development'
) {
  const OriginalResizeObserver = window.ResizeObserver;

  class DebouncedResizeObserver extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(debounce(callback, 1)); 
    }
  }

  window.ResizeObserver = DebouncedResizeObserver;
}



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

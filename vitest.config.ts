import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    workspace: [
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['src/__tests__/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['src/__tests__/setupTests.js'],
        },
      },
      {
        extends: true,
        test: {
          name: 'backend',
          include: ['src/__tests__/backend/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          hookTimeout: 30000,
          testTimeout: 30000,
        },
      },
    ],
  },
});

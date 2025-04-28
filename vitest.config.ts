import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['src/__tests__/frontend/**/*.{test,spec}.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'backend',
          include: ['src/__tests__/backend/**/*.{test,spec}.{ts,tsx}'],
          environment: 'node',
        },
      },
    ],
  },
});
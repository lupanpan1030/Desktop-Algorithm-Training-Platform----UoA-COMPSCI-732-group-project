import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',  // 确保这里设置为 jsdom
    include: ['src/tests/unit/*.unit.test.ts'],  
  },
});

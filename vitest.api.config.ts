// vitest.api.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',         // run in real Node, not jsdom
    include: ['src/tests/integration/*.int.test.ts'],
    deps: {
      inline: ['supertest'],     // force-transform supertest’s CJS
    },
  },
});

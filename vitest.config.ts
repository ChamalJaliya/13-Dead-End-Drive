import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/engine/**'],
      exclude: ['src/__tests__/**'],
    },
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '~': '/Users/chamal/Desktop/13 Dead End Drive/src',
    },
  },
});

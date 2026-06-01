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
      '@ded/types': '/Users/chamal/Desktop/13 Dead End Drive/packages/types/src',
      '@ded/engine': '/Users/chamal/Desktop/13 Dead End Drive/packages/engine/src',
      '@ded/network': '/Users/chamal/Desktop/13 Dead End Drive/packages/network/src',
      '@ded/game-logic': '/Users/chamal/Desktop/13 Dead End Drive/packages/game-logic/src',
    },
  },
});

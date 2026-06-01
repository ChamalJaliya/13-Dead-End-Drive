import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

const root = dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: false,
      environment: 'happy-dom',
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
        '@data': resolve(root, 'data'),
        '@ded/types': resolve(root, 'packages/types/src'),
        '@ded/engine': resolve(root, 'packages/engine/src'),
        '@ded/network': resolve(root, 'packages/network/src'),
        '@ded/game-logic': resolve(root, 'packages/game-logic/src'),
      },
    },
  }),
);

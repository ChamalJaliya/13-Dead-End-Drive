import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import viteConfig from './vite.config.js';

const root = dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [tsconfigPaths({ root })],
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
  }),
);

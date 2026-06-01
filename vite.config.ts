import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { createDedAliases } from './config/ded-vite-aliases.js';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(root, 'index.html') },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/bot-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bot-api/, ''),
      },
      '/lobby-api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lobby-api/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    open: true,
    proxy: {
      '/bot-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bot-api/, ''),
      },
      '/lobby-api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lobby-api/, ''),
      },
    },
  },
  resolve: {
    alias: createDedAliases(root),
  },
});

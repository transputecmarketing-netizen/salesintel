import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        learn: resolve(import.meta.dirname, 'learn/index.html'),
      },
    },
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
    // e2e/ holds Playwright specs (test:e2e) — Vitest's default include glob
    // would otherwise try to run their test() calls outside Playwright's runner.
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },

  resolve: {
    tsconfigPaths: true,
  },
});

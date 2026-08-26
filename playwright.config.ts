import { defineConfig, devices } from '@playwright/test';

const PORT = 5180;

/**
 * E2E tests drive a real Chromium against the app's own Vite dev server
 * (webServer below starts it), with the backend API mocked at the network
 * layer (see e2e/support/mockApi.ts) rather than a live .NET/Postgres stack.
 * That split is deliberate: the API's own behavior (auth rotation, idempotency,
 * validation, ...) is already covered by dev-ai-console-api's 28 integration
 * tests against a real database; this suite's job is the browser experience —
 * real clicks/typing, real routing, real lazy-chunk loading, real browser
 * rendering — none of which jsdom (the Vitest suite) can exercise.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `yarn dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

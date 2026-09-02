import { defineConfig, devices } from '@playwright/test';

/**
 * E2E guest auth. Requires running Next + Nest (or staging URL).
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
 *
 * Without BASE_URL tests are skipped.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

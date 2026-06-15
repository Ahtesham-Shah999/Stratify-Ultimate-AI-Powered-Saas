// playwright.config.js  –  Playwright configuration for Stratify UI smoke tests

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/ui',

  // Run all *.spec.js files; auth.setup.js is handled via project dependency
  testMatch: ['**/*.spec.js'],

  // Max time one test can run
  timeout: 40_000,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Run tests sequentially (app is already running; no parallel port conflicts)
  workers: 1,

  // Reporter: list in terminal + HTML report saved to tests/reports/
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/reports/playwright', open: 'never' }],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }],
  ],

  use: {
    // Base URL for all page.goto() calls
    baseURL: 'http://localhost:3000',

    // Collect traces on first retry so failures are diagnosable
    trace: 'on-first-retry',

    // Screenshot on failure automatically
    screenshot: 'only-on-failure',

    // Increase action timeout for slow CI environments
    actionTimeout: 15_000,
    navigationTimeout: 20_000,

    // Headless by default; set HEADED=true to watch browser
    headless: process.env.HEADED !== 'true',
  },

  // Ensure screenshots directory exists
  outputDir: 'tests/ui/screenshots',

  projects: [
    // ── Step 1: Authenticate once ─────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    // ── Step 2: Run all UI smoke tests using saved session ────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/ui/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /uc\d+.*\.spec\.js/,
    },
  ],
});

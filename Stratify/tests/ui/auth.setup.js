/**
 * auth.setup.js  –  Playwright global setup
 *
 * Logs in once and saves the authenticated browser state to
 * tests/ui/.auth/user.json so all UI test specs can reuse the
 * session without re-logging in for every spec file.
 *
 * Run: npx playwright test --project=setup
 */

const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

const LOGIN_URL      = 'http://localhost:3000/login';
const VALID_EMAIL    = process.env.TEST_EMAIL    || 'testtrader@stratify.test';
const VALID_PASSWORD = process.env.TEST_PASSWORD || 'Test@1234';

setup('Authenticate and save session', async ({ page }) => {
  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  // Fill email
  await page
    .locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]')
    .first()
    .fill(VALID_EMAIL);

  // Fill password
  await page.locator('input[type="password"]').first().fill(VALID_PASSWORD);

  // Submit
  await page
    .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    .first()
    .click();

  // Wait for post-login navigation
  await page.waitForURL(/dashboard|home|strategy/i, { timeout: 15_000 }).catch(() => {});

  // Persist cookies + localStorage to disk
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[Auth Setup] Session saved to ${AUTH_FILE}`);
});

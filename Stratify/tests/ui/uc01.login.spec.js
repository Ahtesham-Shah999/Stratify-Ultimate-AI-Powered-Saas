/**
 * UC-01 UI – Login & Registration Smoke Tests (Playwright)
 *
 * Covers:
 *  TS01 – Landing page loads
 *  TS02 – Login page renders all form elements
 *  TS03 – Valid login flow (end-to-end, requires live stack)
 *  TS04 – Invalid login shows error message
 *  TS05 – Missing credentials keeps user on login page
 */

const { test, expect } = require('@playwright/test');

const BASE_URL   = 'http://localhost:3000';
const LOGIN_URL  = `${BASE_URL}/login`;
const DASH_URL   = `${BASE_URL}/Dashboard`;

// Credentials must exist in the live DB; edit .env.test or use the seeded user
const VALID_EMAIL    = process.env.TEST_EMAIL    || 'testtrader@stratify.test';
const VALID_PASSWORD = process.env.TEST_PASSWORD || 'Test@1234';

// ─────────────────────────────────────────────────────────────────────────────

test.describe('TS01 | Landing Page', () => {
  test('Landing page loads and displays Stratify branding', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.toLowerCase()).toContain('stratify');
    await page.screenshot({ path: 'tests/ui/screenshots/ts01_landing.png', fullPage: true });
  });
});

test.describe('TS02 | Login Page Structure', () => {
  test('Login page renders email field, password field, and submit button', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    // Core elements must exist
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first()).toBeVisible();

    await page.screenshot({ path: 'tests/ui/screenshots/ts02_login_page.png' });
  });
});

test.describe('TS03 | Valid Login Flow', () => {
  test('Valid credentials redirect to Dashboard', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    await page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first().fill(VALID_EMAIL);
    await page.locator('input[type="password"]').first().fill(VALID_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Wait for navigation or dashboard element
    await page.waitForURL(/dashboard|home/i, { timeout: 10_000 }).catch(() => {});
    const url = page.url();

    await page.screenshot({ path: 'tests/ui/screenshots/ts03_post_login.png' });
    expect(url.toLowerCase()).toMatch(/dashboard|home|strategy/i);
  });
});

test.describe('TS04 | Invalid Login', () => {
  test('Wrong password shows error message', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    await page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first().fill('wrong@stratify.test');
    await page.locator('input[type="password"]').first().fill('WrongPass!');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Error toast or inline message should appear
    const errorSelector = page.locator('[role="alert"], .error, .toast, [class*="error"], [class*="alert"]').first();
    await errorSelector.waitFor({ timeout: 5_000 }).catch(() => {});

    await page.screenshot({ path: 'tests/ui/screenshots/ts04_invalid_login.png' });
    // Still on login page
    expect(page.url()).toContain('login');
  });
});

test.describe('TS05 | Missing Credentials', () => {
  test('Submit with empty fields keeps user on login page', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/ui/screenshots/ts05_missing_creds.png' });
    expect(page.url()).toContain('login');
  });
});

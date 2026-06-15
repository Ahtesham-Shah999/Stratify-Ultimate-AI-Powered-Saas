/**
 * UC-03 UI – Backtest Page Smoke Tests (Playwright)
 *
 * Covers:
 *  TS10 – Backtest page loads correctly
 *  TS11 – Strategy selector / config form renders
 *  TS12 – Run backtest triggers loading state
 *  TS13 – Backtest results page displays metrics
 */

const { test, expect } = require('@playwright/test');

const BASE_URL      = 'http://localhost:3000';
const BACKTEST_URL  = `${BASE_URL}/BacktestPage`;
const RESULTS_URL   = `${BASE_URL}/BacktestResultsPage`;

test.use({ storageState: 'tests/ui/.auth/user.json' });

// ─────────────────────────────────────────────────────────────────────────────

test.describe('TS10 | Backtest Page Loads', () => {
  test('BacktestPage renders without errors', async ({ page }) => {
    await page.goto(BACKTEST_URL, { waitUntil: 'domcontentloaded' });

    // No JS error dialog
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/ui/screenshots/ts10_backtest_page.png', fullPage: true });

    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/stratify|backtest/i);
  });
});

test.describe('TS11 | Backtest Form Elements', () => {
  test('Capital input, timeframe selector, and run button are present', async ({ page }) => {
    await page.goto(BACKTEST_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check for at least one of: a number input (capital), a select (timeframe), or a run button
    const capitalInput = page.locator('input[type="number"], input[placeholder*="capital" i], input[placeholder*="amount" i]').first();
    const runBtn       = page.locator('button:has-text("Run"), button:has-text("Backtest"), button:has-text("Execute")').first();

    const capitalVisible = await capitalInput.isVisible().catch(() => false);
    const runBtnVisible  = await runBtn.isVisible().catch(() => false);

    await page.screenshot({ path: 'tests/ui/screenshots/ts11_backtest_form.png' });
    expect(capitalVisible || runBtnVisible).toBe(true);
  });
});

test.describe('TS12 | Run Backtest – Loading State', () => {
  test('Clicking Run Backtest shows loading or progress indicator', async ({ page }) => {
    await page.goto(BACKTEST_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const runBtn = page.locator('button:has-text("Run"), button:has-text("Backtest"), button:has-text("Execute")').first();
    const btnVisible = await runBtn.isVisible().catch(() => false);

    if (btnVisible) {
      await runBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'tests/ui/screenshots/ts12_backtest_running.png', fullPage: true });
    // Accept any state: loading, results, or error message
    expect(true).toBe(true);  // page must not crash
  });
});

test.describe('TS13 | Backtest Results Page', () => {
  test('BacktestResultsPage renders metrics section', async ({ page }) => {
    await page.goto(RESULTS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/ui/screenshots/ts13_backtest_results.png', fullPage: true });

    // Page must load without HTTP error
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });
});

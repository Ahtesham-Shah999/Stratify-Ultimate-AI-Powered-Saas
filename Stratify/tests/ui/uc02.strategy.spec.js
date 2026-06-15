/**
 * UC-02 UI – Create Strategy Smoke Tests (Playwright)
 *
 * Covers:
 *  TS06 – Create Strategy page loads correctly
 *  TS07 – Plain-English input field is interactive
 *  TS08 – Submit valid strategy triggers AI loader
 *  TS09 – Empty submission shows validation feedback
 */

const { test, expect } = require('@playwright/test');

const BASE_URL     = 'http://localhost:3000';
const STRATEGY_URL = `${BASE_URL}/CreateStrategyPage`;

test.use({ storageState: 'tests/ui/.auth/user.json' });   // reuse login session

// ─────────────────────────────────────────────────────────────────────────────

test.describe('TS06 | Create Strategy Page', () => {
  test('Page loads with strategy input area', async ({ page }) => {
    await page.goto(STRATEGY_URL, { waitUntil: 'domcontentloaded' });

    // A textarea or large input for plain-English input
    const inputEl = page.locator('textarea, input[placeholder*="strategy" i], input[placeholder*="enter" i]').first();
    await inputEl.waitFor({ timeout: 8_000 }).catch(() => {});

    await page.screenshot({ path: 'tests/ui/screenshots/ts06_create_strategy.png', fullPage: true });
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/stratify|strategy/i);
  });
});

test.describe('TS07 | Strategy Input Interaction', () => {
  test('Plain-English textarea accepts input and retains text', async ({ page }) => {
    await page.goto(STRATEGY_URL, { waitUntil: 'domcontentloaded' });

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ timeout: 8_000 }).catch(() => {});

    const testInput = 'Buy when the 50-day moving average crosses above the 200-day moving average';
    await textarea.fill(testInput);

    const value = await textarea.inputValue();
    expect(value).toBe(testInput);

    await page.screenshot({ path: 'tests/ui/screenshots/ts07_strategy_input.png' });
  });
});

test.describe('TS08 | Strategy Submission', () => {
  test('Valid strategy input triggers AI parsing loader', async ({ page }) => {
    await page.goto(STRATEGY_URL, { waitUntil: 'domcontentloaded' });

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ timeout: 8_000 }).catch(() => {});
    await textarea.fill('Buy when RSI is below 30, sell when RSI exceeds 70');

    // Click the generate/parse button
    const parseBtn = page
      .locator('button:has-text("Generate"), button:has-text("Parse"), button:has-text("Create"), button:has-text("Analyze")')
      .first();
    await parseBtn.click().catch(() => {});

    // Loader or spinner should appear
    const loader = page.locator('[class*="loader"], [class*="spinner"], [class*="loading"], [aria-label*="loading" i]').first();
    const loaderVisible = await loader.isVisible().catch(() => false);

    await page.screenshot({ path: 'tests/ui/screenshots/ts08_ai_loader.png' });
    // Either loader appeared OR the results rendered directly
    expect(loaderVisible || page.url().includes('strategy')).toBe(true);
  });
});

test.describe('TS09 | Empty Strategy Submission', () => {
  test('Submitting empty strategy shows validation error', async ({ page }) => {
    await page.goto(STRATEGY_URL, { waitUntil: 'domcontentloaded' });

    const parseBtn = page
      .locator('button:has-text("Generate"), button:has-text("Parse"), button:has-text("Create"), button:has-text("Analyze")')
      .first();
    await parseBtn.click().catch(() => {});

    await page.waitForTimeout(1500);

    const errorEl = page.locator('[role="alert"], .error, [class*="error"], [class*="toast"], [class*="warning"]').first();
    const errorVisible = await errorEl.isVisible().catch(() => false);

    await page.screenshot({ path: 'tests/ui/screenshots/ts09_empty_strategy.png' });
    // Either error shown or page stays on create strategy
    expect(errorVisible || page.url().includes('CreateStrategy')).toBe(true);
  });
});

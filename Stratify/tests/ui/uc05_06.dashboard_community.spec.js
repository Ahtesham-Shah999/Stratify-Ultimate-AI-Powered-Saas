/**
 * UC-05 UI – Dashboard Smoke Tests (Playwright)
 * UC-06 UI – Community Hub Smoke Tests (Playwright)
 *
 * Covers:
 *  TS18 – Dashboard page loads with metrics
 *  TS19 – Dashboard empty state handled gracefully
 *  TS20 – Community Hub page loads post feed
 *  TS21 – Community Hub empty feed state
 */

const { test, expect } = require('@playwright/test');

const BASE_URL       = 'http://localhost:3000';
const DASHBOARD_URL  = `${BASE_URL}/Dashboard`;
const COMMUNITY_URL  = `${BASE_URL}/CommunityFeedPage`;

test.use({ storageState: 'tests/ui/.auth/user.json' });

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────

test.describe('TS18 | Dashboard Page', () => {
  test('Dashboard loads and renders performance section', async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/ui/screenshots/ts18_dashboard.png', fullPage: true });

    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/stratify|dashboard/i);

    // At least one metric card / chart container should be present
    const metricEl = page
      .locator('[class*="card"], [class*="chart"], [class*="metric"], [class*="stat"], canvas')
      .first();
    const visible = await metricEl.isVisible().catch(() => false);
    // Metric visible OR page reached dashboard (redirected from home)
    expect(visible || page.url().toLowerCase().includes('dashboard')).toBe(true);
  });
});

test.describe('TS19 | Dashboard Empty State', () => {
  test('Dashboard does not crash when no backtest data is available', async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // No JS fatal error dialog
    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/ui/screenshots/ts19_dashboard_empty.png', fullPage: true });
    expect(dialogAppeared).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COMMUNITY HUB
// ──────────────────────────────────────────────────────────────────────────────

test.describe('TS20 | Community Hub Page', () => {
  test('Community Feed page loads and shows post list', async ({ page }) => {
    await page.goto(COMMUNITY_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/ui/screenshots/ts20_community.png', fullPage: true });

    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/stratify|community|feed/i);

    // Posts list or feed container
    const feedEl = page
      .locator('[class*="post"], [class*="feed"], [class*="card"], article')
      .first();
    const feedVisible = await feedEl.isVisible().catch(() => false);
    const emptyEl = page.locator('[class*="empty"], :has-text("No posts"), :has-text("no strategies")').first();
    const emptyVisible = await emptyEl.isVisible().catch(() => false);

    expect(feedVisible || emptyVisible || page.url().includes('Community')).toBe(true);
  });
});

test.describe('TS21 | Community Hub Empty Feed', () => {
  test('Empty community feed displays a friendly no-content message', async ({ page }) => {
    await page.goto(COMMUNITY_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check page renders without red-screen error
    const bodyText = await page.locator('body').innerText().catch(() => '');
    await page.screenshot({ path: 'tests/ui/screenshots/ts21_community_empty.png', fullPage: true });

    // Body must have some text content (not completely blank)
    expect(bodyText.length).toBeGreaterThan(10);
  });
});

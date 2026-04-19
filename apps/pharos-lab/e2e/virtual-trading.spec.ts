import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VIRTUAL_TRADING_URL = `${BASE_URL}/virtual-trading`;

test.describe('Virtual Trading Page QA', () => {
  test('Coming Soon overlay is removed - main content is accessible', async ({ page }) => {
    await page.goto(VIRTUAL_TRADING_URL, { waitUntil: 'networkidle' });

    // Check that the page header is visible and not blocked
    const pageHeader = page.locator('text=가상 투자').first();
    await expect(pageHeader).toBeVisible();

    // Check that we can see the main content area
    const mainDiv = page.locator('div[class*="flex"][class*="flex-col"]').first();
    const isVisible = await mainDiv.isVisible().catch(() => false);
    expect(isVisible, 'Main content should be visible without Coming Soon overlay').toBeTruthy();

    // Verify no overlay blocking interaction
    const overlayElements = page.locator('[class*="overlay"], [class*="coming-soon"], [class*="soon"]');
    const overlayCount = await overlayElements.count();
    expect(overlayCount, 'Coming Soon overlay should be removed').toBe(0);
  });

  test('Page loads without crashing when not logged in', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    await page.goto(VIRTUAL_TRADING_URL);

    // Page should load without error
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });

    // Check for any critical JS errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.toString());
    });

    // Wait for any initial rendering
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('All 6 widget areas are rendered - AI Signals, Portfolio Summary, Portfolio Table, Trade Form, Equity Chart, Auto Trade Rules', async ({ page }) => {
    await page.goto(VIRTUAL_TRADING_URL, { waitUntil: 'networkidle' });

    // Define widget selectors based on actual implementation in virtual-trading-view.tsx
    const widgets = [
      { name: 'AI 시그널', text: 'AI 시그널' },
      { name: 'Portfolio Summary', text: '가상 투자' }, // Header text
      { name: 'Portfolio Table', text: '포트폴리오' },
      { name: 'Trade Form', text: '매매 실행' },
      { name: 'Equity Chart', text: '자산 추이' },
      { name: 'Auto Trade Rules', text: '자동매매 규칙' },
    ];

    // Check for each widget area
    for (const widget of widgets) {
      const element = page.locator(`text="${widget.text}"`).first();
      const isVisible = await element.isVisible().catch(() => false);
      expect(isVisible, `Widget "${widget.name}" (text: "${widget.text}") should be rendered`).toBeTruthy();
    }
  });

  test('Page structure renders with main content areas', async ({ page }) => {
    await page.goto(VIRTUAL_TRADING_URL);

    // Check for common layout containers
    const mainElement = page.locator('main');
    const sections = page.locator('section');
    const articles = page.locator('article');

    // At least main or section/article elements should exist
    const sectionCount = await sections.count();
    const articleCount = await articles.count();
    const mainVisible = await mainElement.isVisible().catch(() => false);

    expect(
      mainVisible || sectionCount > 0 || articleCount > 0,
      'Page should have main content structure'
    ).toBeTruthy();
  });

  test('Loading skeleton or real data is displayed', async ({ page }) => {
    // Set a reasonable timeout for data loading
    await page.goto(VIRTUAL_TRADING_URL, { waitUntil: 'networkidle' });

    // Look for loading indicators (skeleton, spinner, etc.)
    const skeletonElements = page.locator('[class*="skeleton"], [class*="shimmer"], [class*="loading"]');
    const spinners = page.locator('[role="status"]');

    const hasSkeletons = await skeletonElements.count().then(c => c > 0).catch(() => false);
    const hasSpinners = await spinners.count().then(c => c > 0).catch(() => false);

    // Or check for actual content being rendered
    const contentElements = page.locator('text=/[0-9,]+|%|₩|$|€/');
    const hasContent = await contentElements.count().then(c => c > 0).catch(() => false);

    // Either loading state or real content should be present
    expect(
      hasSkeletons || hasSpinners || hasContent,
      'Page should show loading state or real data'
    ).toBeTruthy();
  });

  test('No critical console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.toString());
    });

    await page.goto(VIRTUAL_TRADING_URL);
    await page.waitForTimeout(1000);

    // Filter out non-critical warnings
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('Non-Error promise rejection') &&
              !e.includes('ResizeObserver loop')
    );

    expect(criticalErrors.length, 'Should have no critical console errors').toBe(0);
  });

  test('Page does not crash when navigating away and back', async ({ page }) => {
    await page.goto(VIRTUAL_TRADING_URL);

    // Navigate to another page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Navigate back to virtual trading
    await page.goto(VIRTUAL_TRADING_URL);

    // Page should still load without error
    const mainContent = page.locator('main, section, article');
    const hasContent = await mainContent.count().then(c => c > 0).catch(() => false);

    expect(hasContent, 'Page should have content after navigation back').toBeTruthy();
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(VIRTUAL_TRADING_URL);

    // Check that page renders without horizontal scroll
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = 375;

    // Allow small overflow for touch interactions
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('Responsive design - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(VIRTUAL_TRADING_URL);

    // Check that page renders without horizontal scroll
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = 768;

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('Page title and metadata are correct', async ({ page }) => {
    await page.goto(VIRTUAL_TRADING_URL);

    // Check page title exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check for Open Graph meta tags (important for sharing)
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');

    // At least one should exist (good practice)
    const hasOG = await ogTitle.count().then(c => c > 0).catch(() => false) ||
                  await ogDescription.count().then(c => c > 0).catch(() => false);

    expect(hasOG || title.length > 10, 'Page should have title or OG metadata').toBeTruthy();
  });
});

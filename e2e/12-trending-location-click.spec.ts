/**
 * Feature: Trending Locations — Click navigates to Projects > View All with filter
 *
 * TC-TL-01  Clicking Kokapet on Home (All) goes to Projects listing view (not the
 *           category picker) with "Showing results in Kokapet" subtitle and active chip
 * TC-TL-02  All 4 trending location cards navigate to the listings view with scroll reset
 * TC-TL-03  Keyboard Enter on a trending location card navigates correctly
 * TC-TL-04  Back button from filtered listings returns to the category picker
 */

import { test, expect } from '@playwright/test';
import { APP_URL } from './helpers';

/** Wait for smooth-scroll to settle at top */
async function waitForScrollTop(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => window.scrollY < 100, { timeout: 8_000 });
}

/** Scroll to bring Trending Locations cards into view (below hero + USPs) */
async function scrollToTrendingLocations(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
  await page.waitForTimeout(500);
}

test.describe('Trending Locations — click navigation', () => {
  test('TC-TL-01: clicking Kokapet navigates to Projects listing view with location subtitle and active chip', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Category filter bar is present on Home
    await expect(page.getByTestId('category-filter-all')).toBeVisible();

    await scrollToTrendingLocations(page);

    const kokapetCard = page.getByTestId('trending-location-kokapet');
    await expect(kokapetCard).toBeVisible({ timeout: 10_000 });
    await expect(kokapetCard).toHaveAttribute('role', 'button');

    await kokapetCard.click();

    // Scroll resets to top
    await waitForScrollTop(page);

    // Listings view shows "Showing results in Kokapet" subtitle (NOT the category picker)
    await expect(page.getByText('Showing results in Kokapet')).toBeVisible({ timeout: 10_000 });

    // The Kokapet chip in the filter panel is active (bg-indigo-600)
    const kokapetChip = page.locator('button', { hasText: 'Kokapet' }).last();
    await expect(kokapetChip).toBeVisible({ timeout: 8_000 });
    await expect(kokapetChip).toHaveClass(/bg-indigo-600/);

    console.log('TC-TL-01 PASSED: Kokapet → listings view with subtitle and active chip');
  });

  test('TC-TL-02: all 4 trending location cards navigate to listings view (not category picker)', async ({ page }) => {
    const locations = [
      { testId: 'trending-location-kokapet',            name: 'Kokapet' },
      { testId: 'trending-location-kondapur',           name: 'Kondapur' },
      { testId: 'trending-location-neopolis',           name: 'Neopolis' },
      { testId: 'trending-location-financial-district', name: 'Financial District' },
    ];

    for (const loc of locations) {
      await page.goto(APP_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      await scrollToTrendingLocations(page);

      const card = page.getByTestId(loc.testId);
      await expect(card).toBeVisible({ timeout: 10_000 });
      await expect(card).toHaveAttribute('role', 'button');

      await card.click();

      // Scroll resets
      await waitForScrollTop(page);

      // Listings-mode subtitle confirms we are NOT on the category picker
      await expect(page.getByText(`Showing results in ${loc.name}`)).toBeVisible({ timeout: 10_000 });

      // Category picker heading "Explore All Properties" must NOT be present
      await expect(page.getByText('Explore All Properties')).not.toBeVisible();

      console.log(`TC-TL-02 PASSED for: ${loc.name}`);
    }
  });

  test('TC-TL-03: keyboard Enter on Kokapet card navigates to listings view', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await scrollToTrendingLocations(page);

    const kokapetCard = page.getByTestId('trending-location-kokapet');
    await expect(kokapetCard).toBeVisible({ timeout: 10_000 });

    await kokapetCard.focus();
    await page.keyboard.press('Enter');

    await waitForScrollTop(page);

    await expect(page.getByText('Showing results in Kokapet')).toBeVisible({ timeout: 10_000 });

    console.log('TC-TL-03 PASSED: Keyboard Enter navigates to listings view');
  });

  test('TC-TL-04: back button from filtered listings returns to category picker', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await scrollToTrendingLocations(page);

    const kokapetCard = page.getByTestId('trending-location-kokapet');
    await expect(kokapetCard).toBeVisible({ timeout: 10_000 });
    await kokapetCard.click();

    await waitForScrollTop(page);
    await expect(page.getByText('Showing results in Kokapet')).toBeVisible({ timeout: 10_000 });

    // Click the back (ChevronLeft) button
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    await page.waitForTimeout(500);

    // Category picker heading should reappear
    await expect(page.getByText('Explore All Properties')).toBeVisible({ timeout: 8_000 });

    console.log('TC-TL-04 PASSED: Back button returns to category picker');
  });
});

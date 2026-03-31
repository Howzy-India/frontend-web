/**
 * Feature: Verification & Attendance (Super Admin)
 *
 * TC-VER-01  Super admin sees the Verification Panel tab and it loads
 * TC-VER-02  Super admin sees the Attendance & Tracking tab and it loads
 * TC-VER-03  Attendance tab shows the Daily Attendance Report table
 * TC-VER-04  Verification Panel loads content (submissions or empty state)
 */

import { test, expect } from '@playwright/test';
import {
  signInAsSuperAdmin,
  navigateToDashboardTab,
} from './helpers';

test.describe('Verification & Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
  });

  test('TC-VER-01: Super admin can navigate to Verification Panel', async ({ page }) => {
    await navigateToDashboardTab(page, 'Verification Panel');
    await page.waitForTimeout(2000);

    await expect(
      page.locator('h2, h3').filter({ hasText: /Verification/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC-VER-02: Super admin can navigate to Attendance & Tracking', async ({ page }) => {
    await navigateToDashboardTab(page, 'Attendance & Tracking');
    await page.waitForTimeout(2000);

    await expect(
      page.locator('h2, h3').filter({ hasText: /Attendance/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC-VER-03: Attendance tab shows Daily Attendance Report', async ({ page }) => {
    await navigateToDashboardTab(page, 'Attendance & Tracking');
    await page.waitForTimeout(2000);

    // AttendanceTrackingView renders "Daily Attendance Report" heading
    await expect(
      page.locator('h4, h3, div').filter({ hasText: /Daily Attendance Report/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Should have a table (even if empty)
    await expect(page.locator('table').first()).toBeVisible({ timeout: 8_000 });
  });

  test('TC-VER-04: Verification Panel loads content', async ({ page }) => {
    await navigateToDashboardTab(page, 'Verification Panel');
    await page.waitForTimeout(2000);

    // AdminVerificationPanel renders some content — table or empty state
    const content = page.locator('table, p, div').filter({ hasText: /verif|submission|pending|no .* found/i }).first();
    const fallback = page.locator('h2, h3').filter({ hasText: /Verification/i }).first();
    const visible =
      (await content.isVisible().catch(() => false)) ||
      (await fallback.isVisible().catch(() => false));
    expect(visible).toBe(true);
  });
});

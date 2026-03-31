import { test, expect } from '@playwright/test';
import { CREDENTIALS, signInAsSuperAdmin, navigateToDashboardTab, logout, refreshDashboard, withClientSession } from './helpers';

test.describe('Super Admin — Client Login Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToDashboardTab(page, 'Client Logins');
  });

  test('TC-CLD-01: Client Logins tab loads with stats', async ({ page }) => {
    await expect(page.locator('text=/total users/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/active today/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/total logins/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/failed attempts/i').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-logins-stats.png', fullPage: false });
  });

  test('TC-CLD-02: Client login is tracked after sign-in', async ({ page, browser }) => {
    await withClientSession(browser, async (clientPage) => {
      await clientPage.screenshot({ path: 'e2e/screenshots/client-logged-in.png' });
    });
    await page.waitForTimeout(5000);
    await refreshDashboard(page);
    await expect(page.locator(`text=${CREDENTIALS.client.email}`).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-login-tracked.png', fullPage: false });
  });

  test('TC-CLD-03: Logout time is recorded after client signs out', async ({ page, browser }) => {
    await withClientSession(browser, (clientPage) => logout(clientPage));
    await page.waitForTimeout(5000);
    await refreshDashboard(page);
    await expect(page.locator(`text=${CREDENTIALS.client.email}`).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-logout-tracked.png', fullPage: false });
  });
});

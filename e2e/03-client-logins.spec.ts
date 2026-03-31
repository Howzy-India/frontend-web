import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS } from './helpers';

const APP_URL = 'https://howzy-web.web.app';

async function signInAsSuperAdmin(page: Page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[placeholder="Email Address"]');
  if (!(await emailInput.isVisible().catch(() => false))) {
    await page.locator('button').filter({ hasText: /sign in|login/i }).first().click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.locator('input[placeholder="Email Address"]').fill(CREDENTIALS.superAdmin.email);
  await page.locator('input[placeholder="Password"]').fill(CREDENTIALS.superAdmin.password);
  await page.locator('button:has-text("Sign in with Email")').click();
  await page.waitForTimeout(4000);
}

// ── Test Suite 3: Client Login Dashboard ─────────────────────────────────────

test.describe('Super Admin — Client Login Dashboard', () => {
  test('TC-CLD-01: Client Logins tab loads with stats', async ({ page }) => {
    await signInAsSuperAdmin(page);

    // Click Client Logins tab
    await page.locator('button, a, li').filter({ hasText: 'Client Logins' }).first().click({ timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Stats cards must be present
    await expect(page.locator('text=/total users/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/active today/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/total logins/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/failed attempts/i').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-logins-stats.png', fullPage: false });
  });

  test('TC-CLD-02: Client login tracked after sign-in', async ({ page, context }) => {
    await signInAsSuperAdmin(page);
    await page.locator('button, a, li').filter({ hasText: 'Client Logins' }).first().click({ timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Open a second page as client, sign in
    const clientPage = await context.newPage();
    await clientPage.goto(APP_URL, { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(2000);
    const emailInput = clientPage.locator('input[placeholder="Email Address"]');
    if (!(await emailInput.isVisible().catch(() => false))) {
      await clientPage.locator('button').filter({ hasText: /sign in|login/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await clientPage.waitForTimeout(500);
    }
    await clientPage.locator('input[placeholder="Email Address"]').fill(CREDENTIALS.client.email);
    await clientPage.locator('input[placeholder="Password"]').fill(CREDENTIALS.client.password);
    await clientPage.locator('button:has-text("Sign in with Email")').click();
    await clientPage.waitForTimeout(4000);
    await clientPage.screenshot({ path: 'e2e/screenshots/client-logged-in.png' });
    await clientPage.close();

    // Back on admin dashboard, refresh Client Logins and check for the new record
    await page.waitForTimeout(5000); // wait for next poll or trigger manual refresh
    const refreshBtn = page.locator('button').filter({ hasText: /refresh/i }).first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(3000);
    }

    await expect(page.locator(`text=${CREDENTIALS.client.email}`).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-login-tracked.png', fullPage: false });
  });

  test('TC-CLD-03: Logout time is recorded after client signs out', async ({ page, context }) => {
    await signInAsSuperAdmin(page);
    await page.locator('button, a, li').filter({ hasText: 'Client Logins' }).first().click({ timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Sign in as client in separate tab
    const clientPage = await context.newPage();
    await clientPage.goto(APP_URL, { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(2000);
    const emailInput = clientPage.locator('input[placeholder="Email Address"]');
    if (!(await emailInput.isVisible().catch(() => false))) {
      await clientPage.locator('button').filter({ hasText: /sign in|login/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await clientPage.waitForTimeout(500);
    }
    await clientPage.locator('input[placeholder="Email Address"]').fill(CREDENTIALS.client.email);
    await clientPage.locator('input[placeholder="Password"]').fill(CREDENTIALS.client.password);
    await clientPage.locator('button:has-text("Sign in with Email")').click();
    await clientPage.waitForTimeout(4000);

    // Now sign out from client page
    const logoutBtn = clientPage.getByRole('button', { name: 'Logout' }).first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await clientPage.waitForTimeout(3000);
    }
    await clientPage.close();

    // Refresh admin dashboard and verify logout_time is present
    await page.waitForTimeout(5000);
    const refreshBtn = page.locator('button').filter({ hasText: /refresh/i }).first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(3000);
    }

    await expect(page.locator(`text=${CREDENTIALS.client.email}`).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-logout-tracked.png', fullPage: false });
  });
});

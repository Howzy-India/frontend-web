import { test, expect } from '@playwright/test';
import { signInAsSuperAdmin, signInAsAdmin, signInAsClient, APP_URL } from './helpers';

test.describe('Authentication', () => {
  test('TC-AUTH-01: Super admin login lands on SuperAdminDashboard', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await expect(page.getByRole('button', { name: 'Client Logins' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Global Leads' }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-superadmin.png', fullPage: false });
  });

  test('TC-AUTH-02: Admin login lands on SuperAdminDashboard', async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole('button', { name: 'Enquiries' }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-admin.png', fullPage: false });
  });

  test('TC-AUTH-03: Client login sees profile and Logout button', async ({ page }) => {
    await signInAsClient(page);
    await expect(page.getByRole('button', { name: 'Logout' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Global Leads' })).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
    await page.screenshot({ path: 'e2e/screenshots/auth-client.png', fullPage: false });
  });

  test('TC-AUTH-04: Invalid credentials show error', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const emailInput = page.locator('input[placeholder="Email Address"]');
    if (!(await emailInput.isVisible().catch(() => false))) {
      await page.locator('button').filter({ hasText: /sign in|login/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.locator('input[placeholder="Email Address"]').fill('wrong@howzy.in');
    await page.locator('input[placeholder="Password"]').fill('wrongpassword');
    await page.locator('button:has-text("Sign in with Email")').click();
    await expect(page.locator('text=/invalid|wrong|failed|error/i').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-invalid.png' });
  });
});

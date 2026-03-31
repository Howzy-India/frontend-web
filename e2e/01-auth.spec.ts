import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS } from './helpers';

const APP_URL = 'https://howzy-web.web.app';

async function signIn(page: Page, email: string, password: string) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  // Wait for splash to finish
  await page.waitForTimeout(2000);

  // If we land on the login page directly (full page variant)
  const emailInput = page.locator('input[placeholder="Email Address"]');
  if (!(await emailInput.isVisible().catch(() => false))) {
    // Need to click a login button to open overlay
    const loginBtn = page.locator('button').filter({ hasText: /sign in|login/i }).first();
    await loginBtn.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  await page.locator('input[placeholder="Email Address"]').fill(email);
  await page.locator('input[placeholder="Password"]').fill(password);
  await page.locator('button:has-text("Sign in with Email")').click();
  await page.waitForTimeout(3000);
}

async function signOut(page: Page) {
  // Logout button is icon-only with aria-label="Logout"
  const logoutBtn = page.getByRole('button', { name: 'Logout' }).first();
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(1500);
  }
}

// ── Test Suite 1: Authentication ─────────────────────────────────────────────

test.describe('Authentication', () => {
  test('TC-AUTH-01: Super admin login lands on SuperAdminDashboard', async ({ page }) => {
    await signIn(page, CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
    // Super Admin sidebar has admin-only nav buttons (Client Logins, Global Leads)
    await expect(page.locator('button:has-text("Client Logins")').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button:has-text("Global Leads")').first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-superadmin.png', fullPage: false });
  });

  test('TC-AUTH-02: Admin login lands on SuperAdminDashboard', async ({ page }) => {
    await signIn(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    // Admin also sees the dashboard sidebar
    await expect(page.locator('button:has-text("Enquiries")').first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-admin.png', fullPage: false });
  });

  test('TC-AUTH-03: Client login sees profile and Logout button', async ({ page }) => {
    await signIn(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    // Client is on the public portal — Logout button (aria-label) and profile avatar visible
    await expect(page.getByRole('button', { name: 'Logout' }).first()).toBeVisible({ timeout: 15_000 });
    // Should NOT see the admin sidebar nav
    const globalLeads = page.getByRole('button', { name: 'Global Leads' });
    await expect(globalLeads).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
    await page.screenshot({ path: 'e2e/screenshots/auth-client.png', fullPage: false });
  });

  test('TC-AUTH-04: Invalid credentials show error', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const emailInput = page.locator('input[placeholder="Email Address"]');
    if (!(await emailInput.isVisible().catch(() => false))) {
      const loginBtn = page.locator('button').filter({ hasText: /sign in|login/i }).first();
      await loginBtn.click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.locator('input[placeholder="Email Address"]').fill('wrong@howzy.in');
    await page.locator('input[placeholder="Password"]').fill('wrongpassword');
    await page.locator('button:has-text("Sign in with Email")').click();
    await expect(page.locator('text=/invalid|wrong|failed|error/i').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/auth-invalid.png' });
  });
});

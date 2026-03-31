import { test, expect } from '@playwright/test';
import { CREDENTIALS, signInAsSuperAdmin, signInAsAdmin, navigateToDashboardTab } from './helpers';

test.describe('Super Admin — Admin Users Management', () => {
  test('TC-SA-01: Admin Users tab loads and shows admin@howzy.in', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToDashboardTab(page, 'Admin Users');
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15_000 }).catch(() => {});
    await expect(page.getByRole('heading', { name: 'Admin Users' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Create Admin User' })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${CREDENTIALS.admin.email}`)).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-users-list.png', fullPage: true });
  });

  test('TC-SA-02: Create a new admin user', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToDashboardTab(page, 'Admin Users');
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible({ timeout: 10_000 });

    const ts = Date.now();
    const testEmail = `qa_${ts}@howzy.in`;
    await page.locator('input[placeholder="Full Name"]').fill(`QA Admin ${ts}`);
    await page.locator('input[placeholder="Email"]').fill(testEmail);
    await page.locator('input[placeholder="Temporary Password"]').fill('QaTest@123');
    await page.locator('button:has-text("Create Admin")').click();
    await page.waitForTimeout(5000);
    await expect(page.locator(`text=${testEmail}`)).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-users-created.png', fullPage: true });
  });

  test('TC-SA-03: Disable and re-enable an admin user', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToDashboardTab(page, 'Admin Users');
    await expect(page.locator(`text=${CREDENTIALS.admin.email}`)).toBeVisible({ timeout: 15_000 });

    const adminRow = page.locator('tr').filter({ hasText: CREDENTIALS.admin.email });
    const disableBtn = adminRow.locator('button:has-text("Disable")');
    if (!(await disableBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Disable button not visible — user may already be disabled');
      return;
    }
    await disableBtn.click();
    await page.waitForTimeout(3000);
    await expect(adminRow.locator('text=disabled')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-users-disabled.png', fullPage: true });

    // Re-enable for subsequent tests
    await adminRow.locator('button:has-text("Enable")').click();
    await page.waitForTimeout(3000);
    await expect(adminRow.locator('text=active')).toBeVisible({ timeout: 10_000 });
  });

  test('TC-SA-04: Admin user cannot see Create Admin User form', async ({ page }) => {
    await signInAsAdmin(page);
    await navigateToDashboardTab(page, 'Admin Users');
    await expect(page.getByRole('heading', { name: 'Create Admin User' })).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Admin Users' }).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-role-access-control.png' });
  });
});

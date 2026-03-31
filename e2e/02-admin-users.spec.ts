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

async function navigateToAdminUsersTab(page: Page) {
  // Click the Admin Users tab in the sidebar
  const adminUsersTab = page.locator('button, a, li').filter({ hasText: 'Admin Users' }).first();
  await adminUsersTab.click({ timeout: 10_000 });
  await page.waitForTimeout(2000);
}

// ── Test Suite 2: Admin Users Management ─────────────────────────────────────

test.describe('Super Admin — Admin Users Management', () => {
  test('TC-SA-01: Admin Users tab loads and shows admin@howzy.in', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToAdminUsersTab(page);

    // Wait for the Refresh button — means the component has mounted
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible({ timeout: 10_000 });
    // Wait for loading spinner to disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15_000 }).catch(() => {});

    // Verify heading and create form (super_admin only)
    await expect(page.getByRole('heading', { name: 'Admin Users' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Create Admin User' })).toBeVisible({ timeout: 5_000 });

    // Verify admin@howzy.in is in the table
    await expect(page.locator('text=admin@howzy.in')).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-users-list.png', fullPage: true });
  });

  test('TC-SA-02: Create a new admin user', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToAdminUsersTab(page);

    const ts = Date.now();
    const testEmail = `qa_${ts}@howzy.in`;
    const testName = `QA Admin ${ts}`;

    // Fill the create form
    await page.locator('input[placeholder="Full Name"]').fill(testName);
    await page.locator('input[placeholder="Email"]').fill(testEmail);
    await page.locator('input[placeholder="Temporary Password"]').fill('QaTest@123');

    // Click Create Admin
    await page.locator('button:has-text("Create Admin")').click();

    // Wait for loading and refresh
    await page.waitForTimeout(5000);

    // Verify new user appears in the table
    await expect(page.locator(`text=${testEmail}`)).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-users-created.png', fullPage: true });

    // Store uid for next test via page storage
    await page.evaluate((email) => sessionStorage.setItem('lastCreatedAdminEmail', email), testEmail);
  });

  test('TC-SA-03: Disable an admin user', async ({ page }) => {
    await signInAsSuperAdmin(page);
    await navigateToAdminUsersTab(page);

    // Wait for table to load
    await expect(page.locator('text=admin@howzy.in')).toBeVisible({ timeout: 10_000 });

    // Find the row containing admin@howzy.in and click Disable
    const adminRow = page.locator('tr').filter({ hasText: 'admin@howzy.in' });
    const disableBtn = adminRow.locator('button:has-text("Disable")');

    if (await disableBtn.isVisible().catch(() => false)) {
      await disableBtn.click();
      await page.waitForTimeout(3000);
      // Status should change to disabled
      await expect(adminRow.locator('text=disabled')).toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: 'e2e/screenshots/admin-users-disabled.png', fullPage: true });

      // Re-enable for subsequent tests
      const enableBtn = adminRow.locator('button:has-text("Enable")');
      if (await enableBtn.isVisible().catch(() => false)) {
        await enableBtn.click();
        await page.waitForTimeout(3000);
        await expect(adminRow.locator('text=active')).toBeVisible({ timeout: 10_000 });
      }
    } else {
      // If already disabled, just verify the state
      await expect(adminRow).toBeVisible();
    }
  });

  test('TC-SA-04: Admin user cannot see Create Admin User form', async ({ page }) => {
    // Sign in as admin (not super_admin)
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const emailInput = page.locator('input[placeholder="Email Address"]');
    if (!(await emailInput.isVisible().catch(() => false))) {
      await page.locator('button').filter({ hasText: /sign in|login/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.locator('input[placeholder="Email Address"]').fill(CREDENTIALS.admin.email);
    await page.locator('input[placeholder="Password"]').fill(CREDENTIALS.admin.password);
    await page.locator('button:has-text("Sign in with Email")').click();
    await page.waitForTimeout(4000);

    // Navigate to Admin Users tab
    const adminUsersTab = page.locator('button, a, li').filter({ hasText: 'Admin Users' }).first();
    await adminUsersTab.click({ timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Create Admin User form must NOT be visible to admin role
    await expect(page.getByRole('heading', { name: 'Create Admin User' })).not.toBeVisible({ timeout: 5_000 });

    // But the list of admin users should still be visible
    await expect(page.getByRole('heading', { name: 'Admin Users' }).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/admin-role-access-control.png' });
  });
});

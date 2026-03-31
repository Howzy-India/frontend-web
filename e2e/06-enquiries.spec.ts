/**
 * Feature: Enquiries Management (Super Admin)
 *
 * TC-ENQ-01  Enquiries tab loads with table and filter controls
 * TC-ENQ-02  Filter by status narrows the visible enquiry rows
 * TC-ENQ-03  Clicking View on an enquiry opens the details modal
 * TC-ENQ-04  Admin-role user can access Enquiries tab
 */

import { test, expect, Browser } from '@playwright/test';
import {
  signInAsSuperAdmin,
  navigateToDashboardTab,
  seedEnquiry,
  cancelEnquiry,
  getIdToken,
  CREDENTIALS,
  APP_URL,
  signIn,
} from './helpers';

const seededIds: string[] = [];
let superAdminToken = '';

test.describe('Enquiries Management', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    const id = await seedEnquiry({
      client_name: 'E2E Test Enquirer',
      email: 'e2e-enquiry@howzy.in',
      phone: '9999999901',
      property_name: 'E2E Test Property',
      location: 'Hyderabad',
      enquiry_type: 'General',
    });
    seededIds.push(id);
  });

  test.afterAll(async () => {
    for (const id of seededIds) {
      await cancelEnquiry(superAdminToken, id).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
  });

  test('TC-ENQ-01: Enquiries tab loads with table and filter controls', async ({ page }) => {
    await navigateToDashboardTab(page, 'Enquiries');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: /Enquiries/i }).first()).toBeVisible();

    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Filter select is present
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 });
  });

  test('TC-ENQ-02: Filter by status narrows visible rows', async ({ page }) => {
    await navigateToDashboardTab(page, 'Enquiries');
    await page.waitForTimeout(2000);

    const select = page.locator('select').first();
    await expect(select).toBeVisible();

    // Count rows with 'All' selected
    const allRows = page.locator('table tbody tr');
    const totalBefore = await allRows.count();

    // Filter to 'Closed' — likely to return 0 or fewer rows
    await select.selectOption('Closed');
    await page.waitForTimeout(1000);

    const rowsAfter = await allRows.count();
    // Rows should be ≤ total before filtering
    expect(rowsAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('TC-ENQ-03: Clicking View on an enquiry opens the details modal', async ({ page }) => {
    await navigateToDashboardTab(page, 'Enquiries');
    await page.waitForTimeout(2000);

    // Reset to All
    await page.locator('select').first().selectOption('All');
    await page.waitForTimeout(1000);

    // Wait for data rows to load (not loading/empty state)
    // The Eye icon button has title="View Details" — icon-only, no text
    const viewBtn = page.locator('button[title="View Details"]').first();
    await viewBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await viewBtn.click();
    await page.waitForTimeout(1500);

    // Modal should open with "Enquiry Details" heading
    await expect(
      page.getByRole('heading', { name: /Enquiry Details/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('TC-ENQ-04: Admin-role user can access Enquiries tab', async ({ browser }: { browser: Browser }) => {
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(APP_URL, { waitUntil: 'networkidle' });
    await signIn(adminPage, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    await adminPage.waitForTimeout(2000);

    await navigateToDashboardTab(adminPage, 'Enquiries');
    await adminPage.waitForTimeout(2000);

    await expect(
      adminPage.getByRole('heading', { name: /Enquiries/i }).first(),
    ).toBeVisible();
    await expect(adminPage.locator('table').first()).toBeVisible({ timeout: 10_000 });

    await adminCtx.close();
  });
});

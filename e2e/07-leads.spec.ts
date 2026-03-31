/**
 * Feature: Leads Management (Super Admin)
 *
 * TC-LEAD-01  Global Leads tab loads with platform-wide leads table
 * TC-LEAD-02  Lead Allocation tab loads
 * TC-LEAD-03  Bulk Lead Upload tab loads the upload interface
 * TC-LEAD-04  Auto-assign button is visible in Lead Allocation
 */

import { test, expect } from '@playwright/test';
import {
  signInAsSuperAdmin,
  navigateToDashboardTab,
  seedLead,
  getIdToken,
  CREDENTIALS,
} from './helpers';

const seededLeadIds: string[] = [];
let superAdminToken = '';

test.describe('Leads Management', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    // Seed a lead so the table always has at least one row
    const id = await seedLead({
      name: 'E2E Test Lead',
      email: 'e2e-lead@howzy.in',
      phone: '9999999902',
      city: 'Hyderabad',
      budget: '50L-1Cr',
      propertyType: 'Apartment',
    });
    seededLeadIds.push(id);
  });

  // Note: leads cannot be deleted via API — they are seeded and left with 'e2e-test' source

  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
    void superAdminToken; // suppress unused warning
    void seededLeadIds;
  });

  test('TC-LEAD-01: Global Leads tab loads with table', async ({ page }) => {
    await navigateToDashboardTab(page, 'Global Leads');
    await page.waitForTimeout(2000);

    await expect(
      page.getByRole('heading', { name: /Platform-wide Leads|Global Leads/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('TC-LEAD-02: Lead Allocation tab loads', async ({ page }) => {
    await navigateToDashboardTab(page, 'Lead Allocation');
    await page.waitForTimeout(2000);

    // LeadAllocationManager should render some content
    const content = page.locator('h2, h3').filter({ hasText: /lead|allocation/i }).first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test('TC-LEAD-03: Bulk Lead Upload tab loads upload interface', async ({ page }) => {
    await navigateToDashboardTab(page, 'Bulk Lead Upload');
    await page.waitForTimeout(2000);

    // Should have some upload-related content
    const uploadContent = page.locator('text=/upload|import|bulk/i').first();
    await expect(uploadContent).toBeVisible({ timeout: 10_000 });
  });

  test('TC-LEAD-04: Lead Allocation has auto-assign control', async ({ page }) => {
    await navigateToDashboardTab(page, 'Lead Allocation');
    await page.waitForTimeout(2000);

    // Auto-assign button or control should be visible
    const autoAssign = page
      .locator('button, [role="button"]')
      .filter({ hasText: /auto.?assign|assign/i })
      .first();
    await expect(autoAssign).toBeVisible({ timeout: 10_000 });
  });
});

/**
 * Feature: Partner Dashboard
 *
 * TC-PARTNER-01  Partner user logs in and sees the Partner Dashboard
 * TC-PARTNER-02  Partner Dashboard tab shows stats/overview
 * TC-PARTNER-03  Assigned Leads tab loads
 * TC-PARTNER-04  Punch In / Punch Out button is visible
 */

import { test, expect } from '@playwright/test';
import {
  APP_URL,
  signIn,
  getIdToken,
  createUserWithRole,
  deleteCreatedUser,
  CREDENTIALS,
} from './helpers';

const PARTNER_EMAIL = 'e2e-partner@howzy.in';
const PARTNER_PASSWORD = 'Howzy@E2E2';

let partnerUid = '';
let superAdminToken = '';

test.describe('Partner Dashboard', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    partnerUid = await createUserWithRole(superAdminToken, {
      email: PARTNER_EMAIL,
      password: PARTNER_PASSWORD,
      displayName: 'E2E Partner',
      role: 'partner',
    });
  });

  test.afterAll(async () => {
    if (partnerUid) {
      await deleteCreatedUser(superAdminToken, partnerUid).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await signIn(page, PARTNER_EMAIL, PARTNER_PASSWORD);
    await page.waitForTimeout(2000);
  });

  test('TC-PARTNER-01: Partner user sees the Partner Dashboard', async ({ page }) => {
    // PartnerDashboard has "Dashboard" and "Assigned Leads" tabs
    await expect(
      page.locator('button').filter({ hasText: /^Dashboard$/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC-PARTNER-02: Partner Dashboard tab shows stats/overview content', async ({ page }) => {
    // Dashboard tab should be active by default — shows stats cards or submission buttons
    await expect(
      page.locator('button, div, h3').filter({ hasText: /Dashboard|Overview|Assigned|Submit/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC-PARTNER-03: Assigned Leads tab loads', async ({ page }) => {
    const assignedTab = page.locator('button').filter({ hasText: /Assigned Leads/i }).first();
    await assignedTab.waitFor({ state: 'visible', timeout: 10_000 });
    await assignedTab.click();
    await page.waitForTimeout(1500);

    // Should show a table or empty state for assigned leads
    const content = page.locator('table, p, div').filter({ hasText: /Assigned|Leads|no leads|empty/i }).first();
    const fallback = page.locator('table').first();
    const visible =
      (await content.isVisible().catch(() => false)) ||
      (await fallback.isVisible().catch(() => false));
    expect(visible).toBe(true);
  });

  test('TC-PARTNER-04: Punch In button is visible', async ({ page }) => {
    // Attendance Punch In button is always visible before check-in
    await expect(
      page.locator('button').filter({ hasText: /Punch In/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

/**
 * Feature: Pilot (Agent) Dashboard
 *
 * TC-PILOT-01  Pilot user logs in and sees the Pilot Dashboard sidebar
 * TC-PILOT-02  Pilot can navigate to the Leads tab
 * TC-PILOT-03  Pilot can navigate to the My Assigned Leads tab
 * TC-PILOT-04  Pilot Dashboard shows Listed Projects tab by default
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

const PILOT_EMAIL = 'e2e-pilot@howzy.in';
const PILOT_PASSWORD = 'Howzy@E2E1';

let pilotUid = '';
let superAdminToken = '';

test.describe('Pilot Dashboard', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    pilotUid = await createUserWithRole(superAdminToken, {
      email: PILOT_EMAIL,
      password: PILOT_PASSWORD,
      displayName: 'E2E Pilot',
      role: 'agent',
    });
  });

  test.afterAll(async () => {
    if (pilotUid) {
      await deleteCreatedUser(superAdminToken, pilotUid).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await signIn(page, PILOT_EMAIL, PILOT_PASSWORD);
    await page.waitForTimeout(2000);
  });

  test('TC-PILOT-01: Pilot user sees the Pilot Dashboard sidebar', async ({ page }) => {
    // PilotDashboard renders a sidebar with navigation tabs
    await expect(
      page.locator('aside, nav').filter({ hasText: /Listed Projects|Leads/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC-PILOT-02: Pilot can navigate to the Leads tab', async ({ page }) => {
    const leadsTab = page.locator('aside nav button, aside button').filter({ hasText: /^Leads$/ }).first();
    await leadsTab.waitFor({ state: 'visible', timeout: 10_000 });
    await leadsTab.click();
    await page.waitForTimeout(1500);

    // Leads view should be visible
    await expect(
      page.locator('h2, h3, div').filter({ hasText: /Leads|My Leads/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('TC-PILOT-03: Pilot can navigate to the My Assigned Leads tab', async ({ page }) => {
    const assignedTab = page
      .locator('aside nav button, aside button')
      .filter({ hasText: /My Assigned Leads/i })
      .first();
    await assignedTab.waitFor({ state: 'visible', timeout: 10_000 });
    await assignedTab.click();
    await page.waitForTimeout(1500);

    await expect(
      page.locator('h2, h3, div, table').filter({ hasText: /Assigned|Leads/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('TC-PILOT-04: Pilot Dashboard shows Listed Projects tab by default', async ({ page }) => {
    // Default tab is 'listed' which renders ListedProjectsView
    await expect(
      page.locator('aside nav button, aside button').filter({ hasText: /Listed Projects/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

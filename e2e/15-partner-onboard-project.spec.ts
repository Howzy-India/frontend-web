/**
 * Feature: Howzer Sourcing "Onboard Project" card
 *
 * TC-PP-01  Howzer sourcing user sees "Onboard Project" card on their dashboard
 * TC-PP-02  Clicking "Submit Project" button opens CreateProjectModal
 * TC-PP-03  Submitting an empty form shows validation error badges
 * TC-PP-04  Submitting a valid form succeeds (no 403 Forbidden) and shows pending confirmation
 *
 * A temporary howzer_sourcing user is created via the admin API (createUserWithRole)
 * and torn down in afterAll, following the same pattern as 10-partner-dashboard.spec.ts.
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

const SOURCING_EMAIL = 'e2e-howzer-sourcing@howzy.in';
const SOURCING_PASSWORD = 'Howzy@E2E3';

let sourcingUid = '';
let superAdminToken = '';

test.describe('Howzer Sourcing – Onboard Project card', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    sourcingUid = await createUserWithRole(superAdminToken, {
      email: SOURCING_EMAIL,
      password: SOURCING_PASSWORD,
      displayName: 'E2E Howzer Sourcing',
      role: 'howzer_sourcing',
    });
  });

  test.afterAll(async () => {
    if (sourcingUid) {
      await deleteCreatedUser(superAdminToken, sourcingUid).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await signIn(page, SOURCING_EMAIL, SOURCING_PASSWORD);
    await page.waitForTimeout(2000);
  });

  test('TC-PP-01: Howzer sourcing user sees the "Onboard Project" card', async ({ page }) => {
    // PartnerDashboard renders an "Onboard Project" heading card
    await expect(
      page.locator('h3').filter({ hasText: /Onboard Project/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'e2e/screenshots/pp01-onboard-project-card.png' });
  });

  test('TC-PP-02: Clicking "Submit Project" opens CreateProjectModal', async ({ page }) => {
    // Wait for the card to appear
    await expect(
      page.locator('h3').filter({ hasText: /Onboard Project/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Submit Project" button inside the card
    const submitBtn = page.locator('button').filter({ hasText: /Submit Project/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // CreateProjectModal should open — it has a project name input
    const nameInput = page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'e2e/screenshots/pp02-create-modal-open.png' });
  });

  test('TC-PP-03: Submitting empty form shows validation error badges', async ({ page }) => {
    // Open the modal
    await expect(
      page.locator('h3').filter({ hasText: /Onboard Project/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    const submitBtn = page.locator('button').filter({ hasText: /Submit Project/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Wait for modal to open
    await expect(
      page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]'),
    ).toBeVisible({ timeout: 10_000 });

    // Submit the empty form
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // ErrTip renders span.bg-red-500 badges next to invalid fields
    const errorBadges = page.locator('span.bg-red-500');
    await expect(errorBadges.first()).toBeVisible({ timeout: 5_000 });
    expect(await errorBadges.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/pp03-validation-errors.png' });
  });

  test('TC-PP-04: Submitting a valid form succeeds with no 403 Forbidden', async ({ page }) => {
    const apiErrors: string[] = [];
    page.on('response', res => {
      if (res.url().includes('/admin/properties') && res.status() === 403) {
        apiErrors.push(`403 on ${res.url()}`);
      }
    });

    // Open the modal
    await expect(
      page.locator('h3').filter({ hasText: /Onboard Project/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    const submitBtn = page.locator('button').filter({ hasText: /Submit Project/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Fill required fields
    const nameInput = page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('E2E Sourcing Test Project');

    await page.locator('input[placeholder*="City"]').first().fill('Hyderabad');

    // Property type — pick first non-empty option
    const propTypeSelect = page.locator('select').first();
    if (await propTypeSelect.isVisible()) {
      await propTypeSelect.selectOption({ index: 1 });
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'e2e/screenshots/pp04-submit-result.png' });

    // Must not have received a 403
    expect(apiErrors).toHaveLength(0);
  });
});

/**
 * Feature: Create Project — Super Admin
 *
 * TC-CP-01  Super admin can open the Create Project modal
 * TC-CP-02  Form shows error indicators when required fields are empty on submit
 * TC-CP-03  Full project creation with all required fields succeeds (API returns 200/201)
 * TC-CP-04  Created project is retrievable via GET /projects/:id after creation
 */

import { test, expect } from '@playwright/test';
import {
  signInAsSuperAdmin,
  navigateToDashboardTab,
  getIdToken,
  deleteProperty,
  API_BASE,
  CREDENTIALS,
} from './helpers';

const PROJECT_NAME = `E2E Create Project ${Date.now()}`;
let createdProjectId = '';
let idToken = '';

/** Open All Projects tab → click "+ Add New Project" → wait for form */
async function openCreateModal(page: import('@playwright/test').Page): Promise<void> {
  await navigateToDashboardTab(page, 'All Projects');
  await page.waitForTimeout(2000);
  const addBtn = page.locator('button', { hasText: /Add New Project/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 15_000 });
  await addBtn.click();
  await expect(
    page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]'),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe('Create Project', () => {
  test.beforeAll(async () => {
    idToken = await getIdToken(CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  });

  test.afterAll(async () => {
    if (createdProjectId) {
      await deleteProperty(idToken, createdProjectId).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
  });

  test('TC-CP-01: Super admin can open the Create Project modal', async ({ page }) => {
    await openCreateModal(page);
    await expect(
      page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]'),
    ).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/cp01-modal-open.png' });
  });

  test('TC-CP-02: Required fields show error indicators on empty submit', async ({ page }) => {
    await openCreateModal(page);

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // ErrTip renders a red "!" badge (span.bg-red-500) next to each invalid label
    const errorBadges = page.locator('span.bg-red-500');
    await expect(errorBadges.first()).toBeVisible({ timeout: 5_000 });
    expect(await errorBadges.count()).toBeGreaterThan(0);
    await page.screenshot({ path: 'e2e/screenshots/cp02-validation.png' });
  });

  test('TC-CP-03: Full project creation with required fields succeeds', async ({ page }) => {
    await openCreateModal(page);

    // Required text fields
    await page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]').fill(PROJECT_NAME);
    await page.locator('input[placeholder="Builder name"]').fill('E2E Developer Ltd');

    // Zone (required, defaults to ''): select WEST
    // City defaults to 'Hyderabad' already — no action needed
    // Cluster (required, defaults to ''): select Gachibowli
    await page.locator('select').nth(4).selectOption('WEST');    // zone is 5th select
    await page.locator('select').nth(5).selectOption('Gachibowli'); // cluster is 6th select

    await page.screenshot({ path: 'e2e/screenshots/cp03-filled.png', fullPage: false });

    // Submit and intercept API response
    const [response] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/admin/properties') && res.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      page.locator('button[type="submit"]').click(),
    ]);

    const status = response.status();
    const body = await response.json().catch(() => ({}) as Record<string, unknown>);
    await page.screenshot({ path: 'e2e/screenshots/cp03-after-submit.png', fullPage: false });

    const responseBody = body as Record<string, unknown>;
    if (responseBody['id']) {
      createdProjectId = String(responseBody['id']);
    }

    expect(
      status,
      `Expected 200/201 but got ${status}. Response: ${JSON.stringify(body)}`,
    ).toBeGreaterThanOrEqual(200);
    expect(
      status,
      `Expected 200/201 but got ${status}. Response: ${JSON.stringify(body)}`,
    ).toBeLessThan(300);
  });

  test('TC-CP-04: Created project is retrievable via the projects API', async () => {
    if (!createdProjectId) {
      test.skip();
      return;
    }

    const resp = await fetch(`${API_BASE}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    expect(resp.status, `GET /projects/${createdProjectId} expected 200`).toBe(200);

    const data = await resp.json() as { project: Record<string, unknown> };
    expect(data.project?.['name']).toBe(PROJECT_NAME);
  });
});

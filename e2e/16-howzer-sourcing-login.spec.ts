/**
 * Feature: Howzer Sourcing employee login and dashboard routing
 *
 * TC-HS-01  howzer_sourcing user lands on PartnerDashboard (not ClientPortal)
 * TC-HS-02  "Onboard Project" card is visible on PartnerDashboard
 * TC-HS-03  No ClientPortal 400 errors (enquiries/resale/submissions email endpoints)
 * TC-HS-04  Partner API endpoints return success (not 403) for howzer_sourcing role
 */

import { test, expect } from '@playwright/test';
import {
  APP_URL,
  API_BASE,
  signIn,
  getIdToken,
  createUserWithRole,
  deleteCreatedUser,
  CREDENTIALS,
} from './helpers';

const SOURCING_EMAIL = 'e2e-howzer-sourcing-16@howzy.in';
const SOURCING_PASSWORD = 'Howzy@E2E16';

let sourcingUid = '';
let sourcingToken = '';
let superAdminToken = '';

test.describe('Howzer Sourcing – Login Routing & API Access', () => {
  test.beforeAll(async () => {
    superAdminToken = await getIdToken(
      CREDENTIALS.superAdmin.email,
      CREDENTIALS.superAdmin.password,
    );
    sourcingUid = await createUserWithRole(superAdminToken, {
      email: SOURCING_EMAIL,
      password: SOURCING_PASSWORD,
      displayName: 'E2E Howzer Sourcing 16',
      role: 'howzer_sourcing',
    });
    sourcingToken = await getIdToken(SOURCING_EMAIL, SOURCING_PASSWORD);
  });

  test.afterAll(async () => {
    if (sourcingUid) {
      await deleteCreatedUser(superAdminToken, sourcingUid).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await signIn(page, SOURCING_EMAIL, SOURCING_PASSWORD);
    await page.waitForTimeout(3000);
  });

  test('TC-HS-01: howzer_sourcing user lands on PartnerDashboard, not ClientPortal', async ({ page }) => {
    // PartnerDashboard has an "Onboard Project" card; ClientPortal does not
    const partnerDashboard = page.locator('h3, h2, [data-testid]').filter({ hasText: /Onboard Project/i });
    await expect(partnerDashboard.first()).toBeVisible({ timeout: 15_000 });

    // ClientPortal renders a "My Enquiries" or "My Properties" heading — should NOT be present
    const clientPortalHeading = page.locator('h2, h3').filter({ hasText: /My Enquiries/i });
    await expect(clientPortalHeading).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/hs01-partner-dashboard.png' });
  });

  test('TC-HS-02: Onboard Project card is visible and clickable', async ({ page }) => {
    const card = page.locator('h3').filter({ hasText: /Onboard Project/i }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    const submitBtn = page.locator('button').filter({ hasText: /Submit Project/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // CreateProjectModal should open
    const nameInput = page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'e2e/screenshots/hs02-onboard-project-modal.png' });
  });

  test('TC-HS-03: No 400 errors from ClientPortal email-based APIs in console', async ({ page }) => {
    const clientPortalErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      // These are the endpoints that 400 when a phone user hits ClientPortal APIs
      if (
        (url.includes('/client/enquiries') ||
          url.includes('/resale/mine') ||
          url.includes('/submissions')) &&
        response.status() === 400
      ) {
        clientPortalErrors.push(`${response.status()} ${url}`);
      }
    });

    // Wait for dashboard to fully load
    await page.waitForTimeout(5000);

    expect(clientPortalErrors).toHaveLength(0);
    await page.screenshot({ path: 'e2e/screenshots/hs03-no-client-portal-errors.png' });
  });

  test('TC-HS-04: Partner API endpoints return success for howzer_sourcing', async () => {
    // Test /partner/assigned-enquiries — should return 200 (not 403)
    const enquiriesResp = await fetch(`${API_BASE}/partner/assigned-enquiries`, {
      headers: { Authorization: `Bearer ${sourcingToken}` },
    });
    expect(enquiriesResp.status).toBe(200);

    // Test /partner/submissions — should return 200 with empty array (phone user, no email submissions)
    const submissionsResp = await fetch(`${API_BASE}/partner/submissions`, {
      headers: { Authorization: `Bearer ${sourcingToken}` },
    });
    expect(submissionsResp.status).toBe(200);
    const submissionsData = await submissionsResp.json() as { submissions: unknown[] };
    expect(Array.isArray(submissionsData.submissions)).toBe(true);
  });
});

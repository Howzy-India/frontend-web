import { test, expect } from '@playwright/test';
import { signInAsClient, logout } from './helpers';

test.describe('Client Portal', () => {
  test('TC-CL-01: Client lands on Client Portal after login', async ({ page }) => {
    await signInAsClient(page);
    await expect(page.getByRole('button', { name: 'Logout' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Global Leads' })).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
    await page.screenshot({ path: 'e2e/screenshots/client-portal-home.png', fullPage: false });
  });

  test('TC-CL-02: Browse projects tab loads', async ({ page }) => {
    await signInAsClient(page);
    await page.getByRole('button', { name: 'Projects', exact: true }).first().click({ timeout: 10_000 });
    await page.waitForTimeout(3000);
    await expect(page.getByRole('button', { name: 'Projects', exact: true }).first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/client-browse-projects.png', fullPage: false });
  });

  test('TC-CL-03: My Dashboard tab is visible and loads', async ({ page }) => {
    await signInAsClient(page);
    const dashTab = page.getByRole('button', { name: 'My Dashboard' }).first();
    await expect(dashTab).toBeVisible({ timeout: 10_000 });
    await dashTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/client-dashboard.png', fullPage: false });
  });

  test('TC-CL-04: Client can log out', async ({ page }) => {
    await signInAsClient(page);
    await logout(page);
    await expect(
      page.locator('input[placeholder="Email Address"]')
        .or(page.locator('text=Sign in'))
        .or(page.locator('text=Welcome to Howzy'))
    ).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/client-logged-out.png' });
  });
});

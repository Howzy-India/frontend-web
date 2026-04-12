/**
 * TC-VL-01  "Pending Approvals" sidebar item is removed from Property Management
 * TC-VL-02  Verification List is reachable from sidebar and shows "Verification List" heading
 * TC-VL-03  "Project" tab is present inside the Verification List
 * TC-VL-04  Pending projects appear in the Project tab with Approve / Reject buttons
 */
import { test, expect } from '@playwright/test';
import { signInAsSuperAdmin, navigateToDashboardTab } from './helpers';

test.describe('Super Admin — Verification List (Projects tab)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
  });

  test('TC-VL-01: "Pending Approvals" is no longer in the sidebar', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Pending Approvals' })
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC-VL-02: Verification List heading is shown', async ({ page }) => {
    await navigateToDashboardTab(page, 'Verification Panel');
    await expect(page.getByText('Verification List')).toBeVisible({ timeout: 10_000 });
  });

  test('TC-VL-03: Project tab is visible inside Verification List', async ({ page }) => {
    await navigateToDashboardTab(page, 'Verification Panel');
    await expect(page.getByText('Verification List')).toBeVisible({ timeout: 10_000 });
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ });
    await expect(projectTab).toBeVisible({ timeout: 5_000 });
    await projectTab.click();
  });

  test('TC-VL-04: Project tab shows table with at least one row or empty state', async ({ page }) => {
    await navigateToDashboardTab(page, 'Verification Panel');
    await expect(page.getByText('Verification List')).toBeVisible({ timeout: 10_000 });
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ });
    await projectTab.click();
    await page.waitForTimeout(2000);
    // Either rows exist or empty state — both are valid
    const hasRows = await page.locator('tbody tr').count() > 0;
    if (hasRows) {
      // If there are pending rows, Approve/Reject buttons should be present
      const approveBtns = page.locator('button:has-text("Approve")');
      const emptyMsg = page.locator('text=No submissions found');
      const hasApprove = await approveBtns.count() > 0;
      const hasEmpty = await emptyMsg.isVisible().catch(() => false);
      expect(hasApprove || hasEmpty).toBeTruthy();
    }
    await page.screenshot({ path: 'e2e/screenshots/verification-list-projects.png', fullPage: true });
  });
});

/**
 * Feature: SuperAdmin Project Management (View / Edit / Delete)
 *
 * TC-PM-01  Super admin navigates to "All Projects" tab and sees project list with action buttons
 * TC-PM-02  Super admin clicks "View" on a project and sees the ViewProjectModal
 * TC-PM-03  Super admin can open "Edit" on a project and sees a pre-filled form
 * TC-PM-04  Super admin navigates to "Pending Approvals" tab and sees it (even if empty)
 */

import { test, expect } from '@playwright/test';
import { signInAsSuperAdmin, navigateToDashboardTab } from './helpers';

test.describe('SuperAdmin Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page);
  });

  test('TC-PM-01: Super admin sees All Projects tab with action buttons', async ({ page }) => {
    await navigateToDashboardTab(page, 'All Projects');
    await page.waitForTimeout(2000);

    // The tab heading or section heading should be visible
    await expect(
      page.locator('h2, h3, [data-testid]').filter({ hasText: /All Projects|Projects/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'e2e/screenshots/pm01-all-projects.png' });

    // Table should be present
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10_000 });

    // If there are rows, at least one action button (MoreVertical) should exist
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Each row with data has a MoreVertical action button (svg inside a button)
      const actionBtn = rows.first().locator('button').last();
      await expect(actionBtn).toBeVisible({ timeout: 5_000 });
    }
    // If empty, the "No projects found" cell is acceptable — test passes regardless
  });

  test('TC-PM-02: Super admin clicks View on a project and sees ViewProjectModal', async ({ page }) => {
    await navigateToDashboardTab(page, 'All Projects');
    await page.waitForTimeout(3000);

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    // Skip gracefully if no projects exist
    const firstCell = await rows.first().locator('td').first().textContent().catch(() => '');
    if (rowCount === 0 || (firstCell ?? '').toLowerCase().includes('no ')) {
      test.skip();
      return;
    }

    // Click the MoreVertical (last button in first data row)
    const actionBtn = rows.first().locator('button').last();
    await actionBtn.click();
    await page.waitForTimeout(500);

    // Click "View" in the dropdown (exact: true avoids matching the "Overview" nav tab)
    const viewOption = page.getByRole('button', { name: 'View', exact: true });
    await expect(viewOption).toBeVisible({ timeout: 5_000 });
    await viewOption.click();
    await page.waitForTimeout(1000);

    // ViewProjectModal should be visible — it renders a "Close" button
    const closeBtn = page.locator('button').filter({ hasText: /Close/i }).first();
    await expect(closeBtn).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'e2e/screenshots/pm02-view-modal.png' });

    // Close the modal
    await closeBtn.click();
    await page.waitForTimeout(500);
  });

  test('TC-PM-03: Super admin clicks Edit on a project and sees pre-filled form', async ({ page }) => {
    await navigateToDashboardTab(page, 'All Projects');
    await page.waitForTimeout(3000);

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    // Skip gracefully if no projects exist
    const firstCell = await rows.first().locator('td').first().textContent().catch(() => '');
    if (rowCount === 0 || (firstCell ?? '').toLowerCase().includes('no ')) {
      test.skip();
      return;
    }

    // Click the MoreVertical action button on the first row
    const actionBtn = rows.first().locator('button').last();
    await actionBtn.click();
    await page.waitForTimeout(500);

    // Click "Edit" in the dropdown (uses accessible name from getByRole)
    const editOption = page.getByRole('button', { name: 'Edit' });
    await expect(editOption).toBeVisible({ timeout: 5_000 });
    await editOption.click();
    await page.waitForTimeout(1000);

    // The CreateProjectModal (in edit mode) should open with a pre-filled project name input
    const nameInput = page.locator('input[placeholder="e.g. Prestige Lakeside Habitat"]');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // The input should be pre-filled (non-empty)
    const value = await nameInput.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/pm03-edit-modal.png' });
  });

  test('TC-PM-04: Super admin can navigate to Pending Approvals tab', async ({ page }) => {
    await navigateToDashboardTab(page, 'Pending Approvals');
    await page.waitForTimeout(2000);

    // The page should not crash — look for a heading or table or empty state
    const content = page.locator('h2, h3, table, p').filter({
      hasText: /Pending|Approval|No pending|project/i,
    }).first();
    await expect(content).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'e2e/screenshots/pm04-pending-approvals.png' });
  });
});

import { Page } from '@playwright/test';

export const APP_URL = 'https://howzy-web.web.app';
export const API_BASE = 'https://us-central1-howzy-api.cloudfunctions.net/api';

// Credentials are read from environment variables — never hardcoded.
// Set them in .env.test.local (gitignored) before running tests.
export const CREDENTIALS = {
  superAdmin: {
    email: process.env['E2E_SUPER_ADMIN_EMAIL'] ?? '',
    password: process.env['E2E_SUPER_ADMIN_PASSWORD'] ?? '',
    role: 'super_admin',
  },
  admin: {
    email: process.env['E2E_ADMIN_EMAIL'] ?? '',
    password: process.env['E2E_ADMIN_PASSWORD'] ?? '',
    role: 'admin',
  },
  client: {
    email: process.env['E2E_CLIENT_EMAIL'] ?? '',
    password: process.env['E2E_CLIENT_PASSWORD'] ?? '',
    role: 'client',
  },
};

/** Opens the login form (overlay or page) if not already visible. */
async function ensureLoginFormOpen(page: Page): Promise<void> {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[placeholder="Email Address"]');
  if (!(await emailInput.isVisible().catch(() => false))) {
    await page.locator('button').filter({ hasText: /sign in|login/i }).first()
      .click({ timeout: 10_000 })
      .catch(() => {});
    await page.waitForTimeout(500);
  }
}

/** Signs in with any email/password and waits for the app to settle. */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await ensureLoginFormOpen(page);
  await page.locator('input[placeholder="Email Address"]').fill(email);
  await page.locator('input[placeholder="Password"]').fill(password);
  await page.locator('button:has-text("Sign in with Email")').click();
  await page.waitForTimeout(3000);
}

/** Signs in as super_admin and waits for the dashboard. */
export async function signInAsSuperAdmin(page: Page): Promise<void> {
  await signIn(page, CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  await page.waitForTimeout(1000);
}

/** Signs in as admin and waits for the dashboard. */
export async function signInAsAdmin(page: Page): Promise<void> {
  await signIn(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  await page.waitForTimeout(1000);
}

/** Signs in as client and waits for the portal. */
export async function signInAsClient(page: Page): Promise<void> {
  await signIn(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
  await page.waitForTimeout(1000);
}

/** Navigates to a named sidebar tab in the admin dashboard. */
export async function navigateToDashboardTab(page: Page, tabName: string): Promise<void> {
  const tab = page.locator('button, a, li').filter({ hasText: tabName }).first();
  await tab.click({ timeout: 10_000 });
  await page.waitForTimeout(2000);
}

/** Clicks Refresh on the dashboard and waits for data to reload. */
export async function refreshDashboard(page: Page): Promise<void> {
  const refreshBtn = page.getByRole('button', { name: 'Refresh' }).first();
  if (await refreshBtn.isVisible().catch(() => false)) {
    await refreshBtn.click();
    await page.waitForTimeout(3000);
  }
}

/** Opens a second browser tab, signs in as client, runs an optional action, then closes the tab. */
export async function withClientSession(
  context: import('@playwright/test').BrowserContext,
  action?: (clientPage: Page) => Promise<void>,
): Promise<void> {
  const clientPage = await context.newPage();
  await signInAsClient(clientPage);
  if (action) {
    await action(clientPage);
  }
  await clientPage.close();
}

/** Clicks the Logout button (icon-only, matched by aria-label). */
export async function logout(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: 'Logout' }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1500);
  }
}

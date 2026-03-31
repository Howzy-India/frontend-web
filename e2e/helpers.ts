// Shared test helpers and credentials
export const CREDENTIALS = {
  superAdmin: { email: 'super_admin@howzy.in', password: 'Howzy@123', role: 'super_admin' },
  admin:      { email: 'admin@howzy.in',       password: 'Howzy@123', role: 'admin' },
  client:     { email: 'client@howzy.in',      password: 'Howzy@123', role: 'client' },
};

export const APP_URL = 'https://howzy-web.web.app';
export const API_BASE = 'https://us-central1-howzy-api.cloudfunctions.net/api';

/**
 * Signs in via the email/password form on the page.
 * Waits for the login overlay to appear and fills in credentials.
 */
import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, creds: { email: string; password: string }) {
  // Click login button if overlay isn't already open
  const overlay = page.locator('[data-testid="login-overlay"], form').filter({ hasText: /sign in|log in/i }).first();
  const loginBtn = page.locator('button').filter({ hasText: /sign in|log in|login/i }).first();

  if (!(await overlay.isVisible().catch(() => false))) {
    await loginBtn.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
}

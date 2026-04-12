import { Page } from '@playwright/test';

export const APP_URL = 'https://howzy-web.web.app';
export const API_BASE = process.env['E2E_API_BASE'] ?? 'https://us-central1-howzy-api.cloudfunctions.net/api';
const FIREBASE_API_KEY = process.env['E2E_FIREBASE_API_KEY'] ?? '';

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

/**
 * Signs in programmatically by injecting a Firebase auth token into IndexedDB.
 * This bypasses the phone-OTP UI, which cannot be automated without test phone numbers.
 * Requires the user account to have email+password auth enabled in Firebase.
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  // 1. Get credentials via Firebase REST API
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!resp.ok) {
    throw new Error(`Firebase REST signIn failed: ${resp.status} ${await resp.text()}`);
  }
  interface FirebaseSignInResponse {
    localId: string;
    email: string;
    displayName?: string;
    registered?: boolean;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  }
  const data = await resp.json() as FirebaseSignInResponse;

  // 2. Navigate to the app (establishes the origin so IndexedDB is accessible)
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 3. Inject into Firebase's IndexedDB persistence store
  await page.evaluate(
    ({ apiKey, authUser }: { apiKey: string; authUser: unknown }) => {
      const IDB_DB = 'firebaseLocalStorageDb';
      const IDB_STORE = 'firebaseLocalStorage';
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
      return new Promise<void>((resolve, reject) => {
        const openReq = indexedDB.open(IDB_DB);
        openReq.onupgradeneeded = () => {
          openReq.result.createObjectStore(IDB_STORE, { keyPath: 'fbase_key' });
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put({ fbase_key: key, value: authUser });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    },
    {
      apiKey: FIREBASE_API_KEY,
      authUser: {
        uid: data.localId,
        email: data.email,
        emailVerified: data.registered ?? false,
        displayName: data.displayName ?? null,
        isAnonymous: false,
        photoURL: null,
        providerData: [
          {
            providerId: 'password',
            uid: data.email,
            displayName: data.displayName ?? null,
            email: data.email,
            phoneNumber: null,
            photoURL: null,
          },
        ],
        stsTokenManager: {
          refreshToken: data.refreshToken,
          accessToken: data.idToken,
          expirationTime: Date.now() + Number(data.expiresIn) * 1000,
        },
        createdAt: String(Date.now()),
        lastLoginAt: String(Date.now()),
        apiKey: FIREBASE_API_KEY,
        appName: '[DEFAULT]',
      },
    },
  );

  // 4. Reload so the app reads the injected auth state
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
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

/** Opens an isolated browser context, signs in as client, runs an optional action, then closes it. */
export async function withClientSession(
  browser: import('@playwright/test').Browser,
  action?: (clientPage: Page) => Promise<void>,
): Promise<void> {
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await signInAsClient(clientPage);
  if (action) {
    await action(clientPage);
  }
  await clientContext.close();
}

/** Clicks the Logout button (icon-only, matched by aria-label). */
export async function logout(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: 'Logout' }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1500);
  }
}

// ── API helpers for test data seeding ──────────────────────────────────────

/** Returns a Firebase ID token for a given user. */
export async function getIdToken(email: string, password: string): Promise<string> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!resp.ok) {
    throw new Error(`Firebase signIn failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as { idToken: string };
  return data.idToken;
}

/** Creates a property via the admin API and returns its id. */
export async function seedProperty(
  idToken: string,
  payload: {
    name: string;
    location?: string;
    developerName?: string;
    propertyType: 'project' | 'plot' | 'farmland';
    projectType?: string;
  },
): Promise<string> {
  const resp = await fetch(`${API_BASE}/admin/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(`seedProperty failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as { id: string };
  return data.id;
}

/** Deletes a property by id via the admin API. */
export async function deleteProperty(idToken: string, id: string): Promise<void> {
  await fetch(`${API_BASE}/admin/properties/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

/** Creates an enquiry via the public API and returns its id. */
export async function seedEnquiry(payload: {
  client_name: string;
  email: string;
  phone?: string;
  property_id?: string;
  property_name?: string;
  property_type?: string;
  location?: string;
  enquiry_type?: string;
}): Promise<string> {
  const resp = await fetch(`${API_BASE}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, source: 'e2e-test' }),
  });
  if (!resp.ok) {
    throw new Error(`seedEnquiry failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as { id: string };
  return data.id;
}

/** Updates enquiry status to 'Cancelled' to "soft-delete" a test enquiry. */
export async function cancelEnquiry(idToken: string, id: string): Promise<void> {
  await fetch(`${API_BASE}/enquiries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ status: 'Cancelled' }),
  }).catch(() => {});
}

/** Creates a lead via the public API and returns its id. */
export async function seedLead(payload: {
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  city?: string;
  budget?: string;
  location_preferred?: string;
  looking_bhk?: string;
  milestone?: string;
  propertyType?: string;
}): Promise<string> {
  const contact = payload.contact ?? payload.phone ?? payload.email ?? '';
  const location_preferred = payload.location_preferred ?? payload.city ?? '';
  const resp = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      budget: payload.budget ?? '',
      contact,
      location_preferred,
      looking_bhk: payload.looking_bhk ?? '',
      milestone: payload.milestone ?? 'Initial',
      campaign_source: 'e2e-test',
    }),
  });
  if (!resp.ok) {
    throw new Error(`seedLead failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as { id: string };
  return data.id;
}

/** Creates a user with any role via the admin API, returns uid. */
export async function createUserWithRole(
  idToken: string,
  payload: { email: string; password: string; displayName: string; role: string },
): Promise<string> {
  const resp = await fetch(`${API_BASE}/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(`createUserWithRole failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as { uid: string };
  return data.uid;
}

/** Deletes a user provisioned via createUserWithRole. */
export async function deleteCreatedUser(idToken: string, uid: string): Promise<void> {
  await fetch(`${API_BASE}/admin/create-user/${uid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  }).catch(() => {});
}

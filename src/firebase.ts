// Firebase app config for howzy-api project
// The frontend (howzy-web hosting) connects to howzy-api for Auth, Firestore, Functions, and Storage.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard against double-init in HMR/dev
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

/** Creates an invisible reCAPTCHA verifier attached to the given DOM element id. */
// Module-level cache so we only ever have one verifier alive at a time.
let _recaptchaVerifier: RecaptchaVerifier | null = null;

export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  // Clear any previous verifier before creating a new one to avoid
  // Firebase treating multiple instances as abuse (auth/too-many-requests).
  if (_recaptchaVerifier) {
    try { _recaptchaVerifier.clear(); } catch { /* ignore */ }
    _recaptchaVerifier = null;
  }
  _recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return _recaptchaVerifier;
}

/** Clear the cached verifier (call after OTP sent or on auth error). */
export function clearRecaptchaVerifier() {
  if (_recaptchaVerifier) {
    try { _recaptchaVerifier.clear(); } catch { /* ignore */ }
    _recaptchaVerifier = null;
  }
}

export default app;

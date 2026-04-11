import { useState, useEffect, useRef } from 'react';
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, createRecaptchaVerifier, clearRecaptchaVerifier, functions } from '../firebase';

export type AppRole = 'super_admin' | 'admin' | 'sales_agent' | 'sourcing_agent' | 'client' | null;

export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  /** Name from Firestore profile — prefers over Firebase Auth displayName for phone-OTP users */
  name: string | null;
  photoURL: string | null;
  role: AppRole;
  idToken: string;
}

/**
 * Returns the current Firebase ID token (force-refreshes if needed).
 * Call this before any authenticated API request.
 */
export const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
};

const toAuthUser = async (firebaseUser: User, profileName?: string | null): Promise<AuthUser> => {
  // Force-refresh so we always get the latest custom claims from DB sync
  const tokenResult = await firebaseUser.getIdTokenResult(true);
  const role = (tokenResult.claims.role as AppRole) ?? 'client';
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    phoneNumber: firebaseUser.phoneNumber,
    displayName: firebaseUser.displayName,
    // Prefer Firestore name (covers phone-OTP users where Auth displayName may be null)
    name: profileName ?? firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role,
    idToken: tokenResult.token,
  };
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          setUser(await toAuthUser(firebaseUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Step 1: Send OTP to the given phone number (E.164 format, e.g. +919876543210).
   * `recaptchaContainerId` must be the id of a DOM element to attach the invisible reCAPTCHA.
   */
  const sendOtp = async (phone: string, recaptchaContainerId: string): Promise<void> => {
    setError(null);
    setOtpLoading(true);
    try {
      const verifier = createRecaptchaVerifier(recaptchaContainerId);
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = confirmation;
      clearRecaptchaVerifier();
    } catch (err: any) {
      clearRecaptchaVerifier();
      const msg = err?.message ?? 'Failed to send OTP';
      setError(msg);
      throw err;
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Step 2: Verify the OTP, then sync role from Firestore DB via Cloud Function.
   * The syncUserRole function reads users/{uid}, sets/confirms custom claims,
   * and returns the DB-assigned role. Token is force-refreshed after.
   */
  const verifyOtp = async (otp: string): Promise<AuthUser> => {
    setError(null);
    setOtpLoading(true);
    try {
      if (!confirmationRef.current) throw new Error('No OTP sent yet. Please request OTP first.');
      const result = await confirmationRef.current.confirm(otp);
      confirmationRef.current = null;

      // Sync role from DB — sets/confirms custom claims server-side
      // Also returns profile with name for phone-OTP users (displayName may be null in Auth)
      let profileName: string | null = null;
      try {
        const syncUserRole = httpsCallable<unknown, { role: string; profile?: { name?: string } }>(functions, 'syncUserRole');
        const syncResult = await syncUserRole({});
        profileName = syncResult.data?.profile?.name ?? null;
      } catch {
        // Non-critical: role defaults to 'client' if sync fails
      }

      // Reload Firebase Auth user to pick up any displayName update from sync
      await result.user.reload();

      // Force-refresh token to pick up freshly-set custom claim
      const authUser = await toAuthUser(result.user, profileName);
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      const msg = err?.message ?? 'OTP verification failed';
      setError(msg);
      throw err;
    } finally {
      setOtpLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    confirmationRef.current = null;
  };

  return { user, loading, otpLoading, error, sendOtp, verifyOtp, logout };
}

import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export type AppRole = 'super_admin' | 'admin' | 'agent' | 'partner' | 'client' | null;

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Force refresh to get latest custom claims (role)
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const role = (tokenResult.claims.role as AppRole) ?? 'client';
          const idToken = tokenResult.token;
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role,
            idToken,
          });
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

  const signInWithGoogle = async (): Promise<AuthUser> => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const tokenResult = await result.user.getIdTokenResult(true);
      const role = (tokenResult.claims.role as AppRole) ?? 'client';
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role,
        idToken: tokenResult.token,
      };
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      const msg = err?.message ?? 'Sign-in failed';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return { user, loading, error, signInWithGoogle, logout };
}

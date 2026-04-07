import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type LookingFor =
  | 'New Property'
  | 'Lands'
  | 'Villas'
  | 'ReSale Properties'
  | 'Commercial Properties';

export interface ClientProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  lookingFor: LookingFor[];
  contactTime: string;
  createdAt?: unknown;
}

/** Partially updates name and/or contactTime without overwriting other fields. */
export async function updateClientProfile(
  uid: string,
  data: { name?: string; contactTime?: string },
): Promise<void> {
  const now = serverTimestamp();
  await updateDoc(doc(db, 'client_profiles', uid), { ...data, updatedAt: now });
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: now });
}

export async function getClientProfile(uid: string): Promise<ClientProfile | null> {
  const snap = await getDoc(doc(db, 'client_profiles', uid));
  if (!snap.exists()) return null;
  return snap.data() as ClientProfile;
}

/**
 * Creates or overwrites the client profile document.
 * Also updates the users/{uid} doc with demographics so the DB is
 * the single source of truth for all user data.
 */
export async function saveClientProfile(
  uid: string,
  data: Omit<ClientProfile, 'uid' | 'createdAt'>,
): Promise<void> {
  const now = serverTimestamp();

  // Write to client_profiles (detailed client-specific data)
  await setDoc(doc(db, 'client_profiles', uid), {
    ...data,
    uid,
    createdAt: now,
  });

  // Also sync demographics into users/{uid} (role-authoritative collection)
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      name: data.name,
      phone: data.phone,
      email: data.email,
      lookingFor: data.lookingFor,
      contactTime: data.contactTime,
      role: 'client',
      status: 'active',
      updatedAt: now,
    },
    { merge: true },
  );
}

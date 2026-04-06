import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

/** Returns the stored profile for a given uid, or null if not found. */
export async function getClientProfile(uid: string): Promise<ClientProfile | null> {
  const snap = await getDoc(doc(db, 'client_profiles', uid));
  if (!snap.exists()) return null;
  return snap.data() as ClientProfile;
}

/** Creates or overwrites the profile document for the given uid. */
export async function saveClientProfile(
  uid: string,
  data: Omit<ClientProfile, 'uid' | 'createdAt'>,
): Promise<void> {
  await setDoc(doc(db, 'client_profiles', uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
  });
}

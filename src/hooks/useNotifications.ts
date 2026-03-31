import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  room?: string; // 'pilot' | 'admin' | 'partner' | '{email}'
  read: boolean;
  createdAt: string | null;
}

/**
 * Subscribes to real-time notifications from Firestore for a given room.
 * Replaces Socket.IO new-notification events.
 *
 * rooms:
 *   'pilot'   → agent notifications
 *   'admin'   → admin notifications
 *   'partner' → partner notifications
 *   '{email}' → client personal notifications (enquiry status updates)
 */
export function useNotifications(room: string | null, maxItems = 20) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!room) return;

    const q = query(
      collection(db, 'notifications'),
      where('room', '==', room),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AppNotification[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type ?? 'info',
            message: data.message ?? '',
            room: data.room,
            read: data.read ?? false,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
          };
        });
        setNotifications(items);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          setNotifications([]);
          return;
        }
        console.error('notifications listener failed', error);
      }
    );

    return unsubscribe;
  }, [room, maxItems]);

  return notifications;
}

/**
 * Subscribes to enquiry status updates for a specific client email.
 * Replaces Socket.IO 'enquiry-status-update' event.
 */
export function useEnquiryUpdates(email: string | null) {
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!email) return;

    const q = query(
      collection(db, 'enquiry_timeline'),
      where('created_by', '==', email),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() ?? null,
        }));
        setUpdates(items);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          setUpdates([]);
          return;
        }
        console.error('enquiry updates listener failed', error);
      }
    );

    return unsubscribe;
  }, [email]);

  return updates;
}

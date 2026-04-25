import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload a file to Firebase Storage with real-time progress reporting.
 * Returns the public download URL on success; rejects with the underlying
 * Firebase error (with `code` and `message`) on failure.
 */
export async function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const r = storageRef(storage, path);
  const task = uploadBytesResumable(r, file, { contentType: file.type || undefined });
  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.min(100, Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
          onProgress(pct);
        }
      },
      (err) => {
        console.error('[uploadFileWithProgress] failed', { path, code: err.code, message: err.message });
        reject(err);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          console.error('[uploadFileWithProgress] getDownloadURL failed', { path, err });
          reject(err);
        }
      },
    );
  });
}

/**
 * Upload a resale floor plan image / PDF and return its public URL.
 * Centralises the path convention so the storage rules and the UI agree.
 */
export function uploadResaleFloorPlan(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return uploadFileWithProgress(
    file,
    `resale/floor-plans/${Date.now()}_${file.name}`,
    onProgress,
  );
}

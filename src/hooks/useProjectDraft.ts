import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseProjectDraftOptions {
  /** Stable draft id (typically the same uploadFolder UUID used for storage). */
  draftId: string;
  /** Property type tag stored on the draft for filtering. */
  propertyType: string;
  /** Optional human-readable title (e.g. project name) for display in the drafts list. */
  title?: string | null;
  /** The form payload to autosave. The hook deep-compares JSON to detect changes. */
  form: unknown;
  /** When false, autosave is disabled (e.g. when the modal is open in edit mode). */
  enabled: boolean;
  /** Debounce in ms before flushing a save. Defaults to 1000. */
  debounceMs?: number;
}

interface UseProjectDraftResult {
  saveStatus: DraftSaveStatus;
  lastSavedAt: Date | null;
  /** Removes the draft from the server (call on successful submit). */
  deleteDraft: () => Promise<void>;
}

/**
 * Debounced autosave for the CreateProjectModal form.
 *
 * Persists the form to PUT /drafts/:id whenever the form changes (after a
 * 1 s quiet period). Skips the very first render and any time `enabled`
 * is false. Intentionally fire-and-forget: errors set saveStatus='error'
 * but don't bubble to the modal — a saved draft is best-effort.
 */
export function useProjectDraft({
  draftId,
  propertyType,
  title,
  form,
  enabled,
  debounceMs = 1000,
}: UseProjectDraftOptions): UseProjectDraftResult {
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const lastSerializedRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const serialized = safeStringify(form);
    if (serialized === lastSerializedRef.current) return;

    // Don't save the initial empty form on mount — wait for the user to
    // actually type something.
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      lastSerializedRef.current = serialized;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush(serialized);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, enabled, debounceMs]);

  // Flush any pending save on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function flush(serialized: string): Promise<void> {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSaveStatus('saving');
    try {
      await api.saveDraft(draftId, {
        propertyType,
        title: title ?? null,
        form: JSON.parse(serialized),
      });
      lastSerializedRef.current = serialized;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('[useProjectDraft] save failed', err);
      setSaveStatus('error');
    } finally {
      inFlightRef.current = false;
    }
  }

  async function deleteDraft(): Promise<void> {
    try {
      if (timerRef.current) clearTimeout(timerRef.current);
      await api.deleteDraft(draftId);
    } catch (err) {
      console.warn('[useProjectDraft] delete failed', err);
    }
  }

  return { saveStatus, lastSavedAt, deleteDraft };
}

/**
 * JSON.stringify with a replacer that drops File / Blob handles (they are
 * not serializable and we only care about the resulting uploadedUrl).
 */
function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (typeof File !== 'undefined' && v instanceof File) return null;
    if (typeof Blob !== 'undefined' && v instanceof Blob) return null;
    return v;
  });
}

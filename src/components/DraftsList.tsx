import { useEffect, useState, useCallback } from 'react';
import { FileText, Clock, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export interface DraftSummary {
  id: string;
  ownerUid: string;
  propertyType: string | null;
  title: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

interface DraftsListProps {
  /** Called when the user clicks "Resume" on a draft. The dashboard should
   *  open the CreateProjectModal with the returned draftId + form payload. */
  onResume: (draftId: string, draftForm: any) => void;
  /** Optional refresh trigger — bump this number to force a reload. */
  refreshKey?: number;
}

/**
 * Lists in-progress project drafts for the current user.
 *
 * Hidden when there are no drafts so the dashboard stays clean for anyone
 * who hasn't started an onboarding.
 */
export default function DraftsList({ onResume, refreshKey }: DraftsListProps) {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    api.listDrafts()
      .then(res => setDrafts(res.drafts ?? []))
      .catch(err => {
        console.warn('[DraftsList] failed to load drafts', err);
        setDrafts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  const handleResume = async (draft: DraftSummary) => {
    setResumingId(draft.id);
    try {
      const full = await api.getDraft(draft.id);
      onResume(draft.id, full.form);
    } catch (err) {
      console.warn('[DraftsList] failed to load draft', err);
    } finally {
      setResumingId(null);
    }
  };

  const handleDiscard = async (draft: DraftSummary) => {
    if (!window.confirm(`Discard draft "${draft.title || 'Untitled'}"? This cannot be undone.`)) return;
    setDiscardingId(draft.id);
    try {
      await api.deleteDraft(draft.id);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
    } catch (err) {
      console.warn('[DraftsList] failed to delete draft', err);
    } finally {
      setDiscardingId(null);
    }
  };

  if (loading) return null;
  if (drafts.length === 0) return null;

  return (
    <div className="bg-amber-50/40 border border-amber-200 rounded-2xl shadow-sm overflow-hidden mb-4" data-testid="drafts-list">
      <div className="p-5 border-b border-amber-200 flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-700" />
        <h3 className="text-sm font-bold text-amber-900">In-progress drafts</h3>
        <span className="text-xs text-amber-700">({drafts.length})</span>
      </div>
      <ul className="divide-y divide-amber-100">
        {drafts.map(d => (
          <li key={d.id} className="p-4 flex items-center justify-between gap-3 hover:bg-amber-100/40 transition-colors">
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{d.title?.trim() || 'Untitled draft'}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {formatLastSaved(d.updatedAt)}
                {d.propertyType && <span>· {d.propertyType.toLowerCase()}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleResume(d)}
                disabled={resumingId === d.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors"
              >
                {resumingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Resume
              </button>
              <button
                onClick={() => handleDiscard(d)}
                disabled={discardingId === d.id}
                title="Discard draft"
                className="inline-flex items-center justify-center w-7 h-7 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {discardingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatLastSaved(iso: string | null): string {
  if (!iso) return 'just now';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString();
}

import React, { useRef, useState } from 'react';
import { api } from '../services/api';

type ImportResult = {
  imported: number;
  updated: number;
  errors: Array<{ row: number; uniqueId?: string; error: string }>;
};

type Variant = 'pill' | 'card';

interface Props {
  /** Visual style – `pill` for the header of a list page, `card` for System Settings. */
  variant?: Variant;
  /** Called after a successful import so the parent can refresh its project list. */
  onImported?: () => void;
}

/**
 * Download a blob as `<filename>` in the browser.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Shared toolbar that lets a Super Admin download a CSV template, export all
 * projects to CSV, and import projects from a CSV. Backed by
 * `/admin/projects/{template,export,import}` on the API.
 */
export default function BulkProjectsToolbar({ variant = 'pill', onImported }: Props) {
  const [busy, setBusy] = useState<'template' | 'export' | 'import' | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const runDownload = async (kind: 'template' | 'export') => {
    setBusy(kind);
    setError('');
    try {
      const blob = kind === 'template'
        ? await api.getProjectsCsvTemplate()
        : await api.exportProjectsCsv();
      const filename = kind === 'template'
        ? 'projects-template.csv'
        : `projects-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, filename);
    } catch (err) {
      setError(`${kind === 'template' ? 'Template download' : 'Export'} failed: ${String(err)}`);
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('import');
    setError('');
    setResult(null);
    try {
      const text = await file.text();
      const r = await api.importProjectsCsv(text);
      setResult({ imported: r.imported, updated: r.updated, errors: r.errors });
      if (r.imported > 0 || r.updated > 0) onImported?.();
    } catch (err) {
      setError(`Import failed: ${String(err)}`);
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const pill = 'px-4 py-2.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50';
  const card = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50';
  const base = variant === 'card' ? card : pill;

  const primary = variant === 'card'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20';
  const secondary = 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700';

  return (
    <div className={variant === 'card' ? 'space-y-5' : ''}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runDownload('template')}
          disabled={busy !== null}
          className={`${base} ${secondary}`}
          title="Download a blank CSV template with one example row"
        >
          {busy === 'template' ? 'Preparing…' : '⬇ Template'}
        </button>
        <button
          type="button"
          onClick={() => void runDownload('export')}
          disabled={busy !== null}
          className={`${base} ${secondary}`}
          title="Export all active projects to CSV"
        >
          {busy === 'export' ? 'Exporting…' : '⬇ Export CSV'}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy !== null}
          className={`${base} ${primary}`}
          title="Bulk import projects from a CSV file"
        >
          {busy === 'import' ? 'Importing…' : '⬆ Import CSV'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handleImportFile(e)}
        />
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 p-4 rounded-xl bg-slate-50 text-sm space-y-1">
          <p className="font-bold text-slate-800">Import complete</p>
          <p className="text-green-700">
            Created: {result.imported}&nbsp;|&nbsp;Updated: {result.updated}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold text-red-600 mb-1">
                Errors ({result.errors.length})
              </p>
              <ul className="space-y-0.5 text-red-500 max-h-40 overflow-y-auto">
                {result.errors.map((err) => (
                  <li key={`row-${err.row}-${err.uniqueId ?? 'no-id'}`}>
                    Row {err.row}
                    {err.uniqueId ? ` (${err.uniqueId})` : ''}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

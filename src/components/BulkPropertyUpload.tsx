import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, PropertyType, ProjectType } from '../services/api';

// CSV columns aligned with api.addProperty() payload
const REQUIRED_COLUMNS = ['name', 'propertyType'] as const;
const OPTIONAL_COLUMNS = ['projectType', 'location', 'city', 'developerName', 'reraNumber', 'usp'] as const;
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;
type CsvColumn = (typeof ALL_COLUMNS)[number];

// Accept both uppercase (canonical) and lowercase (user-friendly CSV input)
const PROPERTY_TYPE_ALIAS: Record<string, PropertyType> = {
  project: 'PROJECT', projects: 'PROJECT', PROJECT: 'PROJECT',
  plot: 'PLOT', plots: 'PLOT', PLOT: 'PLOT',
  farmland: 'FARMLAND', 'farm land': 'FARMLAND', 'farm lands': 'FARMLAND', FARMLAND: 'FARMLAND',
};

const VALID_PROJECT_TYPES = [
  'GATED_SOCIETY', 'SEMI_GATED', 'STAND_ALONE', 'VILLA_COMMUNITY', 'ULTRA_LUXURY',
  // Accept legacy user-friendly labels too
  'Gated Society', 'Semi Gated', 'Stand Alone', 'Villa Community', 'Ultra Luxury', '',
] as const;

interface ParsedRow {
  rowNum: number;
  data: Partial<Record<CsvColumn, string>>;
  errors: string[];
}

interface UploadResult {
  rowNum: number;
  name: string;
  success: boolean;
  error?: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  const cells: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      cells.push(current.trim());
      current = '';
      if (cells.some(c => c !== '')) rows.push([...cells]);
      cells.length = 0;
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  if (cells.some(c => c !== '')) rows.push([...cells]);
  return rows;
}

function validateAndParse(csvText: string): { rows: ParsedRow[]; headerErrors: string[] } {
  const rawRows = parseCSV(csvText);
  if (rawRows.length < 2) return { rows: [], headerErrors: ['CSV file is empty or has no data rows.'] };

  const headers = rawRows[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
  const headerErrors: string[] = [];

  // Map header → column key (flexible matching)
  const colMap: Partial<Record<CsvColumn, number>> = {};
  for (const col of ALL_COLUMNS) {
    const idx = headers.findIndex(h => h === col.toLowerCase());
    if (idx !== -1) colMap[col] = idx;
  }

  for (const req of REQUIRED_COLUMNS) {
    if (colMap[req] === undefined) headerErrors.push(`Required column "${req}" not found in header row.`);
  }
  if (headerErrors.length > 0) return { rows: [], headerErrors };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i];
    const rowNum = i + 1;
    const data: Partial<Record<CsvColumn, string>> = {};
    const errors: string[] = [];

    for (const col of ALL_COLUMNS) {
      const idx = colMap[col];
      data[col] = idx !== undefined ? (cells[idx] ?? '').trim() : '';
    }

    if (!data.name) errors.push(`Row ${rowNum}: "name" is required.`);
    const normalised = PROPERTY_TYPE_ALIAS[data.propertyType ?? ''];
    if (!normalised) {
      errors.push(`Row ${rowNum}: "propertyType" must be one of: PROJECT, PLOT, FARMLAND (got "${data.propertyType}").`);
    }
    if (data.projectType && !VALID_PROJECT_TYPES.includes(data.projectType as any)) {
      errors.push(`Row ${rowNum}: "projectType" must be one of: GATED_SOCIETY, SEMI_GATED, STAND_ALONE, VILLA_COMMUNITY, ULTRA_LUXURY (got "${data.projectType}").`);
    }

    rows.push({ rowNum, data, errors });
  }

  return { rows, headerErrors: [] };
}

const TEMPLATE_CSV = [
  ALL_COLUMNS.join(','),
  'Prestige Kokapet,PROJECT,GATED_SOCIETY,Kokapet,Hyderabad,Prestige Group,RERA/PH/12345,Premium gated community with world-class amenities',
  'Sunshine Plots,plot,,Shadnagar,Hyderabad,Sun Developers,RERA/PH/67890,HMDA approved plots with 24x7 security',
  'Green Valley Farms,farmland,,Chevella,Hyderabad,GreenEarth Realty,,Fertile agricultural land with water connectivity',
].join('\n');

export default function BulkPropertyUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<UploadResult[]>([]);
  const [stage, setStage] = useState<'idle' | 'parsed' | 'uploading' | 'done'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setStage('idle');

    const text = await f.text();
    const { rows, headerErrors: hErrs } = validateAndParse(text);
    setHeaderErrors(hErrs);
    setParsedRows(rows);
    if (hErrs.length === 0) setStage('parsed');
  };

  const handleUpload = async () => {
    if (validRows.length === 0) return;
    setIsUploading(true);
    setStage('uploading');
    setProgress({ current: 0, total: validRows.length });

    const uploadResults: UploadResult[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress({ current: i + 1, total: validRows.length });
      try {
        await api.addProperty({
          name: row.data.name!,
          propertyType: PROPERTY_TYPE_ALIAS[row.data.propertyType ?? ''] ?? 'PROJECT',
          projectType: row.data.projectType as ProjectType | undefined || undefined,
          location: row.data.location || undefined,
          city: row.data.city || 'Unknown',
          developerName: row.data.developerName || 'Unknown',
          reraNumber: row.data.reraNumber || undefined,
          usp: row.data.usp || undefined,
        });
        uploadResults.push({ rowNum: row.rowNum, name: row.data.name!, success: true });
      } catch (err: any) {
        uploadResults.push({ rowNum: row.rowNum, name: row.data.name!, success: false, error: err?.message ?? 'Unknown error' });
      }
    }

    setResults(uploadResults);
    setIsUploading(false);
    setStage('done');
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setHeaderErrors([]);
    setResults([]);
    setStage('idle');
    setProgress({ current: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Howzy_Projects_Upload_Template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadErrorLog = () => {
    const lines = [
      'Row,Name,Error',
      ...invalidRows.map(r => `${r.rowNum},"${r.data.name ?? ''}","${r.errors.join('; ')}"`),
      ...failed.map(r => `${r.rowNum},"${r.name}","Upload failed: ${r.error ?? ''}"`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Howzy_Upload_Errors.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8" data-testid="bulk-property-upload">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Projects Upload</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Upload multiple projects in one go using a CSV file.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm shrink-0"
          data-testid="download-template-btn"
        >
          <Download className="w-4 h-4" />
          Download Sample Template
        </button>
      </div>

      {/* Column guide */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-3">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-800 space-y-1">
          <p className="font-bold">CSV Column Guide</p>
          <p><span className="font-semibold">Required:</span> <code className="bg-indigo-100 px-1 rounded">name</code>, <code className="bg-indigo-100 px-1 rounded">propertyType</code> (PROJECT / PLOT / FARMLAND)</p>
          <p><span className="font-semibold">Optional:</span> <code className="bg-indigo-100 px-1 rounded">projectType</code> (GATED_SOCIETY / SEMI_GATED / STAND_ALONE / VILLA_COMMUNITY / ULTRA_LUXURY), <code className="bg-indigo-100 px-1 rounded">location</code>, <code className="bg-indigo-100 px-1 rounded">city</code>, <code className="bg-indigo-100 px-1 rounded">developerName</code>, <code className="bg-indigo-100 px-1 rounded">reraNumber</code>, <code className="bg-indigo-100 px-1 rounded">usp</code></p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
              file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              id="bulk-file-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
              data-testid="bulk-file-input"
            />
            <label htmlFor="bulk-file-upload" className="cursor-pointer flex flex-col items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                {file ? file.name : 'Drop your CSV file here'}
              </h4>
              <p className="text-sm text-slate-500 mb-6">
                {file ? `${(file.size / 1024).toFixed(1)} KB · ${parsedRows.length} data rows detected` : 'Supports .csv up to 10 MB'}
              </p>
              <span className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                {file ? 'Change File' : 'Browse Files'}
              </span>
            </label>
          </div>

          <AnimatePresence mode="wait">
            {/* Header errors */}
            {headerErrors.length > 0 && (
              <motion.div key="header-err" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 text-sm">Invalid file format</p>
                  {headerErrors.map((e, i) => <p key={i} className="text-sm text-red-700 mt-1">{e}</p>)}
                </div>
              </motion.div>
            )}

            {/* Parsed preview */}
            {stage === 'parsed' && parsedRows.length > 0 && (
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                {/* Summary chips */}
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">{parsedRows.length} total rows</span>
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">{validRows.length} valid</span>
                  {invalidRows.length > 0 && (
                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">{invalidRows.length} with errors</span>
                  )}
                </div>

                {/* Row errors */}
                {invalidRows.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-sm font-bold text-amber-900">Rows with validation errors (will be skipped):</p>
                    {invalidRows.map(r => (
                      <div key={r.rowNum} className="text-xs text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-lg">{r.errors.join(' · ')}</div>
                    ))}
                  </div>
                )}

                {validRows.length > 0 && (
                  <div className="flex justify-end gap-3">
                    <button onClick={handleReset}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                      <X className="w-4 h-4" /> Clear
                    </button>
                    <button onClick={handleUpload} disabled={isUploading}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                      data-testid="upload-submit-btn">
                      <Upload className="w-4 h-4" />
                      Upload {validRows.length} Project{validRows.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Uploading progress */}
            {stage === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shrink-0" />
                  <p className="font-bold text-blue-900 text-sm">Uploading projects… {progress.current} / {progress.total}</p>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* Done summary */}
            {stage === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4" data-testid="upload-results">
                <div className={`p-5 rounded-2xl border flex items-start gap-3 ${
                  failed.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  {failed.length === 0
                    ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`font-bold text-sm ${failed.length === 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {succeeded.length} project{succeeded.length !== 1 ? 's' : ''} uploaded successfully
                      {failed.length > 0 && `, ${failed.length} failed`}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">Successfully uploaded projects are now live in the portal.</p>
                  </div>
                </div>

                {failed.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2 max-h-40 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-900">Failed rows:</p>
                      <button onClick={downloadErrorLog}
                        className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" /> Error Log
                      </button>
                    </div>
                    {failed.map(r => (
                      <div key={r.rowNum} className="text-xs text-red-800 bg-red-100/60 px-3 py-1.5 rounded-lg">
                        Row {r.rowNum} · "{r.name}" — {r.error}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={handleReset}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                    Upload Another File
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

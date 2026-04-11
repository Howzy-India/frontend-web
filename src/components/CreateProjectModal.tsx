import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, Trash2, Plus } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  api, CreateProjectInput, PropertyType, ProjectType, ProjectSegment,
  PossessionStatus, DensityType, ProjectZone, ProjectStatus, BhkType,
} from '../services/api';

// ── Constants ────────────────────────────────────────────────────────
const CITY_OPTIONS   = ['Hyderabad'] as const;
const STATE_OPTIONS  = ['Telangana'] as const;
const CLUSTER_OPTIONS = [
  'Neopolis', 'Kokapet', 'Gachibowli', 'Miyapur',
  'Bachupally', 'LB Nagar', 'Kothapet', 'Uppal',
] as const;
const AMENITY_OPTIONS = [
  "Children's Play Area", 'Club House', 'Cycling Track', 'Fire Safety',
  'Gas Pipeline', 'Gym', 'Intercom', 'Internet Provider', 'Lift', 'Park',
  'Security', 'Sewage Treatment Plant', 'Swimming Pool', 'Table Tennis',
  'Tennis Court', "Visitor's Parking", 'Yoga Area', 'Parking',
];

// ── Types ────────────────────────────────────────────────────────────
interface ConfigRow { bhkType: BhkType | ''; minSft: string; maxSft: string; unitCount: string; }
interface MediaFile  { file: File | null; uploadedUrl: string; uploading: boolean; error: string; }
const emptyMedia = (): MediaFile => ({ file: null, uploadedUrl: '', uploading: false, error: '' });

interface FormState {
  name: string; developerName: string; reraNumber: string;
  projectType: ProjectType | ''; projectSegment: ProjectSegment | '';
  possessionStatus: PossessionStatus | ''; possessionDate: string;
  status: ProjectStatus;
  address: string; zone: ProjectZone | ''; cluster: string; area: string;
  city: string; state: string; pincode: string; landmark: string; mapLink: string;
  landParcel: string; numberOfTowers: string; totalUnits: string; availableUnits: string;
  density: DensityType | ''; sftCostingPerSqft: string; emiStartsFrom: string;
  configurations: ConfigRow[];
  photoFiles: MediaFile[]; videoFile: MediaFile; brochureFile: MediaFile; agreementFile: MediaFile;
  projectManagerName: string; projectManagerContact: string; spocName: string; spocContact: string;
  usp: string; details: string; amenities: string[];
}

function emptyForm(propertyType: PropertyType, userRole?: string): FormState {
  return {
    name: '', developerName: '', reraNumber: '',
    projectType: '', projectSegment: '', possessionStatus: '', possessionDate: '',
    status: userRole === 'super_admin' ? 'ACTIVE' : 'PENDING_APPROVAL',
    address: '', zone: '', cluster: '', area: '', city: 'Hyderabad',
    state: 'Telangana', pincode: '', landmark: '', mapLink: '',
    landParcel: '', numberOfTowers: '', totalUnits: '', availableUnits: '',
    density: '', sftCostingPerSqft: '', emiStartsFrom: '',
    configurations: [{ bhkType: '', minSft: '', maxSft: '', unitCount: '' }],
    photoFiles: [emptyMedia()], videoFile: emptyMedia(), brochureFile: emptyMedia(), agreementFile: emptyMedia(),
    projectManagerName: '', projectManagerContact: '', spocName: '', spocContact: '',
    usp: '', details: '', amenities: [],
    _propertyType: propertyType,
  } as FormState & { _propertyType: PropertyType };
}

// ── Styling ──────────────────────────────────────────────────────────
const fc   = (extra = '') => `w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none ${extra}`;
const fcE  = (extra = '') => `w-full border border-red-400 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-400/30 outline-none bg-red-50/40 ${extra}`;
const lc   = () => 'block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide';
const sec  = () => 'border border-slate-100 rounded-2xl p-6 space-y-4 bg-slate-50/40';
const secH = () => 'text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2';

function ErrTip({ msg }: { msg: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center cursor-default select-none leading-none">!</span>
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col items-center z-[200]">
        <span className="border-[5px] border-transparent border-b-slate-900 -mb-px" />
        <span className="bg-slate-900 text-white text-[11px] rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl max-w-[200px] text-center">{msg}</span>
      </span>
    </span>
  );
}

// ── Firebase Storage upload helper ───────────────────────────────────
async function uploadToStorage(file: File, path: string): Promise<string> {
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

// ── FileUploadField ──────────────────────────────────────────────────
function FileUploadField({
  label, media, accept, hint, required, fieldError, onFileChange, onClear,
}: {
  label: string; media: MediaFile; accept: string; hint?: string;
  required?: boolean; fieldError?: string;
  onFileChange: (f: File) => void; onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className={lc()}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {fieldError && <ErrTip msg={fieldError} />}
      </label>
      {media.uploadedUrl ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-emerald-700 font-medium truncate flex-1">{media.file?.name ?? 'Uploaded'}</span>
          <button type="button" onClick={onClear} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 transition-colors text-left ${fieldError ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
        >
          {media.uploading ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" /> : <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          <span className="text-sm text-slate-500">{media.uploading ? 'Uploading…' : media.file ? media.file.name : 'Choose file…'}</span>
          {hint && !media.file && <span className="text-xs text-slate-400 ml-auto">{hint}</span>}
          {media.error && <span className="text-xs text-red-600 ml-auto">{media.error}</span>}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Main Modal Component ─────────────────────────────────────────────
interface CreateProjectModalProps {
  propertyType: PropertyType;
  userRole?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ propertyType, userRole, onClose, onSuccess }: CreateProjectModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(propertyType, userRole));
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [apiError, setApiError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormState, v: unknown) => {
    if (errors[k as string]) setErrors(prev => { const n = { ...prev }; delete n[k as string]; return n; });
    setForm(prev => ({ ...prev, [k]: v }));
  };

  // ── Config rows ───────────────────────────────────────────────────
  const setConfigs = (fn: (p: ConfigRow[]) => ConfigRow[]) => setForm(p => ({ ...p, configurations: fn(p.configurations) }));
  const updateConfig = (i: number, field: keyof ConfigRow, val: string) =>
    setConfigs(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // ── Photo file helpers ────────────────────────────────────────────
  const setPhotos = (fn: (p: MediaFile[]) => MediaFile[]) => setForm(p => ({ ...p, photoFiles: fn(p.photoFiles) }));
  const updatePhoto = (i: number, partial: Partial<MediaFile>) =>
    setPhotos(prev => prev.map((m, idx) => idx === i ? { ...m, ...partial } : m));

  const handleUploadPhoto = async (i: number, file: File) => {
    updatePhoto(i, { file, uploading: true, error: '' });
    try {
      const url = await uploadToStorage(file, `projects/photos/${Date.now()}_${file.name}`);
      updatePhoto(i, { uploadedUrl: url, uploading: false });
    } catch { updatePhoto(i, { uploading: false, error: 'Upload failed' }); }
  };

  // ── Single-file helpers ────────────────────────────────────────────
  const updateSingle = (field: 'videoFile' | 'brochureFile' | 'agreementFile', partial: Partial<MediaFile>) =>
    setForm(prev => ({ ...prev, [field]: { ...prev[field], ...partial } }));

  const handleUploadSingle = async (field: 'videoFile' | 'brochureFile' | 'agreementFile', file: File) => {
    const folder = field === 'videoFile' ? 'videos' : field === 'brochureFile' ? 'brochures' : 'agreements';
    updateSingle(field, { file, uploading: true, error: '' });
    try {
      const url = await uploadToStorage(file, `projects/${folder}/${Date.now()}_${file.name}`);
      updateSingle(field, { uploadedUrl: url, uploading: false });
    } catch { updateSingle(field, { uploading: false, error: 'Upload failed' }); }
  };

  // ── Validation ────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())            e.name           = 'Project name is required.';
    if (!form.developerName.trim())   e.developerName  = 'Developer name is required.';
    if (!form.city.trim())            e.city           = 'City is required.';
    if (!form.zone)                   e.zone           = 'Zone is required.';
    if (!form.cluster)                e.cluster        = 'Cluster is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Build payload ─────────────────────────────────────────────────
  const buildPayload = (): CreateProjectInput => {
    const num = (v: string) => v.trim() ? Number(v) : undefined;
    const str = (v: string) => v.trim() || undefined;
    const configs = form.configurations
      .filter(c => c.bhkType && c.minSft && c.maxSft && c.unitCount)
      .map(c => ({ bhkType: c.bhkType as BhkType, minSft: Number(c.minSft), maxSft: Number(c.maxSft), unitCount: Number(c.unitCount) }));
    const photos = form.photoFiles
      .filter(m => m.uploadedUrl)
      .map((m, i) => ({ url: m.uploadedUrl, displayOrder: i }));
    return {
      name: form.name.trim(), developerName: form.developerName.trim(),
      reraNumber: str(form.reraNumber),
      propertyType: (form as any)._propertyType as PropertyType,
      projectType: (form.projectType as ProjectType) || undefined,
      projectSegment: (form.projectSegment as ProjectSegment) || undefined,
      possessionStatus: (form.possessionStatus as PossessionStatus) || undefined,
      possessionDate: str(form.possessionDate),
      address: str(form.address), zone: (form.zone as ProjectZone) || undefined,
      location: str(form.cluster), area: str(form.area),
      city: form.city.trim(), state: str(form.state),
      pincode: str(form.pincode), landmark: str(form.landmark), mapLink: str(form.mapLink),
      landParcel: num(form.landParcel), numberOfTowers: num(form.numberOfTowers),
      totalUnits: num(form.totalUnits), availableUnits: num(form.availableUnits),
      density: (form.density as DensityType) || undefined,
      sftCostingPerSqft: num(form.sftCostingPerSqft), emiStartsFrom: str(form.emiStartsFrom),
      videoLink3D: form.videoFile.uploadedUrl || undefined,
      brochureLink: form.brochureFile.uploadedUrl || undefined,
      onboardingAgreementLink: form.agreementFile.uploadedUrl || undefined,
      projectManagerName: str(form.projectManagerName), projectManagerContact: str(form.projectManagerContact),
      spocName: str(form.spocName), spocContact: str(form.spocContact),
      usp: str(form.usp), details: str(form.details),
      status: form.status,
      configurations: configs.length ? configs : undefined,
      photos: photos.length ? photos : undefined,
      amenities: form.amenities.length ? form.amenities : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { setApiError('Please fix the highlighted fields.'); return; }
    const anyUploading = form.photoFiles.some(m => m.uploading) ||
      form.videoFile.uploading || form.brochureFile.uploading || form.agreementFile.uploading;
    if (anyUploading) { setApiError('Please wait for all uploads to finish.'); return; }
    setApiError(''); setSubmitting(true);
    try {
      await api.addProperty(buildPayload());
      onSuccess(); onClose();
    } catch (ex: unknown) {
      setApiError(ex instanceof Error ? ex.message : 'Failed to create project. Please try again.');
    } finally { setSubmitting(false); }
  };

  const typeLabel: Record<PropertyType, string> = { PROJECT: 'Project', PLOT: 'Plot', FARMLAND: 'Farm Land' };
  const pt = (form as any)._propertyType as PropertyType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h4 className="text-lg font-bold text-slate-900">{userRole === 'super_admin' ? 'Add' : 'Submit'} {typeLabel[pt]}</h4>
            {userRole !== 'super_admin' && <p className="text-xs text-amber-600 mt-0.5">Will be submitted for super admin approval</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            {/* ── Section: Basic Information ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span> Basic Information</p>
              <div>
                <label className={lc()}>Project Name <span className="text-red-500">*</span>{errors.name && <ErrTip msg={errors.name} />}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className={errors.name ? fcE() : fc()} placeholder="e.g. Prestige Lakeside Habitat" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Developer / Builder <span className="text-red-500">*</span>{errors.developerName && <ErrTip msg={errors.developerName} />}</label>
                  <input value={form.developerName} onChange={e => set('developerName', e.target.value)} className={errors.developerName ? fcE() : fc()} placeholder="Builder name" />
                </div>
                <div>
                  <label className={lc()}>RERA Number</label>
                  <input value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} className={fc()} placeholder="RERA/P123456…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Project Type</label>
                  <select value={form.projectType} onChange={e => set('projectType', e.target.value as ProjectType | '')} className={fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="GATED_SOCIETY">Gated Society</option>
                    <option value="SEMI_GATED">Semi Gated</option>
                    <option value="STAND_ALONE">Stand Alone</option>
                    <option value="VILLA_COMMUNITY">Villa Community</option>
                    <option value="ULTRA_LUXURY">Ultra Luxury</option>
                  </select>
                </div>
                <div>
                  <label className={lc()}>Segment</label>
                  <select value={form.projectSegment} onChange={e => set('projectSegment', e.target.value as ProjectSegment | '')} className={fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ECONOMY">Economy</option>
                    <option value="SUPER_LUXURY">Super Luxury</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Possession Status</label>
                  <select value={form.possessionStatus} onChange={e => set('possessionStatus', e.target.value as PossessionStatus | '')} className={fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="RTMI">RTMI – Ready to Move In</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="EOI">EOI – Expression of Interest</option>
                  </select>
                </div>
                <div>
                  <label className={lc()}>Possession Date</label>
                  <input value={form.possessionDate} onChange={e => set('possessionDate', e.target.value)} className={fc()} placeholder="e.g. Jun-29" />
                </div>
              </div>
              <div>
                <label className={lc()}>Listing Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value as ProjectStatus)} className={fc('bg-white')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMING_SOON">Coming Soon</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                </select>
              </div>
            </div>

            {/* ── Section: Location ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">2</span> Location</p>
              <div>
                <label className={lc()}>Full Address</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className={fc()} placeholder="Street address, landmark…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Zone <span className="text-red-500">*</span>{errors.zone && <ErrTip msg={errors.zone} />}</label>
                  <select value={form.zone} onChange={e => set('zone', e.target.value as ProjectZone | '')} className={errors.zone ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="NORTH">North</option><option value="SOUTH">South</option>
                    <option value="EAST">East</option><option value="WEST">West</option>
                    <option value="CENTRAL">Central</option>
                  </select>
                </div>
                <div>
                  <label className={lc()}>Cluster <span className="text-red-500">*</span>{errors.cluster && <ErrTip msg={errors.cluster} />}</label>
                  <select value={form.cluster} onChange={e => set('cluster', e.target.value)} className={errors.cluster ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    {CLUSTER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Area / Suburb</label>
                  <input value={form.area} onChange={e => set('area', e.target.value)} className={fc()} placeholder="e.g. Nanakramguda" />
                </div>
                <div>
                  <label className={lc()}>City <span className="text-red-500">*</span>{errors.city && <ErrTip msg={errors.city} />}</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)} className={errors.city ? fcE('bg-red-50/40') : fc('bg-white')}>
                    {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className={fc('bg-white')}>
                    {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc()}>Pincode</label>
                  <input value={form.pincode} onChange={e => set('pincode', e.target.value)} className={fc()} placeholder="500032" maxLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Landmark</label>
                  <input value={form.landmark} onChange={e => set('landmark', e.target.value)} className={fc()} placeholder="Near HITEC City" />
                </div>
                <div>
                  <label className={lc()}>Google Maps Pin URL</label>
                  <input value={form.mapLink} onChange={e => set('mapLink', e.target.value)} className={fc()} placeholder="https://maps.google.com/…" type="url" />
                </div>
              </div>
            </div>

            {/* ── Section: Project Details ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">3</span> Project Details</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lc()}>Land Parcel (Acres)</label>
                  <input type="number" min="0" step="0.01" value={form.landParcel} onChange={e => set('landParcel', e.target.value)} className={fc()} placeholder="5.0" />
                </div>
                <div>
                  <label className={lc()}>No. of Towers</label>
                  <input type="number" min="1" value={form.numberOfTowers} onChange={e => set('numberOfTowers', e.target.value)} className={fc()} placeholder="8" />
                </div>
                <div>
                  <label className={lc()}>Density</label>
                  <select value={form.density} onChange={e => set('density', e.target.value as DensityType | '')} className={fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="LOW_DENSITY">Low Density</option>
                    <option value="MEDIUM_DENSITY">Medium Density</option>
                    <option value="HIGH_DENSITY">High Density</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Total Units</label>
                  <input type="number" min="1" value={form.totalUnits} onChange={e => set('totalUnits', e.target.value)} className={fc()} placeholder="500" />
                </div>
                <div>
                  <label className={lc()}>Available Units</label>
                  <input type="number" min="0" value={form.availableUnits} onChange={e => set('availableUnits', e.target.value)} className={fc()} placeholder="200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>SFT Costing (₹/sqft)</label>
                  <input type="number" min="0" value={form.sftCostingPerSqft} onChange={e => set('sftCostingPerSqft', e.target.value)} className={fc()} placeholder="7500" />
                </div>
                <div>
                  <label className={lc()}>EMI Starts From</label>
                  <input value={form.emiStartsFrom} onChange={e => set('emiStartsFrom', e.target.value)} className={fc()} placeholder="e.g. ₹20k/month" />
                </div>
              </div>
            </div>

            {/* ── Section: BHK Configurations ── */}
            <div className={sec()}>
              <div className="flex items-center justify-between">
                <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">4</span> BHK Configurations</p>
                <button type="button" onClick={() => setConfigs(prev => [...prev, { bhkType: '', minSft: '', maxSft: '', unitCount: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                {form.configurations.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
                    <div>
                      {i === 0 && <label className={lc()}>BHK Type</label>}
                      <select value={row.bhkType} onChange={e => updateConfig(i, 'bhkType', e.target.value)} className={fc('bg-white')}>
                        <option value="">Type…</option>
                        <option value="BHK_1">1 BHK</option><option value="BHK_2">2 BHK</option>
                        <option value="BHK_3">3 BHK</option><option value="BHK_4">4 BHK</option>
                        <option value="BHK_5">5 BHK</option><option value="VILLA">Villa</option>
                        <option value="STUDIO">Studio</option>
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label className={lc()}>Min SFT</label>}
                      <input type="number" min="0" value={row.minSft} onChange={e => updateConfig(i, 'minSft', e.target.value)} className={fc()} placeholder="1200" />
                    </div>
                    <div>
                      {i === 0 && <label className={lc()}>Max SFT</label>}
                      <input type="number" min="0" value={row.maxSft} onChange={e => updateConfig(i, 'maxSft', e.target.value)} className={fc()} placeholder="1600" />
                    </div>
                    <div>
                      {i === 0 && <label className={lc()}>Units</label>}
                      <input type="number" min="0" value={row.unitCount} onChange={e => updateConfig(i, 'unitCount', e.target.value)} className={fc()} placeholder="80" />
                    </div>
                    <div className={i === 0 ? 'pt-6' : ''}>
                      <button type="button" onClick={() => setConfigs(prev => prev.filter((_, idx) => idx !== i))} disabled={form.configurations.length === 1}
                        className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section: Media & Files ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">5</span> Media &amp; Files</p>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={lc()}>Project Photos</span>
                  <button type="button" onClick={() => setPhotos(prev => [...prev, emptyMedia()])}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Photo
                  </button>
                </div>
                <div className="space-y-2">
                  {form.photoFiles.map((m, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <FileUploadField label={`Photo ${i + 1}`} media={m} accept="image/jpeg,image/jpg,image/png" hint="JPG, JPEG, PNG"
                          onFileChange={file => handleUploadPhoto(i, file)}
                          onClear={() => updatePhoto(i, { file: null, uploadedUrl: '', error: '' })} />
                      </div>
                      <button type="button" onClick={() => setPhotos(prev => prev.length === 1 ? [emptyMedia()] : prev.filter((_, idx) => idx !== i))}
                        className="mt-6 p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <FileUploadField label="3D / Walkthrough Video" media={form.videoFile} accept="video/mp4,video/x-ms-wmv,.wmv" hint="MP4, WMV"
                onFileChange={f => handleUploadSingle('videoFile', f)}
                onClear={() => updateSingle('videoFile', { file: null, uploadedUrl: '', error: '' })} />

              <FileUploadField label="Brochure" media={form.brochureFile} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hint="PDF, DOC, DOCX"
                onFileChange={f => handleUploadSingle('brochureFile', f)}
                onClear={() => updateSingle('brochureFile', { file: null, uploadedUrl: '', error: '' })} />

              <FileUploadField label="Onboarding Agreement" media={form.agreementFile} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hint="PDF, DOC, DOCX"
                onFileChange={f => handleUploadSingle('agreementFile', f)}
                onClear={() => updateSingle('agreementFile', { file: null, uploadedUrl: '', error: '' })} />
            </div>

            {/* ── Section: Team ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">6</span> Team &amp; Contacts</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Project Manager Name</label>
                  <input value={form.projectManagerName} onChange={e => set('projectManagerName', e.target.value)} className={fc()} placeholder="Full name" />
                </div>
                <div>
                  <label className={lc()}>Project Manager Contact</label>
                  <input value={form.projectManagerContact} onChange={e => set('projectManagerContact', e.target.value)} className={fc()} placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>SPOC Name</label>
                  <input value={form.spocName} onChange={e => set('spocName', e.target.value)} className={fc()} placeholder="Site SPOC name" />
                </div>
                <div>
                  <label className={lc()}>SPOC Contact</label>
                  <input value={form.spocContact} onChange={e => set('spocContact', e.target.value)} className={fc()} placeholder="+91 9876543210" />
                </div>
              </div>
            </div>

            {/* ── Section: Description & Amenities ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">7</span> Description &amp; Amenities</p>
              <div>
                <label className={lc()}>USP (Unique Selling Point)</label>
                <input value={form.usp} onChange={e => set('usp', e.target.value)} className={fc()} placeholder="e.g. Only gated community with lake view" />
              </div>
              <div>
                <label className={lc()}>Full Description</label>
                <textarea value={form.details} onChange={e => set('details', e.target.value)} rows={4} className={fc()} placeholder="Detailed project description…" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Amenities</p>
                <div className="grid grid-cols-3 gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.amenities.includes(a)}
                        onChange={() => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a])}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{a}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 flex-shrink-0">
            {apiError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3 text-center">{apiError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60">
                {submitting ? 'Submitting…' : userRole === 'super_admin' ? `Add ${typeLabel[pt]}` : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

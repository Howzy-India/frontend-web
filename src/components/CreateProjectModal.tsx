import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, Trash2, Plus } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  api, CreateProjectInput, PropertyType, ProjectType, ProjectSegment,
  PossessionStatus, DensityType, ProjectZone, ProjectStatus,
} from '../services/api';

// ── Constants ────────────────────────────────────────────────────────
const CITY_OPTIONS   = ['Hyderabad'] as const;
const STATE_OPTIONS  = ['Telangana'] as const;
const CLUSTER_OPTIONS = [
  // West
  'Financial District', 'Gachibowli', 'Hitech City', 'Kondapur', 'Kokapet',
  'Madhapur', 'Manikonda', 'Nanakramguda', 'Neopolis', 'Puppalaguda',
  // North
  'Bachupally', 'Dundigal', 'Hafeezpet', 'KPHB', 'Kompally',
  'Kukatpally', 'Medchal', 'Miyapur', 'Nizampet', 'Shamirpet',
  // East
  'Boduppal', 'Dilsukhnagar', 'Ghatkesar', 'Hayathnagar', 'Kothapet',
  'LB Nagar', 'Nagole', 'Pocharam', 'Uppal',
  // South
  'Attapur', 'Gandipet', 'Narsingi', 'Rajendra Nagar', 'Shamshabad',
  'Tukkuguda',
  // Central
  'Ameerpet', 'Banjara Hills', 'Begumpet', 'Himayatnagar', 'Jubilee Hills',
  'Punjagutta', 'Somajiguda',
] as const;
const AMENITY_OPTIONS = [
  "Children's Play Area", 'Club House', 'Cycling Track', 'Fire Safety',
  'Gas Pipeline', 'Gym', 'Intercom', 'Internet Provider', 'Lift', 'Park',
  'Security', 'Sewage Treatment Plant', 'Swimming Pool', 'Table Tennis',
  'Tennis Court', "Visitor's Parking", 'Yoga Area', 'Parking',
];
const PHONE_REGEX = /^(\+91|91|0)?[6-9]\d{9}$/;
const MIN_PHOTOS = 4;
const MAX_PHOTOS = 100;

// ── Types ────────────────────────────────────────────────────────────
interface ConfigRow { bhkCount: string; minSft: string; maxSft: string; unitCount: string; }
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
  agreementPercentage: string;
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
    configurations: [{ bhkCount: '', minSft: '', maxSft: '', unitCount: '' }],
    photoFiles: [emptyMedia()], videoFile: emptyMedia(), brochureFile: emptyMedia(), agreementFile: emptyMedia(),
    agreementPercentage: '',
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
  initialData?: any;
  projectId?: string;
}

export default function CreateProjectModal({ propertyType, userRole, onClose, onSuccess, initialData, projectId }: CreateProjectModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(propertyType, userRole));
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [apiError, setApiError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  React.useEffect(() => {
    if (!initialData || !projectId) return;
    const toMedia = (url?: string): MediaFile =>
      url ? { file: null, uploadedUrl: url, uploading: false, error: '' } : emptyMedia();
    setForm(prev => ({
      ...prev,
      name: initialData.name ?? '',
      developerName: initialData.developerName ?? '',
      reraNumber: initialData.reraNumber ?? '',
      projectType: initialData.projectType ?? '',
      projectSegment: initialData.projectSegment ?? '',
      possessionStatus: initialData.possessionStatus ?? '',
      possessionDate: initialData.possessionDate ?? '',
      status: initialData.status ?? prev.status,
      address: initialData.address ?? '',
      zone: initialData.zone ?? '',
      cluster: initialData.location ?? '',
      area: initialData.area ?? '',
      city: initialData.city ?? 'Hyderabad',
      state: initialData.state ?? 'Telangana',
      pincode: initialData.pincode ?? '',
      landmark: initialData.landmark ?? '',
      mapLink: initialData.mapLink ?? '',
      landParcel: initialData.landParcel != null ? String(initialData.landParcel) : '',
      numberOfTowers: initialData.numberOfTowers != null ? String(initialData.numberOfTowers) : '',
      totalUnits: initialData.totalUnits != null ? String(initialData.totalUnits) : '',
      availableUnits: initialData.availableUnits != null ? String(initialData.availableUnits) : '',
      density: initialData.density ?? '',
      sftCostingPerSqft: initialData.sftCostingPerSqft != null ? String(initialData.sftCostingPerSqft) : '',
      emiStartsFrom: initialData.emiStartsFrom ?? '',
      configurations: (initialData.configurations ?? []).length > 0
        ? (initialData.configurations as any[]).map((c: any) => ({
            bhkCount: String(c.bhkCount ?? c.bhk_count ?? ''),
            minSft: String(c.minSft ?? c.min_sft ?? ''),
            maxSft: String(c.maxSft ?? c.max_sft ?? ''),
            unitCount: String(c.unitCount ?? c.unit_count ?? ''),
          }))
        : [{ bhkCount: '', minSft: '', maxSft: '', unitCount: '' }],
      photoFiles: (initialData.photos ?? []).length > 0
        ? (initialData.photos as string[]).map(url => ({ file: null, uploadedUrl: url, uploading: false, error: '' }))
        : [emptyMedia()],
      videoFile: toMedia(initialData.videoLink3D),
      brochureFile: toMedia(initialData.brochureLink),
      agreementFile: toMedia(initialData.onboardingAgreementLink),
      agreementPercentage: initialData.agreementPercentage != null ? String(initialData.agreementPercentage) : '',
      projectManagerName: initialData.projectManagerName ?? '',
      projectManagerContact: initialData.projectManagerContact ?? '',
      spocName: initialData.spocName ?? '',
      spocContact: initialData.spocContact ?? '',
      usp: initialData.usp ?? '',
      details: initialData.details ?? '',
      amenities: initialData.amenities ?? [],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Section 1 – Basic Information
    if (!form.name.trim())             e.name            = 'Project name is required.';
    if (!form.developerName.trim())    e.developerName   = 'Developer name is required.';
    if (!form.reraNumber.trim())       e.reraNumber      = 'RERA number is required.';
    if (!form.projectType)             e.projectType     = 'Project type is required.';
    if (!form.projectSegment)          e.projectSegment  = 'Segment is required.';
    if (!form.possessionStatus)        e.possessionStatus = 'Possession status is required.';
    if (!form.possessionDate.trim())   e.possessionDate  = 'Possession date is required.';

    // Section 2 – Location
    if (!form.address.trim())          e.address         = 'Full address is required.';
    if (!form.zone)                    e.zone            = 'Zone is required.';
    if (!form.cluster)                 e.cluster         = 'Cluster is required.';
    if (!form.area.trim())             e.area            = 'Area / suburb is required.';
    if (!form.city.trim())             e.city            = 'City is required.';
    if (!form.pincode.trim())          e.pincode         = 'Pincode is required.';
    if (!form.landmark.trim())         e.landmark        = 'Landmark is required.';
    if (!form.mapLink.trim())          e.mapLink         = 'Google Maps link is required.';

    // Section 3 – Project Details
    if (!form.landParcel.trim())       e.landParcel      = 'Land parcel is required.';
    if (!form.numberOfTowers.trim())   e.numberOfTowers  = 'Number of towers is required.';
    if (!form.density)                 e.density         = 'Density is required.';
    if (!form.totalUnits.trim())       e.totalUnits      = 'Total units is required.';
    if (!form.availableUnits.trim())   e.availableUnits  = 'Available units is required.';
    if (!form.sftCostingPerSqft.trim()) e.sftCostingPerSqft = 'SFT costing is required.';
    if (!form.emiStartsFrom.trim())    e.emiStartsFrom   = 'EMI starts from is required.';

    // Section 4 – BHK Configurations
    const hasValidConfig = form.configurations.some(c => c.bhkCount && c.minSft && c.maxSft && c.unitCount);
    if (!hasValidConfig)               e.configurations  = 'At least one complete BHK configuration is required.';

    // Section 5 – Media & Files
    const uploadedPhotoCount = form.photoFiles.filter(m => m.uploadedUrl).length;
    if (uploadedPhotoCount < MIN_PHOTOS)
      e.photoFiles = `At least ${MIN_PHOTOS} photos are required (${uploadedPhotoCount} uploaded).`;
    if (!form.videoFile.uploadedUrl)   e.videoFile       = '3D / walkthrough video is required.';
    if (!form.brochureFile.uploadedUrl) e.brochureFile   = 'Brochure is required.';
    if (!form.agreementFile.uploadedUrl) e.agreementFile = 'Onboarding agreement is required.';
    if (!form.agreementPercentage.trim()) {
      e.agreementPercentage = 'Agreement percentage is required.';
    } else {
      const pct = Number(form.agreementPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) e.agreementPercentage = 'Enter a valid percentage between 0 and 100.';
    }

    // Section 6 – Team & Contacts
    if (!form.projectManagerName.trim()) e.projectManagerName = 'Project Manager name is required.';
    if (!form.projectManagerContact.trim()) {
      e.projectManagerContact = 'Project Manager contact is required.';
    } else if (!PHONE_REGEX.test(form.projectManagerContact.replace(/\s/g, ''))) {
      e.projectManagerContact = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!form.spocName.trim())         e.spocName        = 'SPOC name is required.';
    if (!form.spocContact.trim()) {
      e.spocContact = 'SPOC contact is required.';
    } else if (!PHONE_REGEX.test(form.spocContact.replace(/\s/g, ''))) {
      e.spocContact = 'Enter a valid 10-digit Indian mobile number.';
    }
    // Cross-field: PM ≠ SPOC
    if (
      form.projectManagerName.trim() && form.spocName.trim() &&
      form.projectManagerName.trim().toLowerCase() === form.spocName.trim().toLowerCase()
    ) {
      e.spocName = 'SPOC Name must differ from Project Manager Name.';
    }
    if (
      form.projectManagerContact.trim() && form.spocContact.trim() &&
      form.projectManagerContact.replace(/\s/g, '') === form.spocContact.replace(/\s/g, '')
    ) {
      e.spocContact = 'SPOC Contact must differ from Project Manager Contact.';
    }

    // Section 7 – Description & Amenities
    if (!form.usp.trim())              e.usp             = 'USP is required.';
    if (!form.details.trim())          e.details         = 'Full description is required.';
    if (form.amenities.length === 0)   e.amenities       = 'Select at least one amenity.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Build payload ─────────────────────────────────────────────────
  const buildPayload = (): CreateProjectInput => {
    const num = (v: string) => v.trim() ? Number(v) : undefined;
    const str = (v: string) => v.trim() || undefined;
    const configs = form.configurations
      .filter(c => c.bhkCount && c.minSft && c.maxSft && c.unitCount)
      .map(c => ({ bhkCount: Number(c.bhkCount), minSft: Number(c.minSft), maxSft: Number(c.maxSft), unitCount: Number(c.unitCount) }));
    const photos = form.photoFiles
      .filter(m => m.uploadedUrl)
      .map(m => m.uploadedUrl);
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
      agreementPercentage: form.agreementPercentage.trim() ? Number(form.agreementPercentage) : undefined,
      projectManagerName: str(form.projectManagerName), projectManagerContact: str(form.projectManagerContact),
      spocName: str(form.spocName), spocContact: str(form.spocContact),
      usp: str(form.usp), details: str(form.details),
      status: form.status,
      configurations: configs.length ? configs : undefined,
      photos: photos.length ? photos : undefined,
      amenities: form.amenities.length ? form.amenities : undefined,
    };
  };

  const handleApprove = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      await api.approveProject(projectId);
      onSuccess(); onClose();
    } catch (ex: unknown) {
      setApiError(ex instanceof Error ? ex.message : 'Failed to approve project.');
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { setApiError('Please fix the highlighted fields.'); return; }
    const anyUploading = form.photoFiles.some(m => m.uploading) ||
      form.videoFile.uploading || form.brochureFile.uploading || form.agreementFile.uploading;
    if (anyUploading) { setApiError('Please wait for all uploads to finish.'); return; }
    setApiError(''); setSubmitting(true);
    try {
      if (projectId) {
        await api.updateProject(projectId, buildPayload());
      } else {
        await api.addProperty(buildPayload());
      }
      onSuccess(); onClose();
    } catch (ex: unknown) {
      setApiError(ex instanceof Error ? ex.message : 'Failed to save project. Please try again.');
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
            <h4 className="text-lg font-bold text-slate-900">{projectId ? 'Edit' : (userRole === 'super_admin' ? 'Add' : 'Submit')} {typeLabel[pt]}</h4>
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
                  <label className={lc()}>RERA Number <span className="text-red-500">*</span>{errors.reraNumber && <ErrTip msg={errors.reraNumber} />}</label>
                  <input value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} className={errors.reraNumber ? fcE() : fc()} placeholder="RERA/P123456…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Project Type <span className="text-red-500">*</span>{errors.projectType && <ErrTip msg={errors.projectType} />}</label>
                  <select value={form.projectType} onChange={e => set('projectType', e.target.value as ProjectType | '')} className={errors.projectType ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="GATED_SOCIETY">Gated Society</option>
                    <option value="SEMI_GATED">Semi Gated</option>
                    <option value="STAND_ALONE">Stand Alone</option>
                    <option value="VILLA_COMMUNITY">Villa Community</option>
                    <option value="ULTRA_LUXURY">Ultra Luxury</option>
                  </select>
                </div>
                <div>
                  <label className={lc()}>Segment <span className="text-red-500">*</span>{errors.projectSegment && <ErrTip msg={errors.projectSegment} />}</label>
                  <select value={form.projectSegment} onChange={e => set('projectSegment', e.target.value as ProjectSegment | '')} className={errors.projectSegment ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ECONOMY">Economy</option>
                    <option value="SUPER_LUXURY">Super Luxury</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Possession Status <span className="text-red-500">*</span>{errors.possessionStatus && <ErrTip msg={errors.possessionStatus} />}</label>
                  <select value={form.possessionStatus} onChange={e => set('possessionStatus', e.target.value as PossessionStatus | '')} className={errors.possessionStatus ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="RTMI">RTMI – Ready to Move In</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="EOI">EOI – Expression of Interest</option>
                  </select>
                </div>
                <div>
                  <label className={lc()}>Possession Date <span className="text-red-500">*</span>{errors.possessionDate && <ErrTip msg={errors.possessionDate} />}</label>
                  <input value={form.possessionDate} onChange={e => set('possessionDate', e.target.value)} className={errors.possessionDate ? fcE() : fc()} placeholder="e.g. Jun-29" />
                </div>
              </div>
            </div>

            {/* ── Section: Location ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">2</span> Location</p>
              <div>
                <label className={lc()}>Full Address <span className="text-red-500">*</span>{errors.address && <ErrTip msg={errors.address} />}</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className={errors.address ? fcE() : fc()} placeholder="Street address, landmark…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Zone <span className="text-red-500">*</span>{errors.zone && <ErrTip msg={errors.zone} />}</label>
                  <select value={form.zone} onChange={e => set('zone', e.target.value as ProjectZone | '')} className={errors.zone ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="EAST">East</option><option value="WEST">West</option>
                    <option value="NORTH">North</option><option value="SOUTH">South</option>
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
                  <label className={lc()}>Area / Suburb <span className="text-red-500">*</span>{errors.area && <ErrTip msg={errors.area} />}</label>
                  <input value={form.area} onChange={e => set('area', e.target.value)} className={errors.area ? fcE() : fc()} placeholder="e.g. Nanakramguda" />
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
                  <label className={lc()}>Pincode <span className="text-red-500">*</span>{errors.pincode && <ErrTip msg={errors.pincode} />}</label>
                  <input value={form.pincode} onChange={e => set('pincode', e.target.value)} className={errors.pincode ? fcE() : fc()} placeholder="500032" maxLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Landmark <span className="text-red-500">*</span>{errors.landmark && <ErrTip msg={errors.landmark} />}</label>
                  <input value={form.landmark} onChange={e => set('landmark', e.target.value)} className={errors.landmark ? fcE() : fc()} placeholder="Near HITEC City" />
                </div>
                <div>
                  <label className={lc()}>Google Maps Pin URL <span className="text-red-500">*</span>{errors.mapLink && <ErrTip msg={errors.mapLink} />}</label>
                  <input value={form.mapLink} onChange={e => set('mapLink', e.target.value)} className={errors.mapLink ? fcE() : fc()} placeholder="https://maps.google.com/…" type="url" />
                </div>
              </div>
            </div>

            {/* ── Section: Project Details ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">3</span> Project Details</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lc()}>Land Parcel (Acres) <span className="text-red-500">*</span>{errors.landParcel && <ErrTip msg={errors.landParcel} />}</label>
                  <input type="number" min="0" step="0.01" value={form.landParcel} onChange={e => set('landParcel', e.target.value)} className={errors.landParcel ? fcE() : fc()} placeholder="5.0" />
                </div>
                <div>
                  <label className={lc()}>No. of Towers <span className="text-red-500">*</span>{errors.numberOfTowers && <ErrTip msg={errors.numberOfTowers} />}</label>
                  <input type="number" min="1" value={form.numberOfTowers} onChange={e => set('numberOfTowers', e.target.value)} className={errors.numberOfTowers ? fcE() : fc()} placeholder="8" />
                </div>
                <div>
                  <label className={lc()}>Density <span className="text-red-500">*</span>{errors.density && <ErrTip msg={errors.density} />}</label>
                  <select value={form.density} onChange={e => set('density', e.target.value as DensityType | '')} className={errors.density ? fcE('bg-red-50/40') : fc('bg-white')}>
                    <option value="">Select…</option>
                    <option value="LOW_DENSITY">Low Density</option>
                    <option value="MEDIUM_DENSITY">Medium Density</option>
                    <option value="HIGH_DENSITY">High Density</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Total Units <span className="text-red-500">*</span>{errors.totalUnits && <ErrTip msg={errors.totalUnits} />}</label>
                  <input type="number" min="1" value={form.totalUnits} onChange={e => set('totalUnits', e.target.value)} className={errors.totalUnits ? fcE() : fc()} placeholder="500" />
                </div>
                <div>
                  <label className={lc()}>Available Units <span className="text-red-500">*</span>{errors.availableUnits && <ErrTip msg={errors.availableUnits} />}</label>
                  <input type="number" min="0" value={form.availableUnits} onChange={e => set('availableUnits', e.target.value)} className={errors.availableUnits ? fcE() : fc()} placeholder="200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>SFT Costing (₹/sqft) <span className="text-red-500">*</span>{errors.sftCostingPerSqft && <ErrTip msg={errors.sftCostingPerSqft} />}</label>
                  <input type="number" min="0" value={form.sftCostingPerSqft} onChange={e => set('sftCostingPerSqft', e.target.value)} className={errors.sftCostingPerSqft ? fcE() : fc()} placeholder="7500" />
                </div>
                <div>
                  <label className={lc()}>EMI Starts From <span className="text-red-500">*</span>{errors.emiStartsFrom && <ErrTip msg={errors.emiStartsFrom} />}</label>
                  <input value={form.emiStartsFrom} onChange={e => set('emiStartsFrom', e.target.value)} className={errors.emiStartsFrom ? fcE() : fc()} placeholder="e.g. ₹20k/month" />
                </div>
              </div>
            </div>

            {/* ── Section: BHK Configurations ── */}
            <div className={sec()}>
              <div className="flex items-center justify-between">
                <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">4</span> BHK Configurations {errors.configurations && <ErrTip msg={errors.configurations} />}</p>
                <button type="button" onClick={() => setConfigs(prev => [...prev, { bhkCount: '', minSft: '', maxSft: '', unitCount: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                {form.configurations.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
                    <div>
                      {i === 0 && <label className={lc()}>BHK Count</label>}
                      <select value={row.bhkCount} onChange={e => updateConfig(i, 'bhkCount', e.target.value)} className={fc('bg-white')}>
                        <option value="">Count…</option>
                        <option value="1">1 BHK</option><option value="2">2 BHK</option>
                        <option value="3">3 BHK</option><option value="4">4 BHK</option>
                        <option value="5">5 BHK</option>
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
                  <span className={lc()}>
                    Project Photos <span className="text-red-500">*</span>
                    <span className="ml-1 text-slate-400 font-normal normal-case tracking-normal">({form.photoFiles.filter(m => m.uploadedUrl).length}/{MAX_PHOTOS} — min {MIN_PHOTOS})</span>
                    {errors.photoFiles && <ErrTip msg={errors.photoFiles} />}
                  </span>
                  <button type="button"
                    onClick={() => setPhotos(prev => prev.length < MAX_PHOTOS ? [...prev, emptyMedia()] : prev)}
                    disabled={form.photoFiles.length >= MAX_PHOTOS}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
                required fieldError={errors.videoFile}
                onFileChange={f => handleUploadSingle('videoFile', f)}
                onClear={() => updateSingle('videoFile', { file: null, uploadedUrl: '', error: '' })} />

              <FileUploadField label="Brochure" media={form.brochureFile} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hint="PDF, DOC, DOCX"
                required fieldError={errors.brochureFile}
                onFileChange={f => handleUploadSingle('brochureFile', f)}
                onClear={() => updateSingle('brochureFile', { file: null, uploadedUrl: '', error: '' })} />

              <FileUploadField label="Onboarding Agreement" media={form.agreementFile} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hint="PDF, DOC, DOCX"
                required fieldError={errors.agreementFile}
                onFileChange={f => handleUploadSingle('agreementFile', f)}
                onClear={() => updateSingle('agreementFile', { file: null, uploadedUrl: '', error: '' })} />

              <div>
                <label className={lc()}>
                  Percentage Mentioned in Agreement (%) <span className="text-red-500">*</span>
                  {errors.agreementPercentage && <ErrTip msg={errors.agreementPercentage} />}
                </label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={form.agreementPercentage}
                  onChange={e => set('agreementPercentage', e.target.value)}
                  className={errors.agreementPercentage ? fcE() : fc()}
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>

            {/* ── Section: Team ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">6</span> Team &amp; Contacts</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>Project Manager Name <span className="text-red-500">*</span>{errors.projectManagerName && <ErrTip msg={errors.projectManagerName} />}</label>
                  <input value={form.projectManagerName} onChange={e => set('projectManagerName', e.target.value)} className={errors.projectManagerName ? fcE() : fc()} placeholder="Full name" />
                </div>
                <div>
                  <label className={lc()}>Project Manager Contact <span className="text-red-500">*</span>{errors.projectManagerContact && <ErrTip msg={errors.projectManagerContact} />}</label>
                  <input value={form.projectManagerContact} onChange={e => set('projectManagerContact', e.target.value)} className={errors.projectManagerContact ? fcE() : fc()} placeholder="9876543210" maxLength={13} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc()}>SPOC Name <span className="text-red-500">*</span>{errors.spocName && <ErrTip msg={errors.spocName} />}</label>
                  <input value={form.spocName} onChange={e => set('spocName', e.target.value)} className={errors.spocName ? fcE() : fc()} placeholder="Site SPOC name" />
                </div>
                <div>
                  <label className={lc()}>SPOC Contact <span className="text-red-500">*</span>{errors.spocContact && <ErrTip msg={errors.spocContact} />}</label>
                  <input value={form.spocContact} onChange={e => set('spocContact', e.target.value)} className={errors.spocContact ? fcE() : fc()} placeholder="9876543210" maxLength={13} />
                </div>
              </div>
            </div>

            {/* ── Section: Description & Amenities ── */}
            <div className={sec()}>
              <p className={secH()}><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">7</span> Description &amp; Amenities</p>
              <div>
                <label className={lc()}>USP (Unique Selling Point) <span className="text-red-500">*</span>{errors.usp && <ErrTip msg={errors.usp} />}</label>
                <input value={form.usp} onChange={e => set('usp', e.target.value)} className={errors.usp ? fcE() : fc()} placeholder="e.g. Only gated community with lake view" />
              </div>
              <div>
                <label className={lc()}>Full Description <span className="text-red-500">*</span>{errors.details && <ErrTip msg={errors.details} />}</label>
                <textarea value={form.details} onChange={e => set('details', e.target.value)} rows={4} className={errors.details ? fcE() : fc()} placeholder="Detailed project description…" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Amenities <span className="text-red-500">*</span>{errors.amenities && <ErrTip msg={errors.amenities} />}
                </p>
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
              {projectId && initialData?.status === 'PENDING_APPROVAL' && userRole === 'super_admin' && (
                <button type="button" onClick={handleApprove} disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-60">
                  {submitting ? 'Processing…' : 'Approve Project'}
                </button>
              )}
              <button type="submit" disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60">
                {submitting ? 'Submitting…' : projectId ? 'Save Changes' : (userRole === 'super_admin' ? `Add ${typeLabel[pt]}` : 'Submit for Approval')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

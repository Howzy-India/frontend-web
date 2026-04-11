import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { api, CreateProjectInput, PropertyType, ProjectType, ProjectSegment, PossessionStatus, DensityType, ProjectZone, ProjectStatus, BhkType } from '../services/api';

// ── Form State ───────────────────────────────────────────────────────
interface ConfigRow {
  bhkType: BhkType | '';
  minSft: string;
  maxSft: string;
  unitCount: string;
}

interface FormState {
  // Step 1 – Basic Info
  name: string;
  developerName: string;
  reraNumber: string;
  propertyType: PropertyType;
  projectType: ProjectType | '';
  projectSegment: ProjectSegment | '';
  possessionStatus: PossessionStatus | '';
  possessionDate: string;
  status: ProjectStatus;
  // Step 2 – Location
  address: string;
  zone: ProjectZone | '';
  location: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  mapLink: string;
  // Step 3 – Project Details
  landParcel: string;
  numberOfTowers: string;
  totalUnits: string;
  availableUnits: string;
  density: DensityType | '';
  sftCostingPerSqft: string;
  emiStartsFrom: string;
  // Step 4 – Pricing & Configurations
  pricingTwoBhk: string;
  pricingThreeBhk: string;
  pricingFourBhk: string;
  configurations: ConfigRow[];
  // Step 5 – Media & Team
  photoUrls: string[];
  videoLink3D: string;
  brochureLink: string;
  onboardingAgreementLink: string;
  projectManagerName: string;
  projectManagerContact: string;
  spocName: string;
  spocContact: string;
  // Step 6 – Content & Amenities
  usp: string;
  teaser: string;
  details: string;
  amenities: string[];
  leadRegistrationStatus: string;
}

// ── Constants ────────────────────────────────────────────────────────
const AMENITY_OPTIONS = [
  "Children's Play Area", 'Club House', 'Cycling Track', 'Fire Safety',
  'Gas Pipeline', 'Gym', 'Intercom', 'Internet Provider', 'Lift', 'Park',
  'Security', 'Sewage Treatment Plant', 'Swimming Pool', 'Table Tennis',
  'Tennis Court', "Visitor's Parking", 'Yoga Area', 'Parking',
];

const STEPS = [
  'Basic Info',
  'Location',
  'Project Details',
  'Pricing & Config',
  'Media & Team',
  'Content',
];

function emptyForm(propertyType: PropertyType, userRole?: string): FormState {
  return {
    name: '', developerName: '', reraNumber: '',
    propertyType,
    projectType: '', projectSegment: '', possessionStatus: '', possessionDate: '',
    status: userRole === 'super_admin' ? 'ACTIVE' : 'PENDING_APPROVAL',
    address: '', zone: '', location: '', area: '', city: '',
    state: '', pincode: '', landmark: '', mapLink: '',
    landParcel: '', numberOfTowers: '', totalUnits: '', availableUnits: '',
    density: '', sftCostingPerSqft: '', emiStartsFrom: '',
    pricingTwoBhk: '', pricingThreeBhk: '', pricingFourBhk: '',
    configurations: [{ bhkType: '', minSft: '', maxSft: '', unitCount: '' }],
    photoUrls: [''], videoLink3D: '', brochureLink: '', onboardingAgreementLink: '',
    projectManagerName: '', projectManagerContact: '', spocName: '', spocContact: '',
    usp: '', teaser: '', details: '', amenities: [], leadRegistrationStatus: '',
  };
}

// ── Styling helpers ──────────────────────────────────────────────────
const fc = (extra = '') =>
  `w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none ${extra}`;
const lc = () => 'block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide';

// ── Step components ──────────────────────────────────────────────────
function Step1Basic({ form, set }: { form: FormState; set: (k: keyof FormState, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={lc()}>Project Name <span className="text-red-500">*</span></label>
        <input value={form.name} onChange={e => set('name', e.target.value)} required
          className={fc()} placeholder="e.g. Prestige Lakeside Habitat" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Developer / Builder</label>
          <input value={form.developerName} onChange={e => set('developerName', e.target.value)}
            className={fc()} placeholder="Builder name" />
        </div>
        <div>
          <label className={lc()}>RERA Number</label>
          <input value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)}
            className={fc()} placeholder="RERA/P123456..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Property Type <span className="text-red-500">*</span></label>
          <select value={form.propertyType} onChange={e => set('propertyType', e.target.value as PropertyType)}
            className={fc('bg-white')}>
            <option value="PROJECT">Project</option>
            <option value="PLOT">Plot</option>
            <option value="FARMLAND">Farm Land</option>
          </select>
        </div>
        <div>
          <label className={lc()}>Project Type</label>
          <select value={form.projectType} onChange={e => set('projectType', e.target.value as ProjectType | '')}
            className={fc('bg-white')}>
            <option value="">Select…</option>
            <option value="GATED_SOCIETY">Gated Society</option>
            <option value="SEMI_GATED">Semi Gated</option>
            <option value="STAND_ALONE">Stand Alone</option>
            <option value="VILLA_COMMUNITY">Villa Community</option>
            <option value="ULTRA_LUXURY">Ultra Luxury</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Segment</label>
          <select value={form.projectSegment} onChange={e => set('projectSegment', e.target.value as ProjectSegment | '')}
            className={fc('bg-white')}>
            <option value="">Select…</option>
            <option value="PREMIUM">Premium</option>
            <option value="ECONOMY">Economy</option>
            <option value="SUPER_LUXURY">Super Luxury</option>
          </select>
        </div>
        <div>
          <label className={lc()}>Possession Status</label>
          <select value={form.possessionStatus} onChange={e => set('possessionStatus', e.target.value as PossessionStatus | '')}
            className={fc('bg-white')}>
            <option value="">Select…</option>
            <option value="RTMI">RTMI – Ready to Move In</option>
            <option value="UNDER_CONSTRUCTION">Under Construction</option>
            <option value="EOI">EOI – Expression of Interest</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Possession Date</label>
          <input value={form.possessionDate} onChange={e => set('possessionDate', e.target.value)}
            className={fc()} placeholder="e.g. Jun-29" />
        </div>
        <div>
          <label className={lc()}>Listing Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value as ProjectStatus)}
            className={fc('bg-white')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="COMING_SOON">Coming Soon</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Step2Location({ form, set }: { form: FormState; set: (k: keyof FormState, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={lc()}>Full Address</label>
        <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
          className={fc()} placeholder="Street address, landmark…" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Zone <span className="text-red-500">*</span></label>
          <select value={form.zone} onChange={e => set('zone', e.target.value as ProjectZone | '')}
            className={fc('bg-white')}>
            <option value="">Select…</option>
            <option value="NORTH">North</option>
            <option value="SOUTH">South</option>
            <option value="EAST">East</option>
            <option value="WEST">West</option>
            <option value="CENTRAL">Central</option>
          </select>
        </div>
        <div>
          <label className={lc()}>Cluster / Location</label>
          <input value={form.location} onChange={e => set('location', e.target.value)}
            className={fc()} placeholder="e.g. Whitefield" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Area / Suburb</label>
          <input value={form.area} onChange={e => set('area', e.target.value)}
            className={fc()} placeholder="e.g. Sarjapur Road" />
        </div>
        <div>
          <label className={lc()}>City <span className="text-red-500">*</span></label>
          <input value={form.city} onChange={e => set('city', e.target.value)}
            className={fc()} placeholder="Bengaluru" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>State</label>
          <input value={form.state} onChange={e => set('state', e.target.value)}
            className={fc()} placeholder="Karnataka" />
        </div>
        <div>
          <label className={lc()}>Pincode</label>
          <input value={form.pincode} onChange={e => set('pincode', e.target.value)}
            className={fc()} placeholder="560001" maxLength={6} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Landmark</label>
          <input value={form.landmark} onChange={e => set('landmark', e.target.value)}
            className={fc()} placeholder="Near ITPL" />
        </div>
        <div>
          <label className={lc()}>Google Maps Pin URL</label>
          <input value={form.mapLink} onChange={e => set('mapLink', e.target.value)}
            className={fc()} placeholder="https://maps.google.com/…" type="url" />
        </div>
      </div>
    </div>
  );
}

function Step3Details({ form, set }: { form: FormState; set: (k: keyof FormState, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={lc()}>Land Parcel (Acres)</label>
          <input type="number" min="0" step="0.01" value={form.landParcel}
            onChange={e => set('landParcel', e.target.value)}
            className={fc()} placeholder="5.0" />
        </div>
        <div>
          <label className={lc()}>No. of Towers</label>
          <input type="number" min="1" value={form.numberOfTowers}
            onChange={e => set('numberOfTowers', e.target.value)}
            className={fc()} placeholder="8" />
        </div>
        <div>
          <label className={lc()}>Density</label>
          <select value={form.density} onChange={e => set('density', e.target.value as DensityType | '')}
            className={fc('bg-white')}>
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
          <input type="number" min="1" value={form.totalUnits}
            onChange={e => set('totalUnits', e.target.value)}
            className={fc()} placeholder="500" />
        </div>
        <div>
          <label className={lc()}>Available Units</label>
          <input type="number" min="0" value={form.availableUnits}
            onChange={e => set('availableUnits', e.target.value)}
            className={fc()} placeholder="200" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>SFT Costing (₹/sqft)</label>
          <input type="number" min="0" value={form.sftCostingPerSqft}
            onChange={e => set('sftCostingPerSqft', e.target.value)}
            className={fc()} placeholder="7500" />
        </div>
        <div>
          <label className={lc()}>EMI Starts From</label>
          <input value={form.emiStartsFrom} onChange={e => set('emiStartsFrom', e.target.value)}
            className={fc()} placeholder="e.g. ₹20k/month" />
        </div>
      </div>
    </div>
  );
}

function Step4Pricing({
  form, set, setConfigs,
}: {
  form: FormState;
  set: (k: keyof FormState, v: unknown) => void;
  setConfigs: (fn: (prev: ConfigRow[]) => ConfigRow[]) => void;
}) {
  const updateConfig = (i: number, field: keyof ConfigRow, val: string) => {
    setConfigs(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const addConfig = () =>
    setConfigs(prev => [...prev, { bhkType: '', minSft: '', maxSft: '', unitCount: '' }]);
  const removeConfig = (i: number) =>
    setConfigs(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Pricing Overview</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lc()}>2 BHK Price (₹)</label>
            <input type="number" min="0" value={form.pricingTwoBhk}
              onChange={e => set('pricingTwoBhk', e.target.value)}
              className={fc()} placeholder="6500000" />
          </div>
          <div>
            <label className={lc()}>3 BHK Price (₹)</label>
            <input type="number" min="0" value={form.pricingThreeBhk}
              onChange={e => set('pricingThreeBhk', e.target.value)}
              className={fc()} placeholder="8500000" />
          </div>
          <div>
            <label className={lc()}>4 BHK Price (₹)</label>
            <input type="number" min="0" value={form.pricingFourBhk}
              onChange={e => set('pricingFourBhk', e.target.value)}
              className={fc()} placeholder="12000000" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">BHK Configurations</p>
          <button type="button" onClick={addConfig}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {form.configurations.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
              <div>
                {i === 0 && <label className={lc()}>BHK Type</label>}
                <select value={row.bhkType} onChange={e => updateConfig(i, 'bhkType', e.target.value)}
                  className={fc('bg-white')}>
                  <option value="">Type…</option>
                  <option value="BHK_1">1 BHK</option>
                  <option value="BHK_2">2 BHK</option>
                  <option value="BHK_3">3 BHK</option>
                  <option value="BHK_4">4 BHK</option>
                  <option value="BHK_5">5 BHK</option>
                  <option value="VILLA">Villa</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>
              <div>
                {i === 0 && <label className={lc()}>Min SFT</label>}
                <input type="number" min="0" value={row.minSft}
                  onChange={e => updateConfig(i, 'minSft', e.target.value)}
                  className={fc()} placeholder="1200" />
              </div>
              <div>
                {i === 0 && <label className={lc()}>Max SFT</label>}
                <input type="number" min="0" value={row.maxSft}
                  onChange={e => updateConfig(i, 'maxSft', e.target.value)}
                  className={fc()} placeholder="1600" />
              </div>
              <div>
                {i === 0 && <label className={lc()}>Units</label>}
                <input type="number" min="0" value={row.unitCount}
                  onChange={e => updateConfig(i, 'unitCount', e.target.value)}
                  className={fc()} placeholder="80" />
              </div>
              <div className={i === 0 ? 'pt-6' : ''}>
                <button type="button" onClick={() => removeConfig(i)}
                  disabled={form.configurations.length === 1}
                  className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Media({
  form, set, setPhotos,
}: {
  form: FormState;
  set: (k: keyof FormState, v: unknown) => void;
  setPhotos: (fn: (prev: string[]) => string[]) => void;
}) {
  const updatePhoto = (i: number, val: string) =>
    setPhotos(prev => prev.map((u, idx) => (idx === i ? val : u)));
  const addPhoto = () => setPhotos(prev => [...prev, '']);
  const removePhoto = (i: number) =>
    setPhotos(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Photo URLs</p>
          <button type="button" onClick={addPhoto}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add URL
          </button>
        </div>
        <div className="space-y-2">
          {form.photoUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input value={url} onChange={e => updatePhoto(i, e.target.value)} type="url"
                className={fc('flex-1')} placeholder="https://storage.googleapis.com/…" />
              <button type="button" onClick={() => removePhoto(i)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>3D Video Link</label>
          <input type="url" value={form.videoLink3D} onChange={e => set('videoLink3D', e.target.value)}
            className={fc()} placeholder="https://youtube.com/…" />
        </div>
        <div>
          <label className={lc()}>Brochure Link</label>
          <input type="url" value={form.brochureLink} onChange={e => set('brochureLink', e.target.value)}
            className={fc()} placeholder="https://storage.googleapis.com/…" />
        </div>
      </div>
      <div>
        <label className={lc()}>Onboarding Agreement Link</label>
        <input type="url" value={form.onboardingAgreementLink}
          onChange={e => set('onboardingAgreementLink', e.target.value)}
          className={fc()} placeholder="https://…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>Project Manager Name</label>
          <input value={form.projectManagerName} onChange={e => set('projectManagerName', e.target.value)}
            className={fc()} placeholder="Full name" />
        </div>
        <div>
          <label className={lc()}>Project Manager Contact</label>
          <input value={form.projectManagerContact} onChange={e => set('projectManagerContact', e.target.value)}
            className={fc()} placeholder="+91 9876543210" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc()}>SPOC Name</label>
          <input value={form.spocName} onChange={e => set('spocName', e.target.value)}
            className={fc()} placeholder="Site SPOC name" />
        </div>
        <div>
          <label className={lc()}>SPOC Contact</label>
          <input value={form.spocContact} onChange={e => set('spocContact', e.target.value)}
            className={fc()} placeholder="+91 9876543210" />
        </div>
      </div>
    </div>
  );
}

function Step6Content({
  form, set,
}: {
  form: FormState;
  set: (k: keyof FormState, v: unknown) => void;
}) {
  const toggleAmenity = (a: string) => {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={lc()}>USP (Unique Selling Point)</label>
        <input value={form.usp} onChange={e => set('usp', e.target.value)}
          className={fc()} placeholder="e.g. Only gated community with lake view" />
      </div>
      <div>
        <label className={lc()}>Teaser / Tagline</label>
        <textarea value={form.teaser} onChange={e => set('teaser', e.target.value)} rows={2}
          className={fc()} placeholder="Short marketing tagline…" />
      </div>
      <div>
        <label className={lc()}>Full Description</label>
        <textarea value={form.details} onChange={e => set('details', e.target.value)} rows={4}
          className={fc()} placeholder="Detailed project description…" />
      </div>
      <div>
        <label className={lc()}>Lead Registration Status</label>
        <input value={form.leadRegistrationStatus} onChange={e => set('leadRegistrationStatus', e.target.value)}
          className={fc()} placeholder="e.g. Open" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Amenities</p>
        <div className="grid grid-cols-3 gap-2">
          {AMENITY_OPTIONS.map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={form.amenities.includes(a)}
                onChange={() => toggleAmenity(a)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
              <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{a}</span>
            </label>
          ))}
        </div>
      </div>
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

export default function CreateProjectModal({
  propertyType, userRole, onClose, onSuccess,
}: CreateProjectModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => emptyForm(propertyType, userRole));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }));
  const setConfigs = (fn: (prev: ConfigRow[]) => ConfigRow[]) =>
    setForm(prev => ({ ...prev, configurations: fn(prev.configurations) }));
  const setPhotos = (fn: (prev: string[]) => string[]) =>
    setForm(prev => ({ ...prev, photoUrls: fn(prev.photoUrls) }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.name.trim()) return 'Project name is required.';
      if (!form.developerName.trim()) return 'Developer name is required.';
    }
    if (step === 1) {
      if (!form.city.trim()) return 'City is required.';
      if (!form.zone) return 'Zone is required.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const buildPayload = (): CreateProjectInput => {
    const num = (v: string) => v.trim() ? Number(v) : undefined;
    const str = (v: string) => v.trim() || undefined;

    const configs = form.configurations
      .filter(c => c.bhkType && c.minSft && c.maxSft && c.unitCount)
      .map(c => ({
        bhkType: c.bhkType as BhkType,
        minSft: Number(c.minSft),
        maxSft: Number(c.maxSft),
        unitCount: Number(c.unitCount),
      }));

    const photos = form.photoUrls
      .map((u, i) => ({ url: u.trim(), displayOrder: i }))
      .filter(p => p.url);

    return {
      name: form.name.trim(),
      developerName: form.developerName.trim(),
      reraNumber: str(form.reraNumber),
      propertyType: form.propertyType,
      projectType: (form.projectType as ProjectType) || undefined,
      projectSegment: (form.projectSegment as ProjectSegment) || undefined,
      possessionStatus: (form.possessionStatus as PossessionStatus) || undefined,
      possessionDate: str(form.possessionDate),
      address: str(form.address),
      zone: (form.zone as typeof form.zone extends '' ? never : typeof form.zone) || undefined,
      location: str(form.location),
      area: str(form.area),
      city: form.city.trim(),
      state: str(form.state),
      pincode: str(form.pincode),
      landmark: str(form.landmark),
      mapLink: str(form.mapLink),
      landParcel: num(form.landParcel),
      numberOfTowers: num(form.numberOfTowers),
      totalUnits: num(form.totalUnits),
      availableUnits: num(form.availableUnits),
      density: (form.density as DensityType) || undefined,
      sftCostingPerSqft: num(form.sftCostingPerSqft),
      emiStartsFrom: str(form.emiStartsFrom),
      pricingTwoBhk: num(form.pricingTwoBhk),
      pricingThreeBhk: num(form.pricingThreeBhk),
      pricingFourBhk: num(form.pricingFourBhk),
      videoLink3D: str(form.videoLink3D),
      brochureLink: str(form.brochureLink),
      onboardingAgreementLink: str(form.onboardingAgreementLink),
      projectManagerName: str(form.projectManagerName),
      projectManagerContact: str(form.projectManagerContact),
      spocName: str(form.spocName),
      spocContact: str(form.spocContact),
      usp: str(form.usp),
      teaser: str(form.teaser),
      details: str(form.details),
      status: form.status,
      leadRegistrationStatus: str(form.leadRegistrationStatus),
      configurations: configs.length ? configs : undefined,
      photos: photos.length ? photos : undefined,
      amenities: form.amenities.length ? form.amenities : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.addProperty(buildPayload());
      onSuccess();
      onClose();
    } catch (ex: unknown) {
      setError(ex instanceof Error ? ex.message : 'Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  const typeLabel: Record<PropertyType, string> = {
    PROJECT: 'Project',
    PLOT: 'Plot',
    FARMLAND: 'Farm Land',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-lg font-bold text-slate-900">
              {userRole === 'super_admin' ? 'Add' : 'Submit'} {typeLabel[form.propertyType]}
            </h4>
            {userRole !== 'super_admin' && (
              <p className="text-xs text-amber-600 mt-0.5">Will be submitted for super admin approval</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${i === step
                      ? 'bg-indigo-600 text-white'
                      : i < step
                        ? 'bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black
                    ${i === step ? 'bg-white/30 text-white' : i < step ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body – scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {step === 0 && <Step1Basic form={form} set={set} />}
            {step === 1 && <Step2Location form={form} set={set} />}
            {step === 2 && <Step3Details form={form} set={set} />}
            {step === 3 && <Step4Pricing form={form} set={set} setConfigs={setConfigs} />}
            {step === 4 && <Step5Media form={form} set={set} setPhotos={setPhotos} />}
            {step === 5 && <Step6Content form={form} set={set} />}

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : userRole === 'super_admin' ? `Add ${typeLabel[form.propertyType]}` : 'Submit for Approval'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

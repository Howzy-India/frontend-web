import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Props {
  project: any;
  onClose: () => void;
}

function Badge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border border-slate-200',
    COMING_SOON: 'bg-amber-50 text-amber-700 border border-amber-200',
    PENDING_APPROVAL: 'bg-sky-50 text-sky-700 border border-sky-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorMap[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value?.replace(/_/g, ' ')}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{String(value)}</p>
    </div>
  );
}

function LinkField({ label, url }: { label: string; url?: string }) {
  if (!url) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"
      >
        View <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</p>
    </div>
  );
}

export default function ViewProjectModal({ project: p, onClose }: Props) {
  const configs: any[] = p.configurations ?? [];
  const photos: string[] = p.photos ?? [];
  const amenities: string[] = p.amenities ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl px-8 py-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{p.name}</h2>
            <div className="mt-2">
              <Badge value={p.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">

          {/* Basic Info */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <SectionHeader num={1} title="Basic Information" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Developer" value={p.developerName} />
              <Field label="RERA Number" value={p.reraNumber} />
              <Field label="Property Type" value={p.propertyType} />
              <Field label="Project Type" value={p.projectType?.replace(/_/g, ' ')} />
              <Field label="Segment" value={p.projectSegment?.replace(/_/g, ' ')} />
              <Field label="Possession Status" value={p.possessionStatus?.replace(/_/g, ' ')} />
              <Field label="Possession Date" value={p.possessionDate} />
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <SectionHeader num={2} title="Location" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Address" value={p.address} />
              <Field label="Zone" value={p.zone} />
              <Field label="Cluster / Location" value={p.location} />
              <Field label="Area" value={p.area} />
              <Field label="City" value={p.city} />
              <Field label="State" value={p.state} />
              <Field label="Pincode" value={p.pincode} />
              <Field label="Landmark" value={p.landmark} />
              <LinkField label="Google Maps" url={p.mapLink} />
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <SectionHeader num={3} title="Pricing & Details" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Field label="SFT Costing (₹/sqft)" value={p.sftCostingPerSqft} />
              <Field label="EMI Starts From" value={p.emiStartsFrom} />
              <Field label="Land Parcel (Acres)" value={p.landParcel} />
              <Field label="No. of Towers" value={p.numberOfTowers} />
              <Field label="Total Units" value={p.totalUnits} />
              <Field label="Available Units" value={p.availableUnits} />
              <Field label="Density" value={p.density?.replace(/_/g, ' ')} />
            </div>
            {configs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Configurations</p>
                <div className="space-y-1">
                  {configs.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="font-bold">{c.bhkCount ?? c.bhk_count} BHK</span>
                      <span className="text-slate-400">—</span>
                      <span>{c.minSft ?? c.min_sft}–{c.maxSft ?? c.max_sft} sqft</span>
                      <span className="text-slate-400">·</span>
                      <span>{c.unitCount ?? c.unit_count} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Files & Media */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <SectionHeader num={4} title="Files & Media" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <LinkField label="3D/Walkthrough Video" url={p.videoLink3D} />
              <LinkField label="Brochure" url={p.brochureLink} />
              <LinkField label="Onboarding Agreement" url={p.onboardingAgreementLink} />
            </div>
            {photos.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Photos</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {photos.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <SectionHeader num={5} title="Contact" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Project Manager" value={p.projectManagerName} />
              <Field label="PM Contact" value={p.projectManagerContact} />
              <Field label="SPOC Name" value={p.spocName} />
              <Field label="SPOC Contact" value={p.spocContact} />
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
              <SectionHeader num={6} title="Amenities" />
              <div className="flex flex-wrap gap-2">
                {amenities.map((a: string) => (
                  <span key={a} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* USP & Details */}
          {(p.usp || p.details || p.teaser) && (
            <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
              <SectionHeader num={7} title="Description" />
              {p.usp && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">USP</p>
                  <p className="text-sm text-slate-800">{p.usp}</p>
                </div>
              )}
              {p.teaser && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Teaser</p>
                  <p className="text-sm text-slate-800">{p.teaser}</p>
                </div>
              )}
              {p.details && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Details</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line">{p.details}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

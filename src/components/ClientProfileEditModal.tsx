import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Clock, X, Loader2, CheckCircle2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { updateClientProfile } from '../hooks/useClientProfile';

const CONTACT_TIME_OPTIONS = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Anytime'];

interface ClientProfileEditModalProps {
  uid: string;
  currentName: string;
  currentContactTime: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function ClientProfileEditModal({
  uid,
  currentName,
  currentContactTime,
  onSave,
  onClose,
}: Readonly<ClientProfileEditModalProps>) {
  const [name, setName] = useState(currentName);
  const [contactTime, setContactTime] = useState(currentContactTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameError = name.trim().length === 0 ? 'Full name is required' : null;
  const contactError = contactTime.length === 0 ? 'Preferred call time is required' : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameError || contactError) {
      setError(nameError ?? contactError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateClientProfile(uid, { name: name.trim(), contactTime });
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: name.trim() });
      }
      setSuccess(true);
      setTimeout(() => {
        onSave(name.trim());
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Edit Profile</h2>
            <p className="text-indigo-100 text-xs mt-0.5">Update your name and contact preference</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
              <p className="font-semibold text-slate-800">Profile updated!</p>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="edit-name" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      error && nameError ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                </div>
                {error && nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>

              {/* Preferred Time to Call */}
              <div>
                <label htmlFor="edit-contact-time" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Preferred Time to Call <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    id="edit-contact-time"
                    value={contactTime}
                    onChange={e => setContactTime(e.target.value)}
                    required
                    className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none ${
                      error && contactError ? 'border-red-300' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Select preferred time…</option>
                    {CONTACT_TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {error && contactError && <p className="text-xs text-red-500 mt-1">{contactError}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}

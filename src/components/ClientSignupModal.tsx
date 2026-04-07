import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Clock, CheckSquare, Square, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveClientProfile } from '../hooks/useClientProfile';
import type { LookingFor } from '../hooks/useClientProfile';

const LOOKING_FOR_OPTIONS: LookingFor[] = [
  'New Property',
  'Lands',
  'Villas',
  'ReSale Properties',
  'Commercial Properties',
];

const CONTACT_TIME_OPTIONS = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Anytime'];

interface ClientSignupModalProps {
  uid: string;
  phone: string;
  onComplete: (name: string) => void;
}

export default function ClientSignupModal({ uid, phone, onComplete }: ClientSignupModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [contactTime, setContactTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedName, setSavedName] = useState('');

  // Auto-proceed to home 1.5s after showing the success screen
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => onComplete(savedName), 1500);
    return () => clearTimeout(timer);
  }, [success, savedName, onComplete]);

  const toggleOption = (option: LookingFor) => {
    setLookingFor(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (lookingFor.length === 0) { setError('Please select at least one property type.'); return; }
    if (!contactTime) { setError('Please select a preferred contact time.'); return; }
    setError(null);
    setSaving(true);
    try {
      await saveClientProfile(uid, { name: name.trim(), phone, email: email.trim(), lookingFor, contactTime });
      setSavedName(name.trim());
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome, {savedName}! 🎉</h2>
            <p className="text-slate-500 text-sm">Your account has been created successfully. Logging you in…</p>
            <div className="mt-6 flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Complete Your Profile</h2>
          <p className="text-indigo-100 text-sm mt-1">Tell us a bit about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Name */}
          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Email ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          {/* Looking for */}
          <div>
            <p className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Looking For <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(opt => {
                const selected = lookingFor.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact time */}
          <div>
            <label htmlFor="signup-contact-time" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Suitable Time to Contact <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="signup-contact-time"
                value={contactTime}
                onChange={e => setContactTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
              >
                <option value="">Select preferred time…</option>
                {CONTACT_TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Get Started'}
          </button>
        </form>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

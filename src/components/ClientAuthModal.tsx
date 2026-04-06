import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, ArrowRight, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

export default function ClientAuthModal({ isOpen, onClose, onLogin }: ClientAuthModalProps) {
  const { sendOtp, verifyOtp, otpLoading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [localError, setLocalError] = useState<string | null>(null);
  const recaptchaId = useId();

  const displayError = localError ?? error;

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await sendOtp(formatPhone(phone), recaptchaId);
      setStep('otp');
    } catch (err: any) {
      setLocalError(err?.message ?? 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const user = await verifyOtp(otp.trim());
      onLogin(user.email ?? user.uid);
      onClose();
    } catch (err: any) {
      setLocalError(err?.message ?? 'Invalid OTP. Please try again.');
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setLocalError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          <button onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {step === 'phone' ? 'Sign in with Mobile' : 'Verify OTP'}
              </h2>
              <p className="text-slate-500 text-sm">
                {step === 'phone'
                  ? 'Enter your mobile number to receive an OTP'
                  : `OTP sent to +91 ${phone}`}
              </p>
            </div>

            {displayError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{displayError}</p>
              </motion.div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium select-none">+91</span>
                  <input
                    id="client-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    required
                    maxLength={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-20 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none tracking-widest"
                  />
                </div>
                {/* Invisible reCAPTCHA container */}
                <div id={recaptchaId} />
                <button type="submit" disabled={otpLoading || phone.length < 10}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {otpLoading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  id="client-otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center text-xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <button type="submit" disabled={otpLoading || otp.length < 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {otpLoading ? 'Verifying…' : 'Verify & Continue'}
                </button>
                <button type="button" onClick={handleBack}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium py-2 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Change number / Resend OTP
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

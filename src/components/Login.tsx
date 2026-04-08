import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MapPin, Home, AlertCircle, Loader2, Phone, X, ArrowRight, RotateCcw } from 'lucide-react';
import Logo from './Logo';
import { useOtpForm } from '../hooks/useOtpForm';
import { getClientProfile } from '../hooks/useClientProfile';
import ClientSignupModal from './ClientSignupModal';
import type { AppRole, AuthUser } from '../hooks/useAuth';
import { TEST_IDS } from '../constants/testIds';

interface LoginProps {
  onLogin: (role: AppRole, name: string) => void;
  onClose?: () => void;
  variant?: 'page' | 'modal';
}

function ErrorBanner({ message }: Readonly<{ message: string }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={TEST_IDS.LOGIN.ERROR_BANNER}
      className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"
    >
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </motion.div>
  );
}

function OtpBoxes({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleInput(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.split('');
    chars[idx] = digit;
    const next = chars.join('').slice(0, 6);
    onChange(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const chars = value.split('');
        chars[idx] = '';
        onChange(chars.join(''));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text) {
      onChange(text);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          data-testid={TEST_IDS.LOGIN.OTP_BOX(i)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          placeholder="·"
          onChange={e => handleInput(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className="w-11 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-300"
        />
      ))}
    </div>
  );
}

export default function Login({ onLogin, onClose, variant = 'page' }: Readonly<LoginProps>) {
  const [signupUser, setSignupUser] = useState<AuthUser | null>(null);

  const {
    phone, setPhone,
    otp, setOtp,
    step,
    displayError,
    recaptchaId,
    otpLoading,
    handleSendOtp,
    handleVerifyOtp,
    handleBack,
  } = useOtpForm({
    onSuccess: async (user: AuthUser) => {
      const role = user.role ?? 'client';
      if (role === 'client') {
        try {
          const profile = await getClientProfile(user.uid);
          if (profile) {
            onLogin(role, profile.name);
            return;
          }
        } catch {
          // Permission error or network issue — treat as new user
        }
        setSignupUser(user);
      } else {
        onLogin(role, user.displayName ?? user.email ?? user.uid);
      }
    },
  });
  const isModal = variant === 'modal';

  if (signupUser) {
    return (
      <ClientSignupModal
        uid={signupUser.uid}
        phone={phone}
        onComplete={(name) => onLogin('client', name)}
      />
    );
  }

  return (
    <div
      data-testid={TEST_IDS.LOGIN.MODAL}
      className={
        isModal
          ? 'fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4'
          : 'min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden'
      }
    >
      {!isModal && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-purple-400/20 to-indigo-400/20 blur-[120px]"
            />
            <motion.div
              animate={{ rotate: [360, 0], scale: [1, 1.5, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-indigo-400/20 to-purple-400/20 blur-[120px]"
            />
          </div>
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-[15%] hidden lg:flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100">
            <Home className="w-8 h-8 text-indigo-500" />
          </motion.div>
          <motion.div animate={{ y: [0, 25, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-1/3 right-[15%] hidden lg:flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-slate-100">
            <MapPin className="w-10 h-10 text-purple-500" />
          </motion.div>
          <motion.div animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/3 right-[20%] hidden lg:flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-xl shadow-purple-500/10 border border-slate-100">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </motion.div>
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
        className={`w-full max-w-[440px] bg-white/70 backdrop-blur-2xl border border-white/50 p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative z-10 ${isModal ? 'max-h-[92vh] overflow-y-auto' : ''}`}
      >
        {isModal && onClose && (
          <button type="button" onClick={onClose}
            data-testid={TEST_IDS.LOGIN.CLOSE_BTN}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/90 rounded-full transition-colors"
            aria-label="Close login">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-10">
          <Logo className="h-16" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Howzy</h2>
          <p className="text-slate-500 font-medium">
            {step === 'phone' ? 'Enter your mobile number to sign in' : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {displayError && <ErrorBanner message={displayError} />}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <div className="flex items-center gap-2 pl-4 pr-3 self-stretch border-r border-slate-200 shrink-0">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-700 select-none">+91</span>
              </div>
              <input
                id="login-phone"
                data-testid={TEST_IDS.LOGIN.PHONE_INPUT}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number"
                required
                maxLength={10}
                className="flex-1 bg-transparent py-3.5 px-4 text-base font-sans text-slate-800 text-center outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
              />
            </div>
            {/* Invisible reCAPTCHA container */}
            <div id={recaptchaId} />
            <motion.button whileHover={{ scale: otpLoading ? 1 : 1.01 }} whileTap={{ scale: otpLoading ? 1 : 0.99 }}
              type="submit" disabled={otpLoading || phone.length < 10}
              data-testid={TEST_IDS.LOGIN.SEND_OTP_BTN}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg">
              {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {otpLoading ? 'Sending OTP…' : 'Send OTP'}
            </motion.button>
            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              Protected by reCAPTCHA —{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Privacy</a>
              {' & '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Terms</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <OtpBoxes value={otp} onChange={setOtp} />
            <motion.button whileHover={{ scale: otpLoading ? 1 : 1.01 }} whileTap={{ scale: otpLoading ? 1 : 0.99 }}
              type="submit" disabled={otpLoading || otp.length < 6}
              data-testid={TEST_IDS.LOGIN.VERIFY_OTP_BTN}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg">
              {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {otpLoading ? 'Verifying…' : 'Verify OTP'}
            </motion.button>
            <button type="button" onClick={handleBack}
              data-testid={TEST_IDS.LOGIN.BACK_RESEND_BTN}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium py-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Change number / Resend OTP
            </button>
          </form>
        )}

      </motion.div>
    </div>
  );
}

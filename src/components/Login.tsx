import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MapPin, Home, AlertCircle, Loader2, Mail, Lock, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import type { AppRole } from '../hooks/useAuth';

interface LoginProps {
  onLogin: (role: AppRole, email: string) => void;
  onClose?: () => void;
  variant?: 'page' | 'modal';
}

interface ErrorBannerProps {
  message: string;
}

interface GoogleSignInButtonProps {
  loading: boolean;
  onClick: () => void;
}

interface EmailPasswordFormProps {
  loading: boolean;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: () => void;
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function ErrorBanner({ message }: Readonly<ErrorBannerProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"
    >
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </motion.div>
  );
}

function GoogleSignInButton({
  loading,
  onClick,
}: Readonly<GoogleSignInButtonProps>) {
  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 font-bold py-4 rounded-2xl transition-all border border-slate-200 shadow-md hover:shadow-lg"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <GoogleIcon />}
      {loading ? 'Signing in…' : 'Continue with Google'}
    </motion.button>
  );
}

function EmailPasswordForm({
  loading,
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
}: Readonly<EmailPasswordFormProps>) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
        {loading ? 'Signing in…' : 'Sign in with Email'}
      </motion.button>
    </form>
  );
}

export default function Login({ onLogin, onClose, variant = 'page' }: Readonly<LoginProps>) {
  const { signInWithGoogle, signInWithEmailPassword, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isModal = variant === 'modal';

  const authenticate = async (
    signInAction: () => Promise<{ role: AppRole; email: string | null }>,
    fallbackMessage: string
  ) => {
    setLoading(true);
    setLocalError(null);
    try {
      const user = await signInAction();
      onLogin(user.role ?? 'client', user.email ?? '');
    } catch (err: any) {
      setLocalError(err?.message ?? fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    void authenticate(signInWithGoogle, 'Sign-in failed. Please try again.');
  };

  const handleEmailPasswordSignIn = () => {
    void authenticate(
      () => signInWithEmailPassword(email.trim(), password),
      'Sign-in failed. Please check your credentials.'
    );
  };

  const displayError = localError ?? error;

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4'
          : 'min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden'
      }
    >
      {!isModal && (
        <>
          {/* Animated Background */}
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

          {/* Floating Icons */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-[15%] hidden lg:flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100"
          >
            <Home className="w-8 h-8 text-indigo-500" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 25, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-1/3 right-[15%] hidden lg:flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-slate-100"
          >
            <MapPin className="w-10 h-10 text-purple-500" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/3 right-[20%] hidden lg:flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-xl shadow-purple-500/10 border border-slate-100"
          >
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
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/90 rounded-full transition-colors"
            aria-label="Close login"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-10">
          <Logo className="h-16" />
        </div>

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Howzy</h2>
          <p className="text-slate-500 font-medium">
            Sign in to access your dashboard
          </p>
        </div>

        {displayError && <ErrorBanner message={displayError} />}

        <div className="space-y-5">
          <EmailPasswordForm
            loading={loading}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            onSubmit={handleEmailPasswordSignIn}
          />

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleSignInButton loading={loading} onClick={handleGoogleSignIn} />
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
          Your role (Admin, Agent, Partner, or Client) is determined by your account.
          <br />
          Contact your administrator if you need access.
        </p>
      </motion.div>
    </div>
  );
}

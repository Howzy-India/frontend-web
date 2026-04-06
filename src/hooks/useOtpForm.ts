import { useState, useId } from 'react';
import { useAuth } from './useAuth';
import type { AuthUser } from './useAuth';

interface UseOtpFormOptions {
  onSuccess: (user: AuthUser) => void;
}

/** Translate raw Firebase error messages into user-friendly copy. */
function friendlyOtpError(err: unknown): string {
  const msg = (err as Error)?.message ?? '';
  if (msg.includes('too-many-requests')) {
    return 'Too many OTP attempts. Please wait a few minutes before trying again.';
  }
  if (msg.includes('invalid-phone-number') || msg.includes('INVALID_PHONE_NUMBER')) {
    return 'Invalid mobile number. Please enter a valid 10-digit Indian number.';
  }
  if (msg.includes('invalid-verification-code') || msg.includes('INVALID_CODE')) {
    return 'Incorrect OTP. Please check and try again.';
  }
  if (msg.includes('code-expired') || msg.includes('CODE_EXPIRED')) {
    return 'OTP has expired. Please go back and request a new one.';
  }
  if (msg.includes('network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (msg.includes('captcha-check-failed') || msg.includes('CAPTCHA')) {
    return 'reCAPTCHA verification failed. Please refresh the page and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function useOtpForm({ onSuccess }: UseOtpFormOptions) {
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
    } catch (err: unknown) {
      setLocalError(friendlyOtpError(err));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const user = await verifyOtp(otp.trim());
      onSuccess(user);
    } catch (err: unknown) {
      setLocalError(friendlyOtpError(err));
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setLocalError(null);
  };

  return {
    phone, setPhone,
    otp, setOtp,
    step,
    localError,
    displayError,
    recaptchaId,
    otpLoading,
    handleSendOtp,
    handleVerifyOtp,
    handleBack,
  };
}

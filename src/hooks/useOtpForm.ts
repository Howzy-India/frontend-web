import { useState, useId } from 'react';
import { useAuth } from './useAuth';

interface UseOtpFormOptions {
  onSuccess: (emailOrUid: string) => void;
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
      setLocalError((err as Error)?.message ?? 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const user = await verifyOtp(otp.trim());
      onSuccess(user.email ?? user.uid);
    } catch (err: unknown) {
      setLocalError((err as Error)?.message ?? 'Invalid OTP. Please try again.');
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

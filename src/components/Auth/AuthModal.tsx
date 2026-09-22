import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Zap,
  Cloud,
  UserCheck
} from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp, isSupabaseConfigured } from '../../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setStep('email');
      setOtpCode('');
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // If Supabase keys are not set up yet, provide immediate friendly feedback
      setIsLoading(false);
      setErrorMessage('Supabase credentials are not detected in environment. You can use 1-Click Demo Login below or configure .env to enable live email OTP.');
      return;
    }

    const { error } = await sendEmailOtp(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setStep('otp');
      setCountdown(45); // 45-second cooldown for resend
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const { user, error } = await verifyEmailOtp(email, cleanOtp);
    setIsLoading(false);

    if (error || !user) {
      setErrorMessage(error || 'Invalid or expired verification code. Please try again.');
    } else {
      setStep('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 1200);
    }
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      setTimeout(() => {
        onLoginSuccess('alex@apexhandyman.com.au');
        onClose();
      }, 900);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl max-w-md w-full shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <KeyRound className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Handyman Sign In</span>
                <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.5 rounded font-bold">
                  Email OTP
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Persistent Profile & Cloud Job Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-900">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: EMAIL ENTRY */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Handyman Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  We'll send a free 6-digit one-time passcode. No password needed.
                </p>
              </div>

              {/* Benefits Checklist */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Profile, ABN & Bank EFT details stay saved forever</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Cloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Quotes and work orders sync seamlessly across devices</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Free instant login with zero SMS fees</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending 6-Digit Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">or instant access</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* 1-Click Demo Login */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-700 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1-Click Demo Login (Alex Miller • Point Cook)</span>
              </button>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Check Your Email</h3>
                <p className="text-xs text-slate-500">
                  We sent a 6-digit code to <span className="font-bold text-slate-700">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Change email address
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </button>

              {/* Resend link */}
              <div className="text-center pt-2">
                {countdown > 0 ? (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Resend code in <strong className="text-slate-600 font-mono">{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-1 mx-auto hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend 6-Digit Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">Signed In Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your profile, ABN, and handyman jobs are now securely synced and saved forever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

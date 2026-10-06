import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
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
  UserCheck,
  UserPlus,
  Database,
  HelpCircle
} from 'lucide-react';
import {
  signInWithPassword,
  signUpWithPassword,
  sendPasswordReset,
  sendEmailOtp,
  verifyEmailOtp,
  isSupabaseConfigured
} from '../../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

type AuthMode = 'password_login' | 'register' | 'otp_request' | 'otp_verify' | 'forgot_password' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('password_login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setMode('password_login');
      setPassword('');
      setOtpCode('');
      setErrorMessage(null);
      setInfoMessage(null);
      setIsLoading(false);
      setShowStorageInfo(false);
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

  // Focus OTP input when mode changes to 'otp_verify'
  useEffect(() => {
    if (mode === 'otp_verify') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [mode]);

  if (!isOpen) return null;

  // 1. Password Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // Local fallback mode when Supabase is unconfigured
      setTimeout(() => {
        setIsLoading(false);
        setMode('success');
        setTimeout(() => {
          onLoginSuccess(email);
          onClose();
        }, 1000);
      }, 500);
      return;
    }

    const { user, error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error || !user) {
      setErrorMessage(error || 'Invalid email or password. Please try again.');
    } else {
      setMode('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 1000);
    }
  };

  // 2. Register / Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide an email and a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        setMode('success');
        setTimeout(() => {
          onLoginSuccess(email);
          onClose();
        }, 1000);
      }, 500);
      return;
    }

    const { user, error } = await signUpWithPassword(email, password, fullName);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      setMode('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 1000);
    }
  };

  // 3. Send Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setInfoMessage('Password reset link simulated. Please configure Supabase for live email sending.');
      return;
    }

    const { error } = await sendPasswordReset(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setInfoMessage(`A password reset link has been sent to ${email}. Check your inbox.`);
    }
  };

  // 4. Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setErrorMessage('Supabase is not configured yet. You can use 1-Click Demo Login or Username/Password.');
      return;
    }

    const { error } = await sendEmailOtp(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setMode('otp_verify');
      setCountdown(45);
    }
  };

  // 5. Verify OTP
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
      setErrorMessage(error || 'Invalid or expired verification code.');
    } else {
      setMode('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 1000);
    }
  };

  // 6. 1-Click Demo Login
  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMode('success');
      setTimeout(() => {
        onLoginSuccess('alex@apexhandyman.com.au');
        onClose();
      }, 800);
    }, 300);
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
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Handyman Sign In</span>
                <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.5 rounded font-bold">
                  PRO
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Secure Account & Cloud Database Sync
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

        {/* Auth Mode Tabs (Password vs Sign Up vs OTP) */}
        {mode !== 'success' && (
          <div className="flex items-center p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 select-none">
            <button
              type="button"
              onClick={() => {
                setMode('password_login');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'password_login' || mode === 'forgot_password'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('otp_request');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'otp_request' || mode === 'otp_verify'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-900">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Info Message Toast */}
          {infoMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="flex-1 leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {/* TAB 1: PASSWORD SIGN IN */}
          {mode === 'password_login' && (
            <form onSubmit={handlePasswordSignIn} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER / CREATE ACCOUNT */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name or Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Alex Miller (Apex Handyman)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Account & Sync</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your email address and we'll send you a password reset link.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Password Reset Link</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('password_login')}
                className="w-full text-center text-xs text-blue-600 font-bold hover:underline block pt-1"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* TAB 4: EMAIL OTP REQUEST */}
          {mode === 'otp_request' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address (Passwordless)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We'll send a 6-digit one-time code. No password needed.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending 6-Digit Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 5: OTP VERIFY */}
          {mode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Enter Verification Code</h3>
                <p className="text-xs text-slate-500">
                  We sent a 6-digit code to <span className="font-bold text-slate-700">{email}</span>
                </p>
              </div>

              <div>
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
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
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

              <div className="text-center pt-1">
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

          {/* TAB 6: SUCCESS */}
          {mode === 'success' && (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">Signed In Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your profile, ABN, and handyman jobs are now securely synced and saved in your database.
              </p>
            </div>
          )}

          {/* 1-Click Instant Demo Login (for sandbox preview) */}
          {mode !== 'success' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-700 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1-Click Demo Login (Alex Miller • Point Cook)</span>
              </button>

              {/* Database & Storage Explanation Toggle */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowStorageInfo(!showStorageInfo)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                >
                  <Database className="w-3 h-3 text-slate-400" />
                  <span>Where is my data stored?</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {showStorageInfo && (
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dual Storage Architecture</span>
                  </div>
                  <p>
                    <strong>1. Cloud Database (Supabase PostgreSQL):</strong> All client jobs, ABN settings, quotes, and work orders are securely stored in a PostgreSQL database with Row Level Security.
                  </p>
                  <p>
                    <strong>2. Browser Cache (LocalStorage):</strong> A local replica is saved in your browser so HandyMap works seamlessly even with spotty cellular connection on the road.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

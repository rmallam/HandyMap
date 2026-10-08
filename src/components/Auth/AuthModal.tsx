import React, { useState, useEffect } from 'react';
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
  UserCheck,
  UserPlus,
  Database,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import {
  signInWithPassword,
  signUpWithPassword,
  sendPasswordReset,
  sendEmailOtp,
  isSupabaseConfigured
} from '../../services/supabase';
import { triggerHapticFeedback } from '../../services/nativeMobile';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

type AuthMode = 'password_login' | 'register' | 'magic_link' | 'forgot_password' | 'link_sent' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('password_login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setMode('password_login');
      setPassword('');
      setErrorMessage(null);
      setInfoMessage(null);
      setIsLoading(false);
      setShowStorageInfo(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Password Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    triggerHapticFeedback('light');
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        triggerHapticFeedback('success');
        setMode('success');
        setTimeout(() => {
          onLoginSuccess(email);
          onClose();
        }, 700);
      }, 300);
      return;
    }

    const { user, error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error || !user) {
      triggerHapticFeedback('error');
      setErrorMessage(
        error || 'Invalid email or password. If you have not created an account yet, click Create Account below.'
      );
    } else {
      triggerHapticFeedback('success');
      setMode('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 700);
    }
  };

  // 2. Register / Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both an email and a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    triggerHapticFeedback('light');
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        triggerHapticFeedback('success');
        setMode('success');
        setTimeout(() => {
          onLoginSuccess(email);
          onClose();
        }, 700);
      }, 300);
      return;
    }

    const { user, error } = await signUpWithPassword(email, password, fullName);
    setIsLoading(false);

    if (error) {
      triggerHapticFeedback('error');
      setErrorMessage(error);
    } else if (user) {
      triggerHapticFeedback('success');
      setMode('success');
      setTimeout(() => {
        onLoginSuccess(user.email || email);
        onClose();
      }, 700);
    }
  };

  // 3. Send Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    triggerHapticFeedback('light');
    setErrorMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setInfoMessage('Password reset link simulated.');
      return;
    }

    const { error } = await sendPasswordReset(email);
    setIsLoading(false);

    if (error) {
      triggerHapticFeedback('error');
      setErrorMessage(error);
    } else {
      triggerHapticFeedback('success');
      setInfoMessage(`A password reset link has been sent to ${email}. Check your inbox.`);
    }
  };

  // 4. Send 1-Click Magic Link
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    triggerHapticFeedback('light');
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setErrorMessage('Supabase credentials not configured.');
      return;
    }

    const { error } = await sendEmailOtp(email);
    setIsLoading(false);

    if (error) {
      triggerHapticFeedback('error');
      setErrorMessage(error);
    } else {
      triggerHapticFeedback('success');
      setMode('link_sent');
    }
  };

  // 5. 1-Click Demo Login
  const handleQuickDemoLogin = () => {
    triggerHapticFeedback('light');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      triggerHapticFeedback('success');
      setMode('success');
      setTimeout(() => {
        onLoginSuccess('alex@apexhandyman.com.au');
        onClose();
      }, 600);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl max-w-md w-full shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden flex flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
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
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Isolated Database & Profile Management
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Segmented Bar */}
        {mode !== 'success' && mode !== 'link_sent' && (
          <div className="flex items-center p-1.5 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-600 select-none">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setMode('password_login');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'password_login' || mode === 'forgot_password'
                  ? 'bg-white text-blue-600 shadow-sm font-black'
                  : 'hover:text-slate-900 font-semibold'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setMode('register');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm font-black'
                  : 'hover:text-slate-900 font-semibold'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setMode('magic_link');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'magic_link'
                  ? 'bg-white text-blue-600 shadow-sm font-black'
                  : 'hover:text-slate-900 font-semibold'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Link</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-900">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex flex-col gap-1.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
              </div>

              {mode === 'password_login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline text-left pl-6"
                >
                  Click here to register this account with a password →
                </button>
              )}
            </div>
          )}

          {/* Info Message Toast */}
          {infoMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="flex-1 leading-relaxed font-medium">{infoMessage}</div>
            </div>
          )}

          {/* TAB 1: PASSWORD SIGN IN */}
          {mode === 'password_login' && (
            <form onSubmit={handlePasswordSignIn} className="space-y-3.5">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setMode('forgot_password');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-bold"
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
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Handyman Portal</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER / CREATE ACCOUNT */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
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
                      placeholder="Choose a secure password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Register Account & Log In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your email to receive a secure password reset link.
                </p>
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. alex@apexhandyman.com.au"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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

          {/* TAB 4: 1-CLICK MAGIC LINK */}
          {mode === 'magic_link' && (
            <form onSubmit={handleSendMagicLink} className="space-y-3.5">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  We will email you a secure 1-click passwordless link to sign in automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Sign-In Link to Email</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 5: LINK SENT NOTIFICATION */}
          {mode === 'link_sent' && (
            <div className="py-4 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Check Your Email</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                We sent a sign-in link to <strong className="text-slate-800">{email}</strong>. Open the email on this device and tap the link to log in automatically.
              </p>
              <button
                type="button"
                onClick={() => setMode('password_login')}
                className="text-xs text-blue-600 font-bold hover:underline block mx-auto pt-2"
              >
                ← Back to Password Login
              </button>
            </div>
          )}

          {/* TAB 6: SUCCESS */}
          {mode === 'success' && (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900">Signed In Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your profile, ABN, and handyman jobs are securely loaded.
              </p>
            </div>
          )}

          {/* 1-Click Demo Login Button */}
          {mode !== 'success' && mode !== 'link_sent' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/80 text-indigo-700 font-black text-xs shadow-xs transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1-Click Demo Preview (Alex Miller • Point Cook)</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowStorageInfo(!showStorageInfo)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1"
                >
                  <Database className="w-3 h-3 text-slate-400" />
                  <span>How is my data stored?</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {showStorageInfo && (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <div className="font-black text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Multi-Tenant PostgreSQL Isolation</span>
                  </div>
                  <p className="leading-relaxed">
                    Every handyman has a private account. Your database records are strictly isolated to your user account and are never visible to other users.
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

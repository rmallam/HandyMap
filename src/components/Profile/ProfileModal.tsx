import React, { useState, useEffect } from 'react';
import { HandymanProfile } from '../../types';
import {
  X,
  UserCheck,
  Building,
  CreditCard,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  Cloud,
  ShieldCheck,
  LogIn,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Sparkles,
  Building2,
  Lock
} from 'lucide-react';
import { triggerHapticFeedback } from '../../services/nativeMobile';

interface ProfileModalProps {
  isOpen: boolean;
  profile: HandymanProfile;
  currentUserEmail?: string | null;
  onClose: () => void;
  onSaveProfile: (updatedProfile: HandymanProfile) => void;
  onOpenAuth?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  currentUserEmail,
  onClose,
  onSaveProfile,
  onOpenAuth
}) => {
  const [formData, setFormData] = useState<HandymanProfile>({ ...profile });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback('success');
    onSaveProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl max-w-2xl w-full shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden max-h-[92dvh] flex flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Handyman Profile & Invoicing</span>
                <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                  AU Business
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                Configure trade identity, ABN, GST, labor rates & PayID EFT details
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

        {/* Cloud Persistence Status Banner */}
        <div className="px-4 sm:px-6 pt-4 pb-0">
          {currentUserEmail ? (
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold flex items-center gap-1.5">
                    <span>Cloud Sync Active</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                      {currentUserEmail}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your profile and ABN are permanently encrypted in Supabase and sync seamlessly across devices.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold">Local Offline Storage</div>
                  <p className="text-[11px] text-amber-700">
                    Data saved on this device. Sign in with Email OTP to back up your invoices permanently.
                  </p>
                </div>
              </div>

              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('light');
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 transition flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-900">
          
          {/* CARD 1: Business Identity & ABN */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                1. Trade Identity & Australian Business Number (ABN)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Printed on Quotes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Apex Handyman & Maintenance"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Australian Business Number (ABN) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.abn}
                  onChange={e => setFormData({ ...formData, abn: e.target.value })}
                  placeholder="e.g. 83 912 405 618"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Proprietor / Handyman Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Miller"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0412 890 442"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Primary Email (Quotes & Invoicing Sender) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@apexhandyman.com.au"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Operating Base & Hourly Rates */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                2. Operating Base & Hourly Labor Rates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Operating Hub / Home Base Address (Route Starting Point)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={formData.baseAddress}
                    onChange={e => setFormData({ ...formData, baseAddress: e.target.value })}
                    placeholder="e.g. Point Cook Town Centre, Point Cook VIC 3030"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Default Labor Rate (AUD / Hour)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    step="5"
                    value={formData.defaultHourlyRate}
                    onChange={e => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  GST Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={formData.taxRatePercent}
                    onChange={e => setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none transition"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: PayID & EFT Banking Details */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                3. Direct Deposit EFT & Australian PayID
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Auto-added to Invoices
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. Commonwealth Bank / ANZ"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName || ''}
                  onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g. Apex Handyman Pty Ltd"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  BSB Number
                </label>
                <input
                  type="text"
                  value={formData.bsb || ''}
                  onChange={e => setFormData({ ...formData, bsb: e.target.value })}
                  placeholder="e.g. 063-875"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 1048 9921"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Invoice Payment Terms & Bank Remittance Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.paymentTerms || ''}
                  onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g. Payment due within 7 days of invoice issue. Direct deposit EFT or on-site PayID / Card tap."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none resize-none transition"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Profile Saved & Synced!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Profile & Invoicing Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

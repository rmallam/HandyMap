import React, { useState } from 'react';
import { HandymanProfile } from '../../types';
import {
  X,
  UserCheck,
  Building,
  CreditCard,
  Percent,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  profile: HandymanProfile;
  onClose: () => void;
  onSaveProfile: (updatedProfile: HandymanProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile
}) => {
  const [formData, setFormData] = useState<HandymanProfile>({ ...profile });
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Building className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>Handyman Profile & Invoicing</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Configure your trade identity, ABN, GST, rates, and EFT payment details.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* Section 1: Business Identity & ABN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Trade Identity & Australian Business Number (ABN)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Apex Handyman & Maintenance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                  <span>Australian Business Number (ABN) *</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Appears on all Quotes</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.abn}
                  onChange={e => setFormData({ ...formData, abn: e.target.value })}
                  placeholder="e.g. 83 912 405 618"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Proprietor / Handyman Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Miller"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0412 890 442"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Business Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. contact@apexhandyman.com.au"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Workshop Base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Percent className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Pricing Defaults & Base Workshop Location
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Default Hourly Labor Rate ($ AUD/hr) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="20"
                    step="5"
                    required
                    value={formData.defaultHourlyRate}
                    onChange={e => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  GST / Tax Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={formData.taxRatePercent}
                    onChange={e => setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Base Workshop / Home Dispatch Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.baseAddress}
                  onChange={e => setFormData({ ...formData, baseAddress: e.target.value })}
                  placeholder="e.g. Point Cook Town Centre, Point Cook VIC 3030"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Direct Deposit (EFT) Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Direct Deposit (EFT) Bank Details for Invoices & Quotes
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. Commonwealth Bank of Australia"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName || ''}
                  onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g. Apex Handyman Pty Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  BSB Number
                </label>
                <input
                  type="text"
                  value={formData.bsb || ''}
                  onChange={e => setFormData({ ...formData, bsb: e.target.value })}
                  placeholder="e.g. 063-875"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 1048 9921"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Invoice Payment Terms & Standard Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.paymentTerms || ''}
                  onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g. Payment due within 7 days of invoice issue. Direct deposit EFT or on-site card tap."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none resize-none transition"
                />
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
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

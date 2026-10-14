import React, { useState, useEffect } from 'react';
import { HandymanProfile, QuickMessageTemplates } from '../../types';
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
  Lock,
  MessageSquare,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { DEFAULT_MESSAGE_TEMPLATES, interpolateTemplate } from '../../utils/messageTemplates';
import { formatPhoneNumber, isValid10DigitPhone, getPhoneDigitCount } from '../../utils/phoneUtils';

type TemplateKey = keyof QuickMessageTemplates;

interface TemplateMeta {
  key: TemplateKey;
  label: string;
  badge: string;
  description: string;
  availableTags: { tag: string; label: string }[];
}

const TEMPLATE_CONFIGS: TemplateMeta[] = [
  {
    key: 'onMyWay',
    label: 'On My Way',
    badge: 'En Route',
    description: 'Sent when heading to job location via Job Sheet, Route Planner, or Map.',
    availableTags: [
      { tag: '{clientName}', label: 'Client' },
      { tag: '{handymanName}', label: 'Your Name' },
      { tag: '{businessName}', label: 'Business' },
      { tag: '{address}', label: 'Address' },
      { tag: '{eta}', label: 'ETA' }
    ]
  },
  {
    key: 'quoteReady',
    label: 'Quote Ready',
    badge: 'Estimates',
    description: 'Sent to notify client that their quote estimate is ready for review.',
    availableTags: [
      { tag: '{clientName}', label: 'Client' },
      { tag: '{jobTitle}', label: 'Job Title' },
      { tag: '{quoteTotal}', label: 'Quote Total' },
      { tag: '{businessName}', label: 'Business' }
    ]
  },
  {
    key: 'runningLate',
    label: 'Running Late',
    badge: 'Alert',
    description: 'Quick alert sent if delayed en route due to traffic or prior job.',
    availableTags: [
      { tag: '{clientName}', label: 'Client' },
      { tag: '{handymanName}', label: 'Your Name' },
      { tag: '{address}', label: 'Address' }
    ]
  },
  {
    key: 'jobCompleted',
    label: 'Completed',
    badge: 'Sign-off',
    description: 'Sent when work is marked complete to thank client & introduce invoice.',
    availableTags: [
      { tag: '{clientName}', label: 'Client' },
      { tag: '{jobTitle}', label: 'Job Title' },
      { tag: '{address}', label: 'Address' },
      { tag: '{businessName}', label: 'Business' }
    ]
  },
  {
    key: 'agencyUpdate',
    label: 'PM / Agency',
    badge: 'Real Estate',
    description: 'Sent to real estate agency / property manager regarding work order status.',
    availableTags: [
      { tag: '{agentName}', label: 'Agent' },
      { tag: '{handymanName}', label: 'Your Name' },
      { tag: '{businessName}', label: 'Business' },
      { tag: '{workOrderNumber}', label: 'WO #' },
      { tag: '{address}', label: 'Address' },
      { tag: '{jobStatus}', label: 'Status' }
    ]
  },
  {
    key: 'tenantArrival',
    label: 'Tenant SMS',
    badge: 'Tenants 1 & 2',
    description: 'Sent directly to Tenant 1 or Tenant 2 prior to on-site arrival.',
    availableTags: [
      { tag: '{tenantName}', label: 'Tenant' },
      { tag: '{handymanName}', label: 'Your Name' },
      { tag: '{businessName}', label: 'Business' },
      { tag: '{jobTitle}', label: 'Job Title' },
      { tag: '{address}', label: 'Address' }
    ]
  }
];

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
  const [formData, setFormData] = useState<HandymanProfile>({
    ...profile,
    messageTemplates: {
      ...DEFAULT_MESSAGE_TEMPLATES,
      ...(profile.messageTemplates || {})
    }
  });
  const [isSaved, setIsSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [activeTemplateKey, setActiveTemplateKey] = useState<TemplateKey>('onMyWay');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...profile,
        messageTemplates: {
          ...DEFAULT_MESSAGE_TEMPLATES,
          ...(profile.messageTemplates || {})
        }
      });
      setPhoneError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && !isValid10DigitPhone(formData.phone)) {
      setPhoneError('Australian contact phone number must have exactly 10 digits (e.g. 0412 890 442).');
      triggerHapticFeedback('warning');
      return;
    }
    triggerHapticFeedback('success');
    onSaveProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleTemplateChange = (key: TemplateKey, value: string) => {
    setFormData(prev => ({
      ...prev,
      messageTemplates: {
        ...DEFAULT_MESSAGE_TEMPLATES,
        ...(prev.messageTemplates || {}),
        [key]: value
      }
    }));
  };

  const handleInsertTag = (key: TemplateKey, tag: string) => {
    triggerHapticFeedback('light');
    const currentVal = formData.messageTemplates?.[key] ?? DEFAULT_MESSAGE_TEMPLATES[key] ?? '';
    const needsSpace = currentVal.length > 0 && !currentVal.endsWith(' ');
    const updated = currentVal + (needsSpace ? ' ' : '') + tag;
    handleTemplateChange(key, updated);
  };

  const handleResetSingleTemplate = (key: TemplateKey) => {
    triggerHapticFeedback('light');
    handleTemplateChange(key, DEFAULT_MESSAGE_TEMPLATES[key]);
  };

  const handleResetAllTemplates = () => {
    triggerHapticFeedback('light');
    setFormData(prev => ({
      ...prev,
      messageTemplates: { ...DEFAULT_MESSAGE_TEMPLATES }
    }));
  };

  const activeConfig = TEMPLATE_CONFIGS.find(c => c.key === activeTemplateKey) || TEMPLATE_CONFIGS[0];
  const activeTemplateValue = formData.messageTemplates?.[activeTemplateKey] ?? DEFAULT_MESSAGE_TEMPLATES[activeTemplateKey] ?? '';

  const samplePreviewText = interpolateTemplate(activeTemplateValue, {
    clientName: 'Sarah Jenkins',
    handymanName: formData.name?.trim() || 'Alex',
    businessName: formData.businessName?.trim() || 'Apex Handyman',
    jobTitle: 'Timber Decking Repair',
    address: '42 Boardwalk Blvd, Point Cook',
    quoteTotal: '$380.00',
    agentName: 'Ray White Real Estate',
    tenantName: 'Michael Taylor',
    workOrderNumber: 'WO #8821',
    jobStatus: 'IN PROGRESS',
    eta: '15-20 mins'
  });

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
          
          {phoneError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{phoneError}</span>
            </div>
          )}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    Contact Phone Number *
                  </label>
                  {formData.phone && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded transition ${
                      getPhoneDigitCount(formData.phone) === 10
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {getPhoneDigitCount(formData.phone) === 10 ? '10 digits ✓' : `${getPhoneDigitCount(formData.phone)}/10 digits`}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => {
                      setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) });
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="e.g. 0412 890 442"
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-900 outline-none transition ${
                      formData.phone && !isValid10DigitPhone(formData.phone)
                        ? 'border-amber-400 focus:border-amber-500'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
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

          {/* CARD 4: Quick SMS & Notification Templates */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  4. Quick SMS & Notification Templates
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Customize the 1-click SMS messages sent to clients, tenants & property managers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAllTemplates}
                className="self-start sm:self-auto text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Reset all message templates to system defaults"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset All Defaults</span>
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {TEMPLATE_CONFIGS.map(cfg => {
                const isSelected = activeTemplateKey === cfg.key;
                const isModified = formData.messageTemplates?.[cfg.key] && formData.messageTemplates[cfg.key] !== DEFAULT_MESSAGE_TEMPLATES[cfg.key];
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setActiveTemplateKey(cfg.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    {isModified && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-blue-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Template Editor Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>{activeConfig.label}</span>
                    <span className="text-[9px] uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {activeConfig.badge}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeConfig.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleResetSingleTemplate(activeConfig.key)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  Reset this
                </button>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={3}
                  value={activeTemplateValue}
                  onChange={e => handleTemplateChange(activeConfig.key, e.target.value)}
                  placeholder="Enter message template with {placeholders}..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Dynamic Tag Pills */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Tap to Insert Dynamic Tags into Message:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeConfig.availableTags.map(tagItem => (
                    <button
                      key={tagItem.tag}
                      type="button"
                      onClick={() => handleInsertTag(activeConfig.key, tagItem.tag)}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-mono font-semibold transition flex items-center gap-1 active:scale-95"
                    >
                      <span className="text-blue-500">+</span>
                      <span>{tagItem.tag}</span>
                      <span className="text-[9px] text-blue-400 font-sans font-normal">({tagItem.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Bubble */}
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Client SMS Live Preview:</span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs">
                  {samplePreviewText || <span className="text-slate-400 italic">No text entered</span>}
                </div>
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

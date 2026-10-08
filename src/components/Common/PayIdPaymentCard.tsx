import React, { useState } from 'react';
import { HandymanProfile } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { QrCode, Copy, Check, Smartphone, Landmark, ShieldCheck } from 'lucide-react';

interface PayIdPaymentCardProps {
  amount: number;
  jobNumber: string;
  profile: HandymanProfile;
}

export const PayIdPaymentCard: React.FC<PayIdPaymentCardProps> = ({
  amount,
  jobNumber,
  profile
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const payId = profile.phone || profile.email;
  const bsb = profile.bsb || '063-875';
  const accountNumber = profile.accountNumber || '1048 9921';
  const accountName = profile.accountName || profile.businessName;
  const paymentRef = jobNumber.startsWith('INV') ? jobNumber : `INV-${jobNumber}`;

  const handleCopy = (text: string, fieldName: string) => {
    triggerHapticFeedback('success');
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate standard QR code URL via fast dynamic SVG API (or PayID payload)
  const qrData = `PayID: ${payId}\nBSB: ${bsb}\nAccount: ${accountNumber}\nName: ${accountName}\nAmount: $${amount}\nRef: ${paymentRef}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&color=0f172a&bgcolor=ffffff&qzone=1`;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Instant Australian Payment
            </h4>
            <p className="text-sm font-extrabold text-white">
              PayID / Direct EFT Bank Transfer
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Due</span>
          <span className="text-base font-black text-emerald-400">
            {formatCurrency(amount, profile.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Main Payment Details & QR Code Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Left 2 Cols: PayID & BSB Fields */}
        <div className="sm:col-span-2 flex flex-col gap-2.5 text-xs">
          {/* PayID Box */}
          {payId && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">PayID (Phone / Email)</p>
                  <p className="font-mono font-bold text-slate-100 truncate">{payId}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(payId, 'payid')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0"
              >
                {copiedField === 'payid' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* BSB & Account Box */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">BSB & Account</p>
                <p className="font-mono font-bold text-slate-100">
                  BSB: {bsb} • Acc: {accountNumber}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{accountName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(`${bsb} ${accountNumber}`, 'bsb')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0"
            >
              {copiedField === 'bsb' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Reference # */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400">Payment Ref / Description:</span>
            <span className="font-mono font-bold text-amber-400">{paymentRef}</span>
          </div>
        </div>

        {/* Right 1 Col: Scan-to-Pay QR Code Box */}
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-md border border-slate-200 text-slate-900">
          <img
            src={qrCodeUrl}
            alt="PayID & Bank Transfer QR Code"
            className="w-28 h-28 object-contain rounded-lg"
          />
          <span className="text-[10px] font-bold text-slate-600 mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Scan in Banking App
          </span>
        </div>
      </div>
    </div>
  );
};

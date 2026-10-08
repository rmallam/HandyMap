import React from 'react';
import { Job, RouteStop } from '../../types';
import {
  STATUS_CONFIG,
  formatCurrency,
  calculateDistanceKm,
  buildLiveNavigationUrl,
  buildSmsLink
} from '../../utils/helpers';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import {
  X,
  Phone,
  MessageSquare,
  Navigation2,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Building2
} from 'lucide-react';

interface QuickJobSheetProps {
  job: Job | null;
  routeStop?: RouteStop;
  currentLocation: [number, number];
  onClose: () => void;
  onOpenFullJob: (job: Job) => void;
  onStartRouteToJob?: (job: Job) => void;
}

export const QuickJobSheet: React.FC<QuickJobSheetProps> = ({
  job,
  routeStop,
  currentLocation,
  onClose,
  onOpenFullJob
}) => {
  if (!job) return null;

  const statusCfg = STATUS_CONFIG[job.status];
  const distanceKm = Math.round(
    calculateDistanceKm(
      currentLocation[0],
      currentLocation[1],
      job.coordinates[0],
      job.coordinates[1]
    ) * 10
  ) / 10;

  const liveNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);
  const defaultSmsMsg = `Hi ${job.clientName}, this is Alex from Apex Handyman. I'm reviewing your request for ${job.title}. When is a good time for me to stop by for the quote?`;

  const handleActionTap = (action: () => void) => {
    triggerHapticFeedback('light');
    action();
  };

  return (
    <div className="fixed sm:absolute bottom-[calc(4.8rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-6 sm:w-[410px] z-30 pointer-events-auto transition-all animate-sheet-up">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] shadow-[0_20px_50px_-10px_rgba(15,23,42,0.22)] p-4 sm:p-5 text-slate-900 flex flex-col gap-3.5 ring-1 ring-black/5">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto -mt-0.5 sm:hidden"></div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusCfg.colorHex }}></span>
              {statusCfg.label}
            </span>
            {routeStop && (
              <span className="bg-blue-50 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 shadow-xs">
                <Clock className="w-3 h-3 text-blue-600" /> Stop #{routeStop.stopOrder} ({routeStop.eta})
              </span>
            )}
          </div>

          <button
            onClick={() => handleActionTap(onClose)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Client */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-950 leading-tight line-clamp-2">
            {job.title}
          </h2>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span className="font-extrabold text-slate-900">{job.clientName}</span>
            <span className="text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg font-bold border border-slate-200/80">
              {job.category}
            </span>
          </div>
        </div>

        {/* Address & Distance */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-start gap-2 max-w-[70%]">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-slate-700 font-semibold line-clamp-2">{job.address}</span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-slate-900 text-sm">{distanceKm} km</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">from you</p>
          </div>
        </div>

        {/* Real Estate Agency Work Order Banner */}
        {job.isAgencyJob && job.realEstateAgency && (
          <div className="bg-purple-50/90 border border-purple-200/90 rounded-2xl p-3 text-xs flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 font-black text-purple-950">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>{job.realEstateAgency}</span>
                {job.workOrderNumber && (
                  <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-md font-mono font-bold">
                    {job.workOrderNumber}
                  </span>
                )}
              </div>
              {job.realEstateAgentName && (
                <p className="text-[11px] text-purple-700 font-semibold mt-0.5">PM: {job.realEstateAgentName}</p>
              )}
            </div>
            {job.realEstateAgentPhone && (
              <a
                href={`tel:${job.realEstateAgentPhone}`}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200 shadow-sm transition active:scale-95"
                title="Call Property Manager"
              >
                Call PM
              </a>
            )}
          </div>
        )}

        {/* Quote / Cost Preview */}
        {job.quote ? (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 rounded-2xl text-xs shadow-xs">
            <span className="text-purple-950 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Quote #{job.quote.quoteNumber}
            </span>
            <span className="font-black text-purple-950 text-base">
              {formatCurrency(job.quote.totalAmount)}
            </span>
          </div>
        ) : job.appointmentTime ? (
          <div className="flex items-center gap-2 text-xs text-slate-700 px-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Site Visit: <strong className="text-slate-900 font-black">{new Date(job.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
        ) : null}

        {/* Action Buttons Grid (48px Touch Targets) */}
        <div className="grid grid-cols-4 gap-2 pt-0.5">
          <a
            href={`tel:${job.clientPhone}`}
            className="flex flex-col items-center justify-center p-2.5 min-h-[52px] rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition active:scale-95 border border-slate-200/90 shadow-xs"
            title="Call Client"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold mt-1">Call</span>
          </a>

          <a
            href={buildSmsLink(job.clientPhone, defaultSmsMsg)}
            className="flex flex-col items-center justify-center p-2.5 min-h-[52px] rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition active:scale-95 border border-slate-200/90 shadow-xs"
            title="Send SMS"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold mt-1">SMS</span>
          </a>

          {/* Direct Live GPS Navigation link */}
          <a
            href={liveNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-2.5 min-h-[52px] rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 transition active:scale-95 border border-amber-200 shadow-xs"
            title="Start Live Directions from Current Location"
          >
            <Navigation2 className="w-4 h-4 text-amber-600 fill-amber-600" />
            <span className="text-[10px] font-black mt-1">Directions</span>
          </a>

          <button
            onClick={() => handleActionTap(() => onOpenFullJob(job))}
            className="flex flex-col items-center justify-center p-2.5 min-h-[52px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition active:scale-95 shadow-md shadow-slate-900/20 col-span-1"
            title="Open Full Job Details & Quote Builder"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-black mt-1">Details</span>
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => handleActionTap(() => onOpenFullJob(job))}
          className={`w-full py-3.5 px-4 rounded-2xl text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
            job.status === 'completed' || job.status === 'invoiced'
              ? 'brand-gradient shadow-blue-600/30'
              : 'brand-gradient shadow-blue-600/30'
          }`}
        >
          <span>
            {job.status === 'completed' || job.status === 'invoiced'
              ? '📄 Generate & Download Tax Invoice'
              : (job.quote ? '⚡ Review / Present Quote' : '⚡ Open Quote Builder & Checklist')}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

      </div>
    </div>
  );
};

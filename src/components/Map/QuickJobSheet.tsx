import React from 'react';
import { Job, RouteStop } from '../../types';
import { STATUS_CONFIG, formatCurrency, calculateDistanceKm, buildGoogleMapsRouteUrl, buildSmsLink } from '../../utils/helpers';
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
  Calendar
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

  const googleNavUrl = buildGoogleMapsRouteUrl(currentLocation, [job.coordinates]);
  const defaultSmsMsg = `Hi ${job.clientName}, this is Alex from Apex Handyman. I'm reviewing your request for ${job.title}. When is a good time for me to stop by for the quote?`;

  return (
    <div className="absolute bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[1000] pointer-events-auto transition-all animate-in slide-in-from-bottom duration-200">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900 flex flex-col gap-3.5 ring-1 ring-black/5">
        
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.colorHex }}></span>
              {statusCfg.label}
            </span>
            {routeStop && (
              <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" /> Stop #{routeStop.stopOrder} ({routeStop.eta})
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Client */}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight line-clamp-2">
            {job.title}
          </h2>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{job.clientName}</span>
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200/60">
              {job.category}
            </span>
          </div>
        </div>

        {/* Address & Distance */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-start gap-2 max-w-[70%]">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-slate-700 font-medium line-clamp-2">{job.address}</span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-slate-900">{distanceKm} km</p>
            <p className="text-[10px] text-slate-500">away from you</p>
          </div>
        </div>

        {/* Quote / Cost Preview */}
        {job.quote ? (
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-purple-50/80 border border-purple-200/80 rounded-2xl text-xs">
            <span className="text-purple-900 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Quote #{job.quote.quoteNumber}
            </span>
            <span className="font-black text-purple-900 text-sm">
              {formatCurrency(job.quote.totalAmount)}
            </span>
          </div>
        ) : job.appointmentTime ? (
          <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Site Visit: <strong className="text-slate-900">{new Date(job.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
        ) : null}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <a
            href={`tel:${job.clientPhone}`}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-200/60"
            title="Call Client"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-semibold mt-1">Call</span>
          </a>

          <a
            href={buildSmsLink(job.clientPhone, defaultSmsMsg)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-200/60"
            title="Send SMS"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-semibold mt-1">SMS</span>
          </a>

          <a
            href={googleNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-200/60"
            title="Open Turn-by-Turn Navigation"
          >
            <Navigation2 className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-semibold mt-1">Directions</span>
          </a>

          <button
            onClick={() => onOpenFullJob(job)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition active:scale-95 shadow-sm col-span-1"
            title="Open Full Job Details & Quote Builder"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Full Job</span>
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => onOpenFullJob(job)}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span>{job.quote ? 'Edit / Present Quote' : '⚡ Open Quote Builder'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};

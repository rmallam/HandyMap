import React from 'react';
import { Job, OptimizedRoute, HandymanProfile } from '../../types';
import {
  STATUS_CONFIG,
  formatCurrency,
  buildGoogleMapsRouteUrl,
  buildLiveNavigationUrl,
  buildSmsLink
} from '../../utils/helpers';
import {
  Navigation,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface RoutePlannerViewProps {
  jobs: Job[];
  profile: HandymanProfile;
  currentLocation: [number, number];
  activeRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  onGenerateRoute: (filter: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all') => void;
  onOpenJobDetail: (job: Job) => void;
  onToggleStopCompleted: (stopId: string) => void;
  onClearRoute: () => void;
  onSwitchToMap: () => void;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  jobs,
  currentLocation,
  activeRoute,
  isOptimizing,
  onGenerateRoute,
  onOpenJobDetail,
  onToggleStopCompleted,
  onClearRoute,
  onSwitchToMap
}) => {
  const quoteJobs = jobs.filter(j => j.status === 'quote_requested');
  const activeJobs = jobs.filter(j => j.status === 'in_progress');
  const urgentJobs = jobs.filter(j => j.status === 'urgent');

  // Master Google Maps Route omitting fixed origin so navigation begins from driver's live GPS
  const masterGoogleMapsUrl = activeRoute && activeRoute.stops.length > 0
    ? buildGoogleMapsRouteUrl(
        null,
        activeRoute.stops.map(s => s.job.coordinates)
      )
    : '#';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Optimal Multi-Stop Route Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compute the fastest road sequence for quotes, site visits & job appointments.
          </p>
        </div>

        {activeRoute && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onSwitchToMap}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              View on Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearRoute}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm transition"
              title="Clear Route"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preset Route Selectors */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 mb-6 shadow-sm">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Select Route Goal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: Quotes only */}
          <button
            onClick={() => onGenerateRoute('quotes_only')}
            disabled={isOptimizing || quoteJobs.length === 0}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              activeRoute?.filterUsed === 'quotes_only'
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            } ${quoteJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quotes Tour
              </span>
              <span className="text-xs font-extrabold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
                {quoteJobs.length} Stops
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Optimal sequence for today's estimate requests & measurements
            </p>
          </button>

          {/* Option 2: Active Jobs */}
          <button
            onClick={() => onGenerateRoute('active_only')}
            disabled={isOptimizing || activeJobs.length === 0}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              activeRoute?.filterUsed === 'active_only'
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            } ${activeJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-900">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Active Jobs
              </span>
              <span className="text-xs font-extrabold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
                {activeJobs.length} Stops
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Optimal route covering all accepted & in-progress jobs
            </p>
          </button>

          {/* Option 3: Urgent & Quotes */}
          <button
            onClick={() => onGenerateRoute('urgent_and_quotes')}
            disabled={isOptimizing || (urgentJobs.length === 0 && quoteJobs.length === 0)}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              activeRoute?.filterUsed === 'urgent_and_quotes'
                ? 'bg-red-50/80 border-red-400 ring-2 ring-red-400/30'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-bold flex items-center gap-1.5 text-red-900">
                <Clock className="w-3.5 h-3.5 text-red-600" /> Urgent + Quotes
              </span>
              <span className="text-xs font-extrabold bg-red-200/70 text-red-900 px-2 py-0.5 rounded-md">
                {urgentJobs.length + quoteJobs.length} Stops
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Prioritizes emergency repairs followed by quote visits
            </p>
          </button>
        </div>
      </div>

      {/* Active Route Summary Stats Banner */}
      {activeRoute ? (
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white border border-blue-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Optimal Tour Generated
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                  <span>{activeRoute.stops.length} Planned Stops</span>
                  <span className="text-xs text-slate-500 font-normal">
                    (from {activeRoute.startLocation.name})
                  </span>
                </h2>
              </div>

              {/* Master Nav Button */}
              <a
                href={masterGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch Entire Route in Google Maps</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Distance</p>
                <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
                  {activeRoute.totalDistanceKm} km
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">Est. Drive Time</p>
                <p className="text-base sm:text-lg font-black text-amber-700 mt-0.5">
                  {activeRoute.totalDurationMin} mins
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">Est. Tour Finish</p>
                <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
                  {activeRoute.stops.length > 0
                    ? activeRoute.stops[activeRoute.stops.length - 1].eta
                    : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Sequential Stops Timeline */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Stop-by-Stop Itinerary
            </h3>

            {activeRoute.stops.map((stop) => {
              const job = stop.job;
              const statusCfg = STATUS_CONFIG[job.status];
              const singleStopNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);
              const onMyWaySms = `Hi ${job.clientName}, Alex from Apex Handyman here! I am on my way to your address (${job.address}) for our quote appointment. Est. arrival: ${stop.eta}.`;

              return (
                <div
                  key={stop.id}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    stop.isCompleted
                      ? 'bg-slate-100/80 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Stop Number & Status badge */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleStopCompleted(stop.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                        title={stop.isCompleted ? 'Mark Incomplete' : 'Mark Visited'}
                      >
                        {stop.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-400 bg-white flex items-center justify-center font-bold text-xs text-slate-700 shadow-sm">
                            {stop.stopOrder}
                          </div>
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                          >
                            {statusCfg.shortLabel}
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ETA: {stop.eta}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            • {stop.distanceFromPrevKm} km ({stop.durationFromPrevMin}m drive)
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                          {job.title}
                        </h4>

                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-700 mt-1.5 font-medium">
                          <span>{job.clientName}</span>
                          {job.quote && (
                            <span className="text-emerald-700 font-bold">
                              {formatCurrency(job.quote.totalAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick actions */}
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${job.clientPhone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Call Client"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                        <a
                          href={buildSmsLink(job.clientPhone, onMyWaySms)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 transition"
                          title="Send 'On My Way' SMS"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={singleStopNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 transition"
                          title="Navigate to Stop"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <button
                        onClick={() => onOpenJobDetail(job)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs flex items-center gap-1 transition border border-blue-200"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Quote / Job</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            No Active Route Generated
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Select a route goal above to automatically compute the shortest, most fuel-efficient road route for your quote visits.
          </p>
          <button
            onClick={() => onGenerateRoute('quotes_only')}
            disabled={quoteJobs.length === 0}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Plan Today's {quoteJobs.length} Quote Site Visits</span>
          </button>
        </div>
      )}
    </div>
  );
};

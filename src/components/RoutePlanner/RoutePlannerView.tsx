import React, { useState } from 'react';
import { Job, OptimizedRoute, HandymanProfile } from '../../types';
import { extractSuburb } from '../../services/routeOptimizer';
import { SUBURBS_LIST } from '../../data/mockJobs';
import { triggerHapticFeedback } from '../../services/nativeMobile';
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
  ArrowRight,
  Building2,
  Layers,
  Map
} from 'lucide-react';

interface RoutePlannerViewProps {
  jobs: Job[];
  profile: HandymanProfile;
  currentLocation: [number, number];
  activeRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  onGenerateRoute: (
    filter: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all',
    suburb?: string,
    prioritizeAgency?: boolean
  ) => void;
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
  const [selectedGoal, setSelectedGoal] = useState<'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all'>('quotes_only');
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all');
  const [prioritizeAgency, setPrioritizeAgency] = useState<boolean>(true);

  // Suburb counts for the selected goal
  const goalFilteredJobs = jobs.filter(j => {
    if (selectedGoal === 'quotes_only') return j.status === 'quote_requested';
    if (selectedGoal === 'active_only') return j.status === 'in_progress';
    if (selectedGoal === 'urgent_and_quotes') return j.status === 'urgent' || j.status === 'quote_requested';
    return j.status !== 'completed' && j.status !== 'invoiced';
  });

  const suburbCounts: Record<string, number> = {};
  goalFilteredJobs.forEach(j => {
    const sub = extractSuburb(j);
    suburbCounts[sub] = (suburbCounts[sub] || 0) + 1;
  });

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

  const handleRunOptimization = (
    goal = selectedGoal,
    suburb = selectedSuburb,
    agencyFirst = prioritizeAgency
  ) => {
    triggerHapticFeedback('light');
    onGenerateRoute(goal, suburb, agencyFirst);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3.5 sm:p-6 max-w-4xl mx-auto w-full">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Navigation className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Optimal Multi-Stop Route
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Fastest road sequence with <strong>suburb clustering</strong> & <strong>agency priority</strong>.
              </p>
            </div>
          </div>
        </div>

        {activeRoute && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                onSwitchToMap();
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Map className="w-3.5 h-3.5 stroke-[2.2]" /> View Map
            </button>
            <button
              onClick={() => {
                triggerHapticFeedback('warning');
                onClearRoute();
              }}
              className="p-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/90 shadow-sm transition active:scale-95"
              title="Clear Route"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Control Panel: Route Goals, Suburbs, Agency Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 mb-5 shadow-sm flex flex-col gap-4">
        {/* Row 1: Segmented Route Goal Switcher */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Route Objective
            </label>
            <span className="text-[11px] font-bold text-slate-500">
              {goalFilteredJobs.length} {goalFilteredJobs.length === 1 ? 'Job' : 'Jobs'} Eligible
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Goal 1: Quotes only */}
            <button
              onClick={() => {
                setSelectedGoal('quotes_only');
                handleRunOptimization('quotes_only', selectedSuburb, prioritizeAgency);
              }}
              disabled={isOptimizing || quoteJobs.length === 0}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                selectedGoal === 'quotes_only'
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
              } ${quoteJobs.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  selectedGoal === 'quotes_only' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {quoteJobs.length}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-snug">Quotes Tour</p>
                <p className="text-[10px] text-slate-500 truncate">Estimate visits</p>
              </div>
            </button>

            {/* Goal 2: Active Work */}
            <button
              onClick={() => {
                setSelectedGoal('active_only');
                handleRunOptimization('active_only', selectedSuburb, prioritizeAgency);
              }}
              disabled={isOptimizing || activeJobs.length === 0}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                selectedGoal === 'active_only'
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
              } ${activeJobs.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  selectedGoal === 'active_only' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeJobs.length}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-snug">Active Work</p>
                <p className="text-[10px] text-slate-500 truncate">In-progress jobs</p>
              </div>
            </button>

            {/* Goal 3: Urgent & Quotes */}
            <button
              onClick={() => {
                setSelectedGoal('urgent_and_quotes');
                handleRunOptimization('urgent_and_quotes', selectedSuburb, prioritizeAgency);
              }}
              disabled={isOptimizing || (urgentJobs.length === 0 && quoteJobs.length === 0)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                selectedGoal === 'urgent_and_quotes'
                  ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
              } ${(urgentJobs.length === 0 && quoteJobs.length === 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  selectedGoal === 'urgent_and_quotes' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {urgentJobs.length + quoteJobs.length}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-snug">Urgent + Quotes</p>
                <p className="text-[10px] text-slate-500 truncate">Priority first</p>
              </div>
            </button>

            {/* Goal 4: All Active */}
            <button
              onClick={() => {
                setSelectedGoal('all');
                handleRunOptimization('all', selectedSuburb, prioritizeAgency);
              }}
              disabled={isOptimizing || goalFilteredJobs.length === 0}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                selectedGoal === 'all'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
              } ${goalFilteredJobs.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Layers className="w-4 h-4 text-blue-500" />
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  selectedGoal === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {jobs.filter(j => j.status !== 'completed' && j.status !== 'invoiced').length}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-snug">All Active</p>
                <p className="text-[10px] text-slate-500 truncate">Full day loop</p>
              </div>
            </button>
          </div>
        </div>

        {/* Row 2: Suburb Filter Chips */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            Target Neighborhood Cluster
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setSelectedSuburb('all');
                handleRunOptimization(selectedGoal, 'all', prioritizeAgency);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSuburb === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Suburbs</span>
              <span className="text-[10px] opacity-75">({goalFilteredJobs.length})</span>
            </button>

            {SUBURBS_LIST.map(sub => {
              const count = suburbCounts[sub] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSuburb(sub);
                    handleRunOptimization(selectedGoal, sub, prioritizeAgency);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedSuburb === sub
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{sub}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedSuburb === sub ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Agency Priority Toggle & Master Calculate CTA */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {jobs.some(j => j.realEstateAgency && j.realEstateAgency.trim().length > 0) ? (
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Real Estate Priority
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Agency orders sequenced first
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const next = !prioritizeAgency;
                  setPrioritizeAgency(next);
                  handleRunOptimization(selectedGoal, selectedSuburb, next);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition border ${
                  prioritizeAgency
                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {prioritizeAgency ? '✓ On' : 'Off'}
              </button>
            </div>
          ) : <div />}

          <button
            onClick={() => handleRunOptimization(selectedGoal, selectedSuburb, prioritizeAgency)}
            disabled={isOptimizing || goalFilteredJobs.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 stroke-[2.5] ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Calculating Route...' : 'Generate Optimal Route'}</span>
          </button>
        </div>
      </div>

      {/* Active Route Summary Stats Banner */}
      {activeRoute ? (
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white border border-blue-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Optimal Suburb Tour
                  </span>
                  {activeRoute.selectedSuburb && activeRoute.selectedSuburb !== 'all' && (
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      📍 {activeRoute.selectedSuburb} Only
                    </span>
                  )}
                </div>
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
                <span>Launch Entire Tour in Google Maps</span>
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

          {/* Sequential Stops Grouped by Suburb Clusters */}
          <div className="flex flex-col gap-4">
            {activeRoute.suburbClusters && activeRoute.suburbClusters.length > 0 ? (
              activeRoute.suburbClusters.map((cluster, clusterIdx) => (
                <div key={cluster.suburb} className="flex flex-col gap-2.5">
                  {/* Suburb Cluster Header */}
                  <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200/80 px-4 py-2 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                        {clusterIdx + 1}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        📍 {cluster.suburb} Cluster
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {cluster.stops.length} stop{cluster.stops.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      {cluster.totalDistanceKm} km ({cluster.totalDurationMin}m drive)
                    </span>
                  </div>

                  {/* Stops in this suburb */}
                  {cluster.stops.map((stop) => {
                    const job = stop.job;
                    const statusCfg = STATUS_CONFIG[job.status];
                    const singleStopNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);
                    const onMyWaySms = `Hi ${job.clientName}, Alex from Apex Handyman here! I am on my way to your address (${job.address}). Est. arrival: ${stop.eta}.`;

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
                                
                                {job.isAgencyJob && job.realEstateAgency && (
                                  <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Building2 className="w-2.5 h-2.5" />
                                    {job.realEstateAgency.split(' ')[0]}
                                    {job.workOrderNumber && ` • ${job.workOrderNumber}`}
                                  </span>
                                )}

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
                              {job.isAgencyJob && job.realEstateAgentPhone && (
                                <a
                                  href={`tel:${job.realEstateAgentPhone}`}
                                  className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                                  title={`Call Property Manager (${job.realEstateAgentName})`}
                                >
                                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                </a>
                              )}
                              <a
                                href={`tel:${job.clientPhone}`}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Call Client / Tenant"
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
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No stops remaining on this route.
              </div>
            )}
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
            Select a route goal and suburb above to compute the shortest road route with clustered neighborhood sequence.
          </p>
          <button
            onClick={() => handleRunOptimization('quotes_only', selectedSuburb, prioritizeAgency)}
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

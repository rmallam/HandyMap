import React, { useState, useMemo } from 'react';
import { Job, OptimizedRoute, RouteStop, HandymanProfile, RouteFilterType } from '../../types';
import { extractSuburb } from '../../services/routeOptimizer';
import { SUBURBS_LIST } from '../../data/mockJobs';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { getInterpolatedMessage } from '../../utils/messageTemplates';
import { buildGoogleCalendarUrl, downloadIcsCalendarFile } from '../../utils/calendarExport';
import {
  STATUS_CONFIG,
  formatCurrency,
  formatTime,
  DateFilterType,
  matchesDateFilter,
  calculateDateFilterCounts,
  buildGoogleMapsRouteUrl,
  buildLiveNavigationUrl,
  calculateDistanceKm
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
  Building2,
  Map,
  Compass,
  Crosshair,
  RefreshCw,
  Calendar,
  Download,
  CalendarDays,
  Check,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface DayPlanViewProps {
  jobs: Job[];
  profile: HandymanProfile;
  currentLocation: [number, number];
  activeRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  onGenerateRoute: (
    filter: RouteFilterType,
    suburb?: string,
    prioritizeAgency?: boolean
  ) => void;
  onOpenJobDetail: (job: Job) => void;
  onToggleStopCompleted: (stopId: string) => void;
  onClearRoute: () => void;
  onSwitchToMap: () => void;
  isUsingGPS?: boolean;
  isLocatingGPS?: boolean;
  onRefreshLocation?: () => void;
  onToggleGpsMode?: () => void;
}

export type DayPlanMode = 'smart' | 'timeline' | 'route_control';

export const DayPlanView: React.FC<DayPlanViewProps> = ({
  jobs,
  profile,
  currentLocation,
  activeRoute,
  isOptimizing,
  onGenerateRoute,
  onOpenJobDetail,
  onToggleStopCompleted,
  onClearRoute,
  onSwitchToMap,
  isUsingGPS = false,
  isLocatingGPS = false,
  onRefreshLocation,
  onToggleGpsMode
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [viewMode, setViewMode] = useState<DayPlanMode>('smart');
  const [selectedGoal, setSelectedGoal] = useState<RouteFilterType>('quotes_only');
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all');
  const [prioritizeAgency, setPrioritizeAgency] = useState<boolean>(true);
  const [showUnscheduledQueue, setShowUnscheduledQueue] = useState<boolean>(false);

  // Active open jobs (excluding archived invoiced and cancelled jobs)
  const activeJobs = useMemo(
    () => jobs.filter(j => j.status !== 'invoiced' && j.status !== 'cancelled'),
    [jobs]
  );

  // Scheduled jobs have an explicit appointmentTime set
  const scheduledJobsAll = useMemo(
    () => activeJobs.filter(j => Boolean(j.appointmentTime)),
    [activeJobs]
  );

  const dateCounts = useMemo(
    () => calculateDateFilterCounts(scheduledJobsAll),
    [scheduledJobsAll]
  );

  // Filter scheduled jobs by date filter and sort chronologically
  const scheduledJobs = useMemo(() => {
    return scheduledJobsAll
      .filter(j => {
        if (dateFilter === 'all') return true;
        return matchesDateFilter(j, dateFilter);
      })
      .sort((a, b) => {
        const timeA = new Date(a.appointmentTime!).getTime();
        const timeB = new Date(b.appointmentTime!).getTime();
        return timeA - timeB;
      });
  }, [scheduledJobsAll, dateFilter]);

  // Unscheduled active jobs
  const unscheduledJobs = useMemo(
    () => activeJobs.filter(j => !j.appointmentTime),
    [activeJobs]
  );

  // Goal-filtered jobs for route optimization
  const goalFilteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (selectedGoal === 'quotes_only') return j.status === 'quote_requested';
      if (selectedGoal === 'active_only') return j.status === 'in_progress';
      if (selectedGoal === 'urgent_and_quotes') return j.status === 'urgent' || j.status === 'quote_requested';
      return j.status !== 'completed' && j.status !== 'invoiced' && j.status !== 'cancelled';
    });
  }, [jobs, selectedGoal]);

  const quoteJobs = useMemo(() => jobs.filter(j => j.status === 'quote_requested'), [jobs]);
  const inProgressJobs = useMemo(() => jobs.filter(j => j.status === 'in_progress'), [jobs]);
  const urgentJobs = useMemo(() => jobs.filter(j => j.status === 'urgent'), [jobs]);

  // Suburb counts for the selected goal
  const suburbCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    goalFilteredJobs.forEach(j => {
      const sub = extractSuburb(j);
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [goalFilteredJobs]);

  // Determine the sequence of stops to display:
  // If an activeRoute exists and user is in 'smart' or 'route_control', prioritize activeRoute stops.
  // Otherwise, use scheduled jobs for the selected date.
  const activeStops: RouteStop[] = useMemo(() => {
    if (activeRoute && activeRoute.stops.length > 0) {
      return activeRoute.stops;
    }

    // Build synthesized route stops from scheduledJobs
    let prevCoords = currentLocation;
    return scheduledJobs.map((job, idx) => {
      const dist = Math.round(
        calculateDistanceKm(prevCoords[0], prevCoords[1], job.coordinates[0], job.coordinates[1]) * 10
      ) / 10;
      const travelMins = Math.max(3, Math.round((dist / 38) * 60));
      prevCoords = job.coordinates;

      return {
        id: `synth-stop-${job.id}`,
        job,
        stopOrder: idx + 1,
        distanceFromPrevKm: dist,
        durationFromPrevMin: travelMins,
        eta: job.appointmentTime ? formatTime(job.appointmentTime) : `Stop #${idx + 1}`,
        isCompleted: job.status === 'completed'
      };
    });
  }, [activeRoute, scheduledJobs, currentLocation]);

  // Master Google Maps Route omitting fixed origin so navigation begins from driver's live GPS
  const masterGoogleMapsUrl = useMemo(() => {
    const coordsToRoute = activeStops.map(s => s.job.coordinates);
    return coordsToRoute.length > 0
      ? buildGoogleMapsRouteUrl(null, coordsToRoute)
      : '#';
  }, [activeStops]);

  // Aggregate stats
  const totalStopsCount = activeStops.length;
  const completedStopsCount = activeStops.filter(s => s.isCompleted).length;
  const progressPercent = totalStopsCount > 0 ? Math.round((completedStopsCount / totalStopsCount) * 100) : 0;

  const totalDistanceKm = useMemo(() => {
    if (activeRoute) return activeRoute.totalDistanceKm;
    return Math.round(activeStops.reduce((sum, s) => sum + s.distanceFromPrevKm, 0) * 10) / 10;
  }, [activeRoute, activeStops]);

  const totalDriveTimeMinutes = useMemo(() => {
    if (activeRoute) return activeRoute.totalDurationMin;
    return activeStops.reduce((sum, s) => sum + s.durationFromPrevMin, 0);
  }, [activeRoute, activeStops]);

  const handleRunOptimization = (
    goal = selectedGoal,
    suburb = selectedSuburb,
    agencyFirst = prioritizeAgency
  ) => {
    triggerHapticFeedback('light');
    onGenerateRoute(goal, suburb, agencyFirst);
  };

  const getSubtitle = () => {
    const now = new Date();
    if (dateFilter === 'today') {
      return now.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return tomorrow.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (dateFilter === 'this_week') {
      return 'Current Calendar Week (Monday - Sunday)';
    }
    return 'All Scheduled & Planned Visits';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3 sm:p-6 max-w-4xl mx-auto w-full">
      
      {/* --------------------------------------------------------------------- */}
      {/* TOP HEADER & TITLE                                                    */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
              <CalendarDays className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Day Plan</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Schedule + Route
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {getSubtitle()} • <strong className="text-slate-800 font-black">{totalStopsCount} Stops</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Master Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {totalStopsCount > 0 && (
            <a
              href={masterGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('light')}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-slate-900/15 transition active:scale-95"
              title="Launch full sequence in Google Maps app"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>🗺️ Start Google Tour</span>
            </a>
          )}

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onSwitchToMap();
            }}
            className="px-3 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            title="Open Interactive Map"
          >
            <Map className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
            <span className="hidden xs:inline">Map</span>
          </button>

          {activeRoute && (
            <button
              onClick={() => {
                triggerHapticFeedback('warning');
                onClearRoute();
              }}
              className="p-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 border border-slate-200/90 shadow-xs transition active:scale-95"
              title="Reset Optimized Sequence"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. DATE SELECTOR PILLS                                                */}
      {/* --------------------------------------------------------------------- */}
      <div className="shrink-0 flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs mb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('today');
          }}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'today'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Today</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.today}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('tomorrow');
          }}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'tomorrow'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Tomorrow</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'tomorrow' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.tomorrow}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('this_week');
          }}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'this_week'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>This Week</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'this_week' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.this_week}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('all');
          }}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Planned</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.all}
          </span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. VIEW MODE SWITCHER (Smart Plan | Timeline | Route Tuning)          */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-black text-slate-600 mb-3.5">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('smart');
          }}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            viewMode === 'smart'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Smart Plan</span>
          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-md font-bold hidden xs:inline">
            Best
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('timeline');
          }}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            viewMode === 'timeline'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('route_control');
          }}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            viewMode === 'route_control'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          <span>Optimizer</span>
          {activeRoute && (
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. HERO METRICS CARD                                                  */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden mb-4">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                Daily Driving Route
              </span>
              {activeRoute && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                  ⚡ Auto-Optimized
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black">{totalDistanceKm} km</span>
              <span className="text-xs text-blue-200 font-semibold">
                • ~{totalDriveTimeMinutes} mins travel time
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
              Execution Progress
            </span>
            <div className="flex items-center sm:justify-end gap-2 mt-0.5">
              <span className="text-xs font-black bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/15">
                {completedStopsCount} of {totalStopsCount} Done ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-3.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-blue-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Bottom Origin Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-blue-300 shrink-0 font-medium">Origin:</span>
            <span className="font-extrabold truncate">
              {isUsingGPS
                ? `📍 Live GPS (${currentLocation[0].toFixed(3)}, ${currentLocation[1].toFixed(3)})`
                : (profile.baseAddress ? `🏠 ${profile.baseAddress.split(',')[0]}` : 'Base: Point Cook')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleGpsMode && (
              <button
                onClick={() => {
                  triggerHapticFeedback('light');
                  onToggleGpsMode();
                }}
                className="text-[11px] font-bold text-blue-200 hover:text-white underline underline-offset-2 transition"
              >
                {isUsingGPS ? 'Switch to Hub' : 'Use Live GPS'}
              </button>
            )}

            <button
              onClick={() => handleRunOptimization(selectedGoal, selectedSuburb, prioritizeAgency)}
              disabled={isOptimizing}
              className="text-[11px] font-black text-amber-300 hover:text-white flex items-center gap-1 transition active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isOptimizing ? 'Optimizing...' : 'Re-Optimize Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. OPTIMIZER CONTROL PANEL (Shown when 'route_control' is active)     */}
      {/* --------------------------------------------------------------------- */}
      {viewMode === 'route_control' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 mb-4 shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Route Objective
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {goalFilteredJobs.length} Eligible Jobs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Closest to Me */}
              <button
                onClick={() => {
                  setSelectedGoal('closest_to_me');
                  handleRunOptimization('closest_to_me', selectedSuburb, prioritizeAgency);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 ${
                  selectedGoal === 'closest_to_me'
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/25 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Crosshair className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {activeJobs.length}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-snug">Closest to Me</p>
                  <p className="text-[10px] text-slate-500">Nearest stop first</p>
                </div>
              </button>

              {/* Quotes Tour */}
              <button
                onClick={() => {
                  setSelectedGoal('quotes_only');
                  handleRunOptimization('quotes_only', selectedSuburb, prioritizeAgency);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 ${
                  selectedGoal === 'quotes_only'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {quoteJobs.length}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-snug">Quotes Tour</p>
                  <p className="text-[10px] text-slate-500">Estimates only</p>
                </div>
              </button>

              {/* Active Work */}
              <button
                onClick={() => {
                  setSelectedGoal('active_only');
                  handleRunOptimization('active_only', selectedSuburb, prioritizeAgency);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 ${
                  selectedGoal === 'active_only'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {inProgressJobs.length}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-snug">Active Work</p>
                  <p className="text-[10px] text-slate-500">In-progress jobs</p>
                </div>
              </button>

              {/* Urgent + Quotes */}
              <button
                onClick={() => {
                  setSelectedGoal('urgent_and_quotes');
                  handleRunOptimization('urgent_and_quotes', selectedSuburb, prioritizeAgency);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 ${
                  selectedGoal === 'urgent_and_quotes'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {urgentJobs.length + quoteJobs.length}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-snug">Urgent + Quotes</p>
                  <p className="text-[10px] text-slate-500">Highest priority</p>
                </div>
              </button>
            </div>
          </div>

          {/* Suburb Filter Pills & Agency Priority */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Suburb:</span>
              <button
                onClick={() => {
                  setSelectedSuburb('all');
                  handleRunOptimization(selectedGoal, 'all', prioritizeAgency);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedSuburb === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
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
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                      selectedSuburb === sub
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 shrink-0 select-none">
              <input
                type="checkbox"
                checked={prioritizeAgency}
                onChange={e => {
                  setPrioritizeAgency(e.target.checked);
                  handleRunOptimization(selectedGoal, selectedSuburb, e.target.checked);
                }}
                className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 border-slate-300"
              />
              <span className="text-xs">Prioritize Agency Work Orders</span>
            </label>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. STOP SEQUENCE TIMELINE (The Core Plan)                             */}
      {/* --------------------------------------------------------------------- */}
      {totalStopsCount === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-slate-900 font-black text-base">
              {dateFilter === 'today'
                ? 'No visits scheduled for Today'
                : dateFilter === 'tomorrow'
                ? 'No visits scheduled for Tomorrow'
                : dateFilter === 'this_week'
                ? 'No visits scheduled for This Week'
                : 'No scheduled visits found'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              {unscheduledJobs.length > 0
                ? `You have ${unscheduledJobs.length} active leads in your pipeline ready to be slotted in.`
                : 'All jobs in your pipeline have been completed or attended to.'}
            </p>
          </div>

          {unscheduledJobs.length > 0 && (
            <button
              onClick={() => handleRunOptimization('all', 'all', true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              ⚡ Auto-Generate Route for All Open Leads
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {activeStops.map((stop, index) => {
            const job = stop.job;
            const statusCfg = STATUS_CONFIG[job.status];
            const liveNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);
            const onMyWaySms = getInterpolatedMessage('onMyWay', job, profile, { eta: stop.eta });
            const liveDist = calculateDistanceKm(
              currentLocation[0],
              currentLocation[1],
              job.coordinates[0],
              job.coordinates[1]
            ).toFixed(1);

            return (
              <React.Fragment key={stop.id || job.id}>
                {/* INLINE TRANSIT CONNECTOR (Driving time from previous stop) */}
                {index > 0 && (
                  <div className="flex items-center justify-center gap-2 py-0.5">
                    <div className="h-4 w-0.5 bg-slate-300"></div>
                    <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 text-[10px] sm:text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs transition">
                      🚗 {stop.durationFromPrevMin} mins drive ({stop.distanceFromPrevKm} km)
                    </span>
                    <div className="h-4 w-0.5 bg-slate-300"></div>
                  </div>
                )}

                {/* STOP CARD */}
                <div
                  className={`bg-white border rounded-3xl p-3.5 sm:p-4 shadow-sm transition-all ${
                    stop.isCompleted
                      ? 'border-emerald-200/90 bg-emerald-50/20 opacity-75'
                      : index === 0
                      ? 'border-blue-500 ring-2 ring-blue-500/15 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Stop Number & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          triggerHapticFeedback('light');
                          onToggleStopCompleted(stop.id);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition active:scale-90 ${
                          stop.isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 border border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                        title={stop.isCompleted ? 'Mark not finished' : 'Mark finished'}
                      >
                        {stop.isCompleted ? '✓' : stop.stopOrder}
                      </button>

                      {job.appointmentTime && (
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">
                          {formatTime(job.appointmentTime)}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                      >
                        {statusCfg.shortLabel}
                      </span>

                      {job.isAgencyJob && job.realEstateAgency && (
                        <span className="text-[10px] font-extrabold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 truncate max-w-[150px]">
                          <Building2 className="w-3 h-3 text-purple-700 shrink-0" />
                          <span className="truncate">{job.realEstateAgency.split(' ')[0]}</span>
                          {job.workOrderNumber && <span className="font-mono text-purple-700">• {job.workOrderNumber}</span>}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {job.quote && (
                        <span className="font-black text-xs text-slate-900">
                          {formatCurrency(job.quote.totalAmount)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                        📍 {liveDist} km away
                      </span>
                    </div>
                  </div>

                  {/* Job Title & Scope */}
                  <h3
                    onClick={() => onOpenJobDetail(job)}
                    className={`font-black text-sm sm:text-base text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition ${
                      stop.isCompleted ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {job.title}
                  </h3>

                  {/* Address */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate font-medium">{job.address}</span>
                  </div>

                  {/* Client & PM Info */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-bold text-slate-900">{job.clientName}</span>
                      {job.realEstateAgentName && (
                        <span className="text-[11px] text-purple-700 font-semibold truncate">
                          (PM: {job.realEstateAgentName})
                        </span>
                      )}
                    </div>

                    {/* Action Strip (44px mobile touch targets) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={`tel:${job.clientPhone}`}
                        onClick={() => triggerHapticFeedback('light')}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="Call Client"
                      >
                        <Phone className="w-3.5 h-3.5 stroke-[2.4]" />
                      </a>

                      <a
                        href={`sms:${job.clientPhone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(onMyWaySms)}`}
                        onClick={() => triggerHapticFeedback('light')}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95"
                        title="Send On My Way SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5 stroke-[2.4]" />
                      </a>

                      <a
                        href={liveNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => triggerHapticFeedback('light')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                        title="Start Google Maps Navigation"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                        <span className="text-[11px]">Navigate</span>
                      </a>

                      {/* Calendar exports */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback('light');
                          window.open(buildGoogleCalendarUrl(job, profile), '_blank');
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition active:scale-95"
                        title="Sync to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>

                      <button
                        onClick={() => {
                          triggerHapticFeedback('light');
                          onOpenJobDetail(job);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1 shadow-xs transition active:scale-95"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. UNSCHEDULED / FLEXIBLE QUOTES ACCORDION DRAWER                     */}
      {/* --------------------------------------------------------------------- */}
      {unscheduledJobs.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm mb-4">
          <div
            onClick={() => setShowUnscheduledQueue(!showUnscheduledQueue)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
                📥
              </span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">
                  Unscheduled Pipeline Leads ({unscheduledJobs.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Quote requests without a set time that can be slotted into today's drive
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                showUnscheduledQueue ? 'rotate-180' : ''
              }`}
            />
          </div>

          {showUnscheduledQueue && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 animate-in fade-in duration-150">
              {unscheduledJobs.slice(0, 5).map(ujob => (
                <div
                  key={ujob.id}
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{ujob.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{ujob.address}</p>
                  </div>
                  <button
                    onClick={() => {
                      triggerHapticFeedback('light');
                      onOpenJobDetail(ujob);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 transition active:scale-95"
                  >
                    Set Time
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

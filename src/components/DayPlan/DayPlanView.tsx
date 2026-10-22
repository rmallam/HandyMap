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
  calculateDistanceKm,
  formatJobDisplayId,
  getRelativeJobDateLabel
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
  Map as MapIcon,
  Compass,
  Crosshair,
  RefreshCw,
  Calendar,
  Download,
  CalendarDays,
  Check,
  ChevronDown,
  Plus,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  SlidersHorizontal,
  Info
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
  onUpdateJob?: (updatedJob: Job) => Promise<void> | void;
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
  onUpdateJob,
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
  const [showUnscheduledQueue, setShowUnscheduledQueue] = useState<boolean>(true);

  // Manual Add / Remove state
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [addJobSearchQuery, setAddJobSearchQuery] = useState('');
  const [manuallyAddedJobIds, setManuallyAddedJobIds] = useState<string[]>([]);
  const [manuallyRemovedJobIds, setManuallyRemovedJobIds] = useState<string[]>([]);
  const [customStopOrder, setCustomStopOrder] = useState<string[]>([]); // Array of job IDs in custom order

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

  // Filter scheduled jobs by date filter
  const baseScheduledJobs = useMemo(() => {
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

  // Combine with manually added jobs and filter out manually removed jobs
  const effectiveDayJobs: Job[] = useMemo(() => {
    // Start with base jobs matching the date filter
    let list = baseScheduledJobs.filter(j => !manuallyRemovedJobIds.includes(j.id));

    // Append manually added jobs if they are not already in the list
    const existingIds = new Set(list.map(j => j.id));
    for (const addedId of manuallyAddedJobIds) {
      if (!existingIds.has(addedId)) {
        const jobToAdd = jobs.find(j => j.id === addedId);
        if (jobToAdd && jobToAdd.status !== 'cancelled' && jobToAdd.status !== 'invoiced') {
          list.push(jobToAdd);
          existingIds.add(addedId);
        }
      }
    }

    // Apply custom stop order if set
    if (customStopOrder.length > 0) {
      const orderMap = new Map(customStopOrder.map((id, idx) => [id, idx]));
      list.sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return orderA - orderB;
      });
    }

    return list;
  }, [baseScheduledJobs, manuallyAddedJobIds, manuallyRemovedJobIds, customStopOrder, jobs]);

  // Build sequential RouteStop objects with live distance from previous stop
  const activeStops: RouteStop[] = useMemo(() => {
    let prevCoords = currentLocation;
    return effectiveDayJobs.map((job, idx) => {
      const dist = Math.round(
        calculateDistanceKm(prevCoords[0], prevCoords[1], job.coordinates[0], job.coordinates[1]) * 10
      ) / 10;
      const travelMins = Math.max(3, Math.round((dist / 38) * 60));
      prevCoords = job.coordinates;

      return {
        id: `stop-${job.id}`,
        job,
        stopOrder: idx + 1,
        distanceFromPrevKm: dist,
        durationFromPrevMin: travelMins,
        eta: job.appointmentTime ? formatTime(job.appointmentTime) : `Stop #${idx + 1}`,
        isCompleted: job.status === 'completed'
      };
    });
  }, [effectiveDayJobs, currentLocation]);

  // Unscheduled active jobs (jobs without appointmentTime and not already in effectiveDayJobs)
  const unscheduledJobs = useMemo(() => {
    const scheduledIds = new Set(effectiveDayJobs.map(j => j.id));
    return activeJobs.filter(j => !j.appointmentTime && !scheduledIds.has(j.id));
  }, [activeJobs, effectiveDayJobs]);

  // All eligible jobs available to add to today's plan
  const availableJobsToAdd = useMemo(() => {
    const currentStopIds = new Set(effectiveDayJobs.map(j => j.id));
    const query = addJobSearchQuery.toLowerCase().trim();

    return activeJobs
      .filter(j => !currentStopIds.has(j.id))
      .filter(j => {
        if (!query) return true;
        return (
          j.title.toLowerCase().includes(query) ||
          j.clientName.toLowerCase().includes(query) ||
          j.address.toLowerCase().includes(query) ||
          j.jobNumber.toLowerCase().includes(query) ||
          (j.realEstateAgency && j.realEstateAgency.toLowerCase().includes(query)) ||
          (j.realEstateAgentName && j.realEstateAgentName.toLowerCase().includes(query)) ||
          j.category.toLowerCase().includes(query)
        );
      });
  }, [activeJobs, effectiveDayJobs, addJobSearchQuery]);

  // Goal-filtered jobs for route optimization panel
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

  // Master Google Maps Route link
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
    return Math.round(activeStops.reduce((sum, s) => sum + s.distanceFromPrevKm, 0) * 10) / 10;
  }, [activeStops]);

  const totalDriveTimeMinutes = useMemo(() => {
    return activeStops.reduce((sum, s) => sum + s.durationFromPrevMin, 0);
  }, [activeStops]);

  // ---------------------------------------------------------------------------
  // HANDLERS FOR ADDING / REMOVING / REORDERING JOBS
  // ---------------------------------------------------------------------------
  const handleAddJobToDay = (jobToAdd: Job, customTime?: string) => {
    triggerHapticFeedback('success');

    // Calculate appointment timestamp
    const now = new Date();
    const targetDate = new Date();
    if (dateFilter === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    let finalIsoTime: string;
    if (customTime) {
      const [hours, minutes] = customTime.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      finalIsoTime = targetDate.toISOString();
    } else {
      // Default to next available hour or keep current
      targetDate.setHours(now.getHours() + 1, 0, 0, 0);
      finalIsoTime = targetDate.toISOString();
    }

    const updatedJob: Job = {
      ...jobToAdd,
      appointmentTime: finalIsoTime,
      updatedAt: new Date().toISOString()
    };

    if (onUpdateJob) {
      onUpdateJob(updatedJob);
    }

    setManuallyAddedJobIds(prev => [...new Set([...prev, jobToAdd.id])]);
    setManuallyRemovedJobIds(prev => prev.filter(id => id !== jobToAdd.id));
    setCustomStopOrder(prev => [...prev.filter(id => id !== jobToAdd.id), jobToAdd.id]);
    setIsAddJobModalOpen(false);
  };

  const handleRemoveJobFromDay = (jobToRemove: Job) => {
    triggerHapticFeedback('warning');

    const updatedJob: Job = {
      ...jobToRemove,
      appointmentTime: undefined,
      updatedAt: new Date().toISOString()
    };

    if (onUpdateJob) {
      onUpdateJob(updatedJob);
    }

    setManuallyRemovedJobIds(prev => [...new Set([...prev, jobToRemove.id])]);
    setManuallyAddedJobIds(prev => prev.filter(id => id !== jobToRemove.id));
    setCustomStopOrder(prev => prev.filter(id => id !== jobToRemove.id));
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    triggerHapticFeedback('light');
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= effectiveDayJobs.length) return;

    const currentOrder = effectiveDayJobs.map(j => j.id);
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[newIndex];
    currentOrder[newIndex] = temp;
    setCustomStopOrder(currentOrder);
  };

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
      return now.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return `Yesterday (${yesterday.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })})`;
    }
    if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return tomorrow.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (dateFilter === 'this_week') {
      return 'Current Week (Mon - Sun)';
    }
    if (dateFilter === 'last_week') {
      return 'Last Week (Mon - Sun)';
    }
    if (dateFilter === 'date_range') {
      return 'Custom Date Range';
    }
    return 'All Planned Visits';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3 sm:p-5 max-w-4xl mx-auto w-full select-none">
      
      {/* --------------------------------------------------------------------- */}
      {/* 1. COMPACT TOP HEADER                                                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <CalendarDays className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight">
                Day Plan
              </h1>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.2 rounded-full">
                {totalStopsCount} {totalStopsCount === 1 ? 'Stop' : 'Stops'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {getSubtitle()} • {totalDistanceKm} km road sequence
            </p>
          </div>
        </div>

        {/* Action Buttons: Google Tour & Map Switch */}
        <div className="flex items-center gap-1.5 shrink-0">
          {totalStopsCount > 0 && (
            <a
              href={masterGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHapticFeedback('light')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-xs transition active:scale-95"
              title="Launch full driving sequence in Google Maps app"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Google Tour</span>
            </a>
          )}

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onSwitchToMap();
            }}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-xs transition active:scale-95"
            title="Open Interactive Map"
          >
            <MapIcon className="w-4 h-4 text-blue-600 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. DATE SELECTOR PILLS (Horizontal Scrollable, Never Cut Off)          */}
      {/* --------------------------------------------------------------------- */}
      <div className="shrink-0 flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs mb-2.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('today');
          }}
          className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'today'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
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
            setDateFilter('yesterday');
          }}
          className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'yesterday'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Yesterday</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'yesterday' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.yesterday}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('tomorrow');
          }}
          className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'tomorrow'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
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
          className={`flex-1 min-w-[75px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'this_week'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
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
            setDateFilter('last_week');
          }}
          className={`flex-1 min-w-[75px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'last_week'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Last Week</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'last_week' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.last_week}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('all');
          }}
          className={`flex-1 min-w-[60px] py-1.5 px-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap ${
            dateFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {dateCounts.all}
          </span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. SLEEK SUB-VIEW TOGGLE (Smart Plan | Timeline | Optimizer)           */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center gap-1 text-[11px] font-black text-slate-600 mb-2.5 shrink-0">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('smart');
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
            viewMode === 'smart'
              ? 'bg-white text-slate-900 shadow-2xs font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Smart Plan</span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('timeline');
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
            viewMode === 'timeline'
              ? 'bg-white text-slate-900 shadow-2xs font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <Clock className="w-3 h-3 text-blue-600" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setViewMode('route_control');
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
            viewMode === 'route_control'
              ? 'bg-white text-slate-900 shadow-2xs font-black'
              : 'hover:text-slate-900 font-bold'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
          <span>Optimizer</span>
          {activeRoute && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>}
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. SLEEK & COMPACT ROUTE STATS STRIP (No More Awkward Giant Dark Box)  */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-xs mb-3 shrink-0 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white/10 rounded-xl text-amber-400 shrink-0">
            <Navigation className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight">{totalDistanceKm} km</span>
              <span className="text-[11px] text-slate-300 font-medium">
                • ~{totalDriveTimeMinutes}m drive
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {isUsingGPS ? '📍 Origin: Live GPS' : `🏠 Base: ${profile.baseAddress?.split(',')[0] || 'Point Cook'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 border border-white/10">
            {completedStopsCount}/{totalStopsCount} Done
          </span>

          <button
            onClick={() => handleRunOptimization(selectedGoal, selectedSuburb, prioritizeAgency)}
            disabled={isOptimizing}
            className="text-[10px] font-extrabold text-amber-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95"
            title="Recalculate shortest road sequence"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isOptimizing ? 'Optimizing...' : 'Re-Order'}</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. ADD JOB BUTTON (High Visibility & Flexibility)                     */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setIsAddJobModalOpen(true);
          }}
          className="flex-1 py-2.5 px-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-300 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" />
          <span>Add Job to Today's Plan</span>
          {unscheduledJobs.length > 0 && (
            <span className="ml-1 text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded-full font-bold">
              {unscheduledJobs.length} unscheduled available
            </span>
          )}
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. OPTIMIZER CONTROL PANEL (Expanded in 'route_control' mode)          */}
      {/* --------------------------------------------------------------------- */}
      {viewMode === 'route_control' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 mb-3 shadow-xs flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Routing Goals
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {goalFilteredJobs.length} Eligible Jobs
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => {
                setSelectedGoal('closest_to_me');
                handleRunOptimization('closest_to_me', selectedSuburb, prioritizeAgency);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-95 ${
                selectedGoal === 'closest_to_me'
                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/25'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {activeJobs.length}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">Closest to Me</p>
            </button>

            <button
              onClick={() => {
                setSelectedGoal('quotes_only');
                handleRunOptimization('quotes_only', selectedSuburb, prioritizeAgency);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-95 ${
                selectedGoal === 'quotes_only'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {quoteJobs.length}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">Quotes Only</p>
            </button>

            <button
              onClick={() => {
                setSelectedGoal('active_only');
                handleRunOptimization('active_only', selectedSuburb, prioritizeAgency);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-95 ${
                selectedGoal === 'active_only'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {inProgressJobs.length}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">Active Work</p>
            </button>

            <button
              onClick={() => {
                setSelectedGoal('urgent_and_quotes');
                handleRunOptimization('urgent_and_quotes', selectedSuburb, prioritizeAgency);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-95 ${
                selectedGoal === 'urgent_and_quotes'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {urgentJobs.length + quoteJobs.length}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">Urgent + Quotes</p>
            </button>
          </div>

          {/* Suburb selector & Agency Priority */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">Suburb:</span>
              <button
                onClick={() => {
                  setSelectedSuburb('all');
                  handleRunOptimization(selectedGoal, 'all', prioritizeAgency);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedSuburb === 'all'
                    ? 'bg-blue-600 text-white'
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
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                      selectedSuburb === sub
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className="text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 shrink-0 select-none">
              <input
                type="checkbox"
                checked={prioritizeAgency}
                onChange={e => {
                  setPrioritizeAgency(e.target.checked);
                  handleRunOptimization(selectedGoal, selectedSuburb, e.target.checked);
                }}
                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
              />
              <span className="text-[11px]">Agency Priority</span>
            </label>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. STOP SEQUENCE CARDS (Timeline with Transit Connectors)             */}
      {/* --------------------------------------------------------------------- */}
      {totalStopsCount === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-slate-900 font-black text-sm sm:text-base">
              {dateFilter === 'today'
                ? 'No stops on Today’s plan'
                : dateFilter === 'tomorrow'
                ? 'No stops scheduled for Tomorrow'
                : 'No stops found for this filter'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              Tap the button below to add any job from your pipeline to today's driving route.
            </p>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setIsAddJobModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Select Jobs to Add to Route</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-4">
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
                {/* INLINE TRANSIT CONNECTOR */}
                {index > 0 && (
                  <div className="flex items-center justify-center gap-2 py-0.5">
                    <div className="h-3 w-0.5 bg-slate-300"></div>
                    <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs transition">
                      🚗 {stop.durationFromPrevMin}m drive ({stop.distanceFromPrevKm} km)
                    </span>
                    <div className="h-3 w-0.5 bg-slate-300"></div>
                  </div>
                )}

                {/* STOP CARD */}
                <div
                  className={`bg-white border rounded-2xl p-3 sm:p-4 shadow-xs transition-all relative ${
                    stop.isCompleted
                      ? 'border-emerald-200/90 bg-emerald-50/20 opacity-75'
                      : index === 0
                      ? 'border-blue-500 ring-2 ring-blue-500/15'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Stop #, Time, Status, Re-order, Remove Button */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Stop Number / Completion Toggle */}
                      <button
                        onClick={() => {
                          triggerHapticFeedback('light');
                          onToggleStopCompleted(stop.id);
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition active:scale-90 ${
                          stop.isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 border border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                        title={stop.isCompleted ? 'Mark not finished' : 'Mark finished'}
                      >
                        {stop.isCompleted ? '✓' : stop.stopOrder}
                      </button>

                      {formatJobDisplayId(job) && (
                        <span className="font-mono text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/90 shadow-2xs">
                          {formatJobDisplayId(job)}
                        </span>
                      )}

                      {job.appointmentTime && (
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80 flex items-center gap-1 shadow-2xs">
                          <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>
                            {dateFilter === 'today'
                              ? formatTime(job.appointmentTime)
                              : (getRelativeJobDateLabel(job.appointmentTime) || formatTime(job.appointmentTime))}
                          </span>
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                      >
                        {statusCfg.shortLabel}
                      </span>

                      {job.isAgencyJob && job.realEstateAgency && (
                        <span className="text-[9px] font-extrabold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full flex items-center gap-1 truncate max-w-[140px]">
                          <Building2 className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                          <span className="truncate">{job.realEstateAgency.split(' ')[0]}</span>
                          {job.workOrderNumber && <span className="font-mono text-purple-700">• {job.workOrderNumber}</span>}
                        </span>
                      )}
                    </div>

                    {/* Right Tools: Reorder Arrows & REMOVE Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveStop(index, 'up')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Move stop earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Move Down */}
                      {index < activeStops.length - 1 && (
                        <button
                          onClick={() => handleMoveStop(index, 'down')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Move stop later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* REMOVE FROM TIMELINE BUTTON */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Take "${job.title}" off today's route?\n(The job will stay safely in your pipeline).`)) {
                            handleRemoveJobFromDay(job);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 ml-0.5"
                        title="Remove from Today's Plan"
                      >
                        <X className="w-4 h-4 stroke-[2.4]" />
                      </button>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3
                    onClick={() => onOpenJobDetail(job)}
                    className={`font-black text-sm sm:text-base text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition ${
                      stop.isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {job.title}
                  </h3>

                  {/* Address */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-900 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[2.5]" />
                    <span className="truncate font-black text-slate-900 text-xs sm:text-[13px]">{job.address}</span>
                  </div>

                  {/* Client & Price */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="font-bold text-slate-900">{job.clientName}</span>
                      {job.realEstateAgentName && (
                        <span className="text-[11px] text-purple-700 font-semibold truncate">
                          (PM: {job.realEstateAgentName})
                        </span>
                      )}
                    </div>

                    {/* Touch Action Buttons Strip */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <a
                        href={`tel:${job.clientPhone}`}
                        onClick={() => triggerHapticFeedback('light')}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition active:scale-95"
                        title="Call Client"
                      >
                        <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                      </a>

                      <a
                        href={`sms:${job.clientPhone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(onMyWaySms)}`}
                        onClick={() => triggerHapticFeedback('light')}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition active:scale-95"
                        title="Send On My Way SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                      </a>

                      <a
                        href={liveNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => triggerHapticFeedback('light')}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                        title="Start Google Maps Navigation"
                      >
                        <Navigation className="w-3 h-3 text-amber-600 fill-amber-600" />
                        <span className="text-[10px] font-black">Navigate</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback('light');
                          window.open(buildGoogleCalendarUrl(job, profile), '_blank');
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition active:scale-95"
                        title="Sync to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>

                      <button
                        onClick={() => {
                          triggerHapticFeedback('light');
                          onOpenJobDetail(job);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1 transition active:scale-95"
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
      {/* 8. UNSCHEDULED LEADS SECTION WITH DIRECT "ADD TO ROUTE" BUTTONS       */}
      {/* --------------------------------------------------------------------- */}
      {unscheduledJobs.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs mb-4">
          <div
            onClick={() => setShowUnscheduledQueue(!showUnscheduledQueue)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs shrink-0">
                📥
              </span>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-slate-900 truncate">
                  Unscheduled Pipeline Leads ({unscheduledJobs.length})
                </h4>
                <p className="text-[10px] text-slate-500 truncate">
                  Quotes without a fixed time slot ready to add to today's drive
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                showUnscheduledQueue ? 'rotate-180' : ''
              }`}
            />
          </div>

          {showUnscheduledQueue && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-2 animate-in fade-in duration-150">
              {unscheduledJobs.slice(0, 8).map(ujob => (
                <div
                  key={ujob.id}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{ujob.title}</p>
                    <p className="text-[11px] font-black text-slate-900 truncate">{ujob.address} • <span className="font-semibold text-slate-600">{ujob.clientName}</span></p>
                  </div>
                  <button
                    onClick={() => handleAddJobToDay(ujob)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shrink-0 shadow-2xs transition active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add to Route</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 9. MODAL: ADD ANY JOB TO TODAY'S PLAN / ROUTE                         */}
      {/* --------------------------------------------------------------------- */}
      {isAddJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-sheet-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Job to Day Plan</h3>
                <p className="text-xs text-slate-500">
                  Select any job to add to {dateFilter === 'today' ? "today's" : dateFilter === 'tomorrow' ? "tomorrow's" : "planned"} driving sequence
                </p>
              </div>
              <button
                onClick={() => setIsAddJobModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addJobSearchQuery}
                  onChange={e => setAddJobSearchQuery(e.target.value)}
                  placeholder="Search by client, address, trade, or agency..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Jobs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {availableJobsToAdd.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-xs font-bold">No matching available jobs found</p>
                  <p className="text-[11px] text-slate-400 mt-1">All active jobs may already be in the plan.</p>
                </div>
              ) : (
                availableJobsToAdd.map(j => {
                  const statusCfg = STATUS_CONFIG[j.status];
                  return (
                    <div
                      key={j.id}
                      className="p-3 bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-2 transition hover:shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {formatJobDisplayId(j) && (
                            <span className="font-mono text-[9px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
                              {formatJobDisplayId(j)}
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                            {statusCfg.shortLabel}
                          </span>
                          {j.realEstateAgency && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 truncate max-w-[120px]">
                              {j.realEstateAgency}
                            </span>
                          )}
                          {!j.appointmentTime && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Unscheduled
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{j.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{j.address} • {j.clientName}</p>
                      </div>

                      <button
                        onClick={() => handleAddJobToDay(j)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shrink-0 shadow-xs transition active:scale-95 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{availableJobsToAdd.length} eligible jobs</span>
              <button
                onClick={() => setIsAddJobModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

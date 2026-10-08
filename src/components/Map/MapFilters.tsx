import React, { useState } from 'react';
import { Job, JobStatus } from '../../types';
import { extractSuburb } from '../../services/routeOptimizer';
import { REAL_ESTATE_AGENCIES, SUBURBS_LIST } from '../../data/mockJobs';
import { Navigation, Filter, Compass, Building2, MapPin, ChevronDown, X, Check } from 'lucide-react';

interface MapFiltersProps {
  jobs: Job[];
  selectedStatus: JobStatus | 'all';
  selectedSuburb?: string;
  selectedAgency?: string;
  onSelectStatus: (status: JobStatus | 'all') => void;
  onSelectSuburb?: (suburb: string) => void;
  onSelectAgency?: (agency: string) => void;
  onOptimizeQuotesRoute: () => void;
  isOptimizing?: boolean;
  hasActiveRoute?: boolean;
  onCenterMyLocation: () => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  jobs,
  selectedStatus,
  selectedSuburb = 'all',
  selectedAgency = 'all',
  onSelectStatus,
  onSelectSuburb,
  onSelectAgency,
  onOptimizeQuotesRoute,
  isOptimizing,
  hasActiveRoute,
  onCenterMyLocation
}) => {
  const [showAgencyMenu, setShowAgencyMenu] = useState(false);
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);

  // Counts by status
  const activeJobsCount = jobs.filter(j => j.status !== 'invoiced').length;
  const quoteReqCount = jobs.filter(j => j.status === 'quote_requested').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotedCount = jobs.filter(j => j.status === 'quoted').length;
  const urgentCount = jobs.filter(j => j.status === 'urgent').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const invoicedCount = jobs.filter(j => j.status === 'invoiced').length;
  const agencyCount = jobs.filter(j => j.isAgencyJob && j.realEstateAgency && j.realEstateAgency.trim().length > 0).length;

  // Extract unique agencies from current jobs
  const dynamicAgencies = Array.from(
    new Set(
      jobs
        .map(j => j.realEstateAgency?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  ).sort();

  // Suburb counts
  const suburbCounts: Record<string, number> = {};
  jobs.forEach(j => {
    const sub = extractSuburb(j);
    suburbCounts[sub] = (suburbCounts[sub] || 0) + 1;
  });

  // Calculate active filter count for mobile badge
  let activeFiltersCount = 0;
  if (selectedStatus !== 'all') activeFiltersCount++;
  if (selectedSuburb !== 'all') activeFiltersCount++;
  if (selectedAgency !== 'all') activeFiltersCount++;

  // Calculate visible matching jobs count
  const matchingJobsCount = jobs.filter(job => {
    const matchesStatus = selectedStatus === 'all' ? job.status !== 'invoiced' : job.status === selectedStatus;
    const matchesSuburb = selectedSuburb === 'all' || extractSuburb(job) === selectedSuburb;
    let matchesAgency = true;
    if (selectedAgency === 'agency_only') {
      matchesAgency = Boolean(job.isAgencyJob && job.realEstateAgency && job.realEstateAgency.trim().length > 0);
    } else if (selectedAgency === 'direct_only') {
      matchesAgency = !job.isAgencyJob || !job.realEstateAgency || job.realEstateAgency.trim().length === 0;
    } else if (selectedAgency !== 'all') {
      matchesAgency = Boolean(
        job.realEstateAgency &&
        job.realEstateAgency.trim().toLowerCase() === selectedAgency.trim().toLowerCase()
      );
    }
    return matchesStatus && matchesSuburb && matchesAgency;
  }).length;

  // Format filter label for mobile pill
  const getMobileFilterSummary = () => {
    const parts: string[] = [];
    if (selectedSuburb !== 'all') parts.push(selectedSuburb);
    if (selectedStatus !== 'all') {
      const statusLabels: Record<string, string> = {
        quote_requested: 'Needs Quote',
        in_progress: 'In Progress',
        quoted: 'Quoted',
        urgent: 'Urgent',
        completed: 'Completed',
        invoiced: 'Paid Archive'
      };
      parts.push(statusLabels[selectedStatus] || selectedStatus);
    }
    if (selectedAgency !== 'all') {
      parts.push(selectedAgency === 'agency_only' ? 'Agencies' : selectedAgency === 'direct_only' ? 'Direct' : selectedAgency.split(' ')[0]);
    }
    return parts.length > 0 ? parts.join(' • ') : `Active Jobs (${activeJobsCount})`;
  };

  const handleResetFilters = () => {
    onSelectStatus('all');
    if (onSelectSuburb) onSelectSuburb('all');
    if (onSelectAgency) onSelectAgency('all');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE COMPACT FLOATING BAR (Phones only < 640px)                      */}
      {/* ========================================================================= */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 sm:hidden pointer-events-none">
        {/* Mobile Filter Trigger Capsule */}
        <button
          onClick={() => setIsMobileFilterDrawerOpen(true)}
          className={`pointer-events-auto flex-1 min-w-0 py-2.5 px-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border shadow-lg shadow-slate-900/5 flex items-center justify-between gap-2.5 transition active:scale-[0.98] ${
            activeFiltersCount > 0
              ? 'border-blue-500/80 ring-2 ring-blue-500/20 text-slate-900'
              : 'border-slate-200/90 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-xl transition ${activeFiltersCount > 0 ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30' : 'bg-slate-100 text-slate-600'}`}>
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activeFiltersCount > 0 ? `${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''} Active` : 'Map Filters'}
              </p>
              <p className="text-xs font-extrabold text-slate-900 truncate tracking-tight">
                {getMobileFilterSummary()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
              {matchingJobsCount}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </button>

        {/* Action Buttons: GPS & Route */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={onCenterMyLocation}
            className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition active:scale-95"
            title="Recenter GPS"
          >
            <Compass className="w-4 h-4 text-blue-600 stroke-[2.2]" />
          </button>

          <button
            onClick={onOptimizeQuotesRoute}
            disabled={isOptimizing || quoteReqCount === 0}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 border backdrop-blur-xl transition active:scale-95 ${
              hasActiveRoute
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400'
            } ${quoteReqCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Plan Optimal Route"
          >
            <Navigation className={`w-3.5 h-3.5 stroke-[2.5] ${isOptimizing ? 'animate-spin' : ''}`} />
            <span className="text-[11px] font-extrabold">Route</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE SLIDE-UP FILTER BOTTOM SHEET                                    */}
      {/* ========================================================================= */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-[2500] flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in sm:hidden pointer-events-auto">
          <div className="bg-white border-t border-slate-200 rounded-t-[32px] w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-bottom duration-200">
            {/* Drag Pill */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Filter Map Pins</h3>
                  <p className="text-[11px] text-slate-500">Refine jobs shown on the map</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsMobileFilterDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
              {/* Section 1: Job Status */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Job Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectStatus('all')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                      selectedStatus === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Active</span>
                    <span className="text-[10px] opacity-75">{activeJobsCount}</span>
                  </button>

                  <button
                    onClick={() => onSelectStatus('quote_requested')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                      selectedStatus === 'quote_requested'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Needs Quote
                    </span>
                    <span className="text-[10px] font-bold">{quoteReqCount}</span>
                  </button>

                  <button
                    onClick={() => onSelectStatus('in_progress')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                      selectedStatus === 'in_progress'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      In Progress
                    </span>
                    <span className="text-[10px] font-bold">{inProgressCount}</span>
                  </button>

                  <button
                    onClick={() => onSelectStatus('quoted')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                      selectedStatus === 'quoted'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-purple-50/70 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Quoted
                    </span>
                    <span className="text-[10px] font-bold">{quotedCount}</span>
                  </button>

                  {urgentCount > 0 && (
                    <button
                      onClick={() => onSelectStatus('urgent')}
                      className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                        selectedStatus === 'urgent'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : 'bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                        Urgent
                      </span>
                      <span className="text-[10px] font-bold">{urgentCount}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectStatus('completed')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                      selectedStatus === 'completed'
                        ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Completed</span>
                    <span className="text-[10px]">{completedCount}</span>
                  </button>

                  {invoicedCount > 0 && (
                    <button
                      onClick={() => onSelectStatus('invoiced')}
                      className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-between border transition ${
                        selectedStatus === 'invoiced'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-blue-50/60 text-blue-800 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <span>Paid Archive</span>
                      <span className="text-[10px] font-bold">{invoicedCount}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 2: Suburbs */}
              {onSelectSuburb && (
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Suburb Location
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => onSelectSuburb('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                        selectedSuburb === 'all'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All Suburbs
                    </button>

                    {SUBURBS_LIST.map(sub => {
                      const count = suburbCounts[sub] || 0;
                      if (count === 0) return null;
                      const isSelected = selectedSuburb === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => onSelectSuburb(sub)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{sub}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Agency Work Orders (if any exist) */}
              {onSelectAgency && agencyCount > 0 && (
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Real Estate Partners
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => onSelectAgency('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                        selectedAgency === 'all'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                          : 'bg-purple-50/50 text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      All Sources
                    </button>

                    <button
                      onClick={() => onSelectAgency('agency_only')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                        selectedAgency === 'agency_only'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                          : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <span>All Agency Orders</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800 font-bold">
                        {agencyCount}
                      </span>
                    </button>

                    <button
                      onClick={() => onSelectAgency('direct_only')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                        selectedAgency === 'direct_only'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Direct Residential Only
                    </button>

                    {dynamicAgencies.map(agency => {
                      const count = jobs.filter(j => j.realEstateAgency?.trim().toLowerCase() === agency.toLowerCase()).length;
                      const isSelected = selectedAgency.trim().toLowerCase() === agency.toLowerCase();
                      return (
                        <button
                          key={agency}
                          onClick={() => onSelectAgency(agency)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                              : 'bg-purple-50/60 text-purple-900 border-purple-200/80 hover:bg-purple-100'
                          }`}
                        >
                          <span>{agency}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Apply Button */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <span>Show {matchingJobsCount} {matchingJobsCount === 1 ? 'Job' : 'Jobs'}</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP / TABLET EXPANDED PILL BARS (hidden on mobile, sm:flex)        */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex absolute top-3 left-3 right-3 z-20 flex-col gap-2 pointer-events-none">
        {/* Row 1: Status Filter Pills + Primary Action Buttons */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Status Pills Container */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-900/5 flex-1">
            <button
              onClick={() => onSelectStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Filter className="w-3 h-3 stroke-[2.5]" /> All Active ({activeJobsCount})
            </button>

            <button
              onClick={() => onSelectStatus('quote_requested')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'quote_requested'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'text-amber-800 bg-amber-50/80 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Needs Quote ({quoteReqCount})</span>
            </button>

            <button
              onClick={() => onSelectStatus('in_progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'in_progress'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'text-emerald-800 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>In Progress ({inProgressCount})</span>
            </button>

            <button
              onClick={() => onSelectStatus('quoted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'quoted'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                  : 'text-purple-800 bg-purple-50/80 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Quoted ({quotedCount})</span>
            </button>

            {urgentCount > 0 && (
              <button
                onClick={() => onSelectStatus('urgent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedStatus === 'urgent'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-500/20'
                    : 'text-red-700 bg-red-50/80 border-red-200 hover:bg-red-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                <span>Urgent ({urgentCount})</span>
              </button>
            )}

            <button
              onClick={() => onSelectStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'completed'
                  ? 'bg-slate-700 text-white border-slate-800 shadow-md'
                  : 'text-slate-600 bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>Completed ({completedCount})</span>
            </button>

            {invoicedCount > 0 && (
              <button
                onClick={() => onSelectStatus('invoiced')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedStatus === 'invoiced'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'text-blue-800 bg-blue-50/80 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Paid Archive ({invoicedCount})</span>
              </button>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            <button
              onClick={onCenterMyLocation}
              className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition active:scale-95"
              title="Recenter Map"
            >
              <Compass className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            </button>

            <button
              onClick={onOptimizeQuotesRoute}
              disabled={isOptimizing || quoteReqCount === 0}
              className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 border backdrop-blur-xl transition-all active:scale-95 ${
                hasActiveRoute
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 hover:brightness-110'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 hover:brightness-110'
              } ${quoteReqCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Navigation className={`w-3.5 h-3.5 stroke-[2.5] ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>
                {isOptimizing ? 'Planning...' : hasActiveRoute ? 'Route Active' : 'Optimal Quote Route'}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Real Estate Agency Dropdown & Suburb Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Prominent Real Estate Agency Filter Button */}
          {onSelectAgency && agencyCount > 0 && (
            <div className="pointer-events-auto relative shrink-0">
              <button
                onClick={() => setShowAgencyMenu(!showAgencyMenu)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap shadow-md border backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 ${
                  selectedAgency !== 'all'
                    ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400/40'
                    : 'bg-white/95 text-purple-900 border-purple-200 hover:bg-purple-50'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${selectedAgency !== 'all' ? 'text-purple-200' : 'text-purple-600'}`} />
                <span>
                  {selectedAgency === 'all'
                    ? `🏢 Real Estate Agency (${agencyCount})`
                    : selectedAgency === 'agency_only'
                    ? `🏢 All Agencies (${agencyCount})`
                    : `🏢 ${selectedAgency.replace(' Point Cook', '').replace(' Sanctuary Lakes', '')}`}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Dropdown Menu */}
              {showAgencyMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                  <div className="px-3 py-1 border-b border-slate-100 font-extrabold text-[10px] uppercase text-slate-400 flex items-center justify-between">
                    <span>Filter by Real Estate Partner</span>
                    <span className="text-purple-600 font-bold">{agencyCount} agency jobs</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectAgency('all');
                      setShowAgencyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                      selectedAgency === 'all' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>All Sources (Agencies & Direct)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{jobs.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectAgency('agency_only');
                      setShowAgencyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-purple-50 transition ${
                      selectedAgency === 'agency_only' ? 'font-bold text-purple-700 bg-purple-100/60' : 'text-purple-900'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" /> All Agency Work Orders
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-200 px-1.5 py-0.2 rounded-full">{agencyCount}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectAgency('direct_only');
                      setShowAgencyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                      selectedAgency === 'direct_only' ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Direct Residential Only</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{jobs.length - agencyCount}</span>
                  </button>

                  {dynamicAgencies.length > 0 && <div className="border-t border-slate-100 my-1"></div>}

                  {dynamicAgencies.map(agency => {
                    const count = jobs.filter(j => j.realEstateAgency?.trim().toLowerCase() === agency.toLowerCase()).length;
                    const isSelected = selectedAgency.trim().toLowerCase() === agency.toLowerCase();
                    return (
                      <button
                        key={agency}
                        onClick={() => {
                          onSelectAgency(agency);
                          setShowAgencyMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-purple-50 transition ${
                          isSelected ? 'font-bold text-purple-700 bg-purple-100/70' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate max-w-[180px]">{agency}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Suburbs Filter Pills */}
          {onSelectSuburb && (
            <div className="pointer-events-auto flex items-center gap-1 py-1 px-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" /> Suburb:
              </span>

              <button
                onClick={() => onSelectSuburb('all')}
                className={`px-2 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                  selectedSuburb === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    onClick={() => onSelectSuburb(sub)}
                    className={`px-2 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 ${
                      selectedSuburb === sub
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-full ${selectedSuburb === sub ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Clear Agency Filter Tag (if active) */}
          {selectedAgency !== 'all' && onSelectAgency && (
            <button
              onClick={() => onSelectAgency('all')}
              className="pointer-events-auto px-2 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center gap-1 border border-purple-300 shadow-sm shrink-0 transition active:scale-95"
              title="Reset agency filter"
            >
              <span>Clear Agency</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};



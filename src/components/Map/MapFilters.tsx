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

  // Counts by status
  const quoteReqCount = jobs.filter(j => j.status === 'quote_requested').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotedCount = jobs.filter(j => j.status === 'quoted').length;
  const urgentCount = jobs.filter(j => j.status === 'urgent').length;
  const completedCount = jobs.filter(j => j.status === 'completed' || j.status === 'invoiced').length;
  const agencyCount = jobs.filter(j => j.isAgencyJob).length;

  // Suburb counts
  const suburbCounts: Record<string, number> = {};
  jobs.forEach(j => {
    const sub = extractSuburb(j);
    suburbCounts[sub] = (suburbCounts[sub] || 0) + 1;
  });

  return (
    <div className="absolute top-2.5 sm:top-3.5 left-2 sm:left-3 right-2 sm:right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
      {/* Row 1: Status Filter Pills + Primary Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Status Pills Container */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1 px-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md flex-1 max-w-[calc(100%-110px)] sm:max-w-none">
          <button
            onClick={() => onSelectStatus('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3 h-3" /> All ({jobs.length})
          </button>

          <button
            onClick={() => onSelectStatus('quote_requested')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'quote_requested'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Needs Quote ({quoteReqCount})</span>
          </button>

          <button
            onClick={() => onSelectStatus('in_progress')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'in_progress'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>In Progress ({inProgressCount})</span>
          </button>

          <button
            onClick={() => onSelectStatus('quoted')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'quoted'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Quoted ({quotedCount})</span>
          </button>

          {urgentCount > 0 && (
            <button
              onClick={() => onSelectStatus('urgent')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'urgent'
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>Urgent ({urgentCount})</span>
            </button>
          )}

          <button
            onClick={() => onSelectStatus('completed')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'completed'
                ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Done ({completedCount})</span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={onCenterMyLocation}
            className="p-2 sm:p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-md backdrop-blur-md transition active:scale-95"
            title="Recenter Map"
          >
            <Compass className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={onOptimizeQuotesRoute}
            disabled={isOptimizing || quoteReqCount === 0}
            className={`px-3 py-2 sm:py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md border backdrop-blur-md transition-all active:scale-95 ${
              hasActiveRoute
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 hover:bg-blue-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700'
            } ${quoteReqCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isOptimizing ? 'Planning...' : hasActiveRoute ? 'Route Active' : 'Optimal Quote Route'}
            </span>
            <span className="sm:hidden text-[11px]">
              {isOptimizing ? '...' : 'Route'}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Real Estate Agency Dropdown & Suburb Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Prominent Real Estate Agency Filter Button */}
        {onSelectAgency && (
          <div className="pointer-events-auto relative shrink-0">
            <button
              onClick={() => setShowAgencyMenu(!showAgencyMenu)}
              className={`px-3 py-1.5 rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-md border backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 ${
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

                <div className="border-t border-slate-100 my-1"></div>

                {REAL_ESTATE_AGENCIES.map(agency => {
                  const count = jobs.filter(j => j.realEstateAgency === agency).length;
                  return (
                    <button
                      key={agency}
                      onClick={() => {
                        onSelectAgency(agency);
                        setShowAgencyMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-purple-50 transition ${
                        selectedAgency === agency ? 'font-bold text-purple-700 bg-purple-100/70' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{agency}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedAgency === agency ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
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
  );
};


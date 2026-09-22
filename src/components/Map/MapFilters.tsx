import React from 'react';
import { Job, JobStatus } from '../../types';
import { Navigation, Filter, Compass } from 'lucide-react';

interface MapFiltersProps {
  jobs: Job[];
  selectedStatus: JobStatus | 'all';
  onSelectStatus: (status: JobStatus | 'all') => void;
  onOptimizeQuotesRoute: () => void;
  isOptimizing?: boolean;
  hasActiveRoute?: boolean;
  onCenterMyLocation: () => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  jobs,
  selectedStatus,
  onSelectStatus,
  onOptimizeQuotesRoute,
  isOptimizing,
  hasActiveRoute,
  onCenterMyLocation
}) => {
  // Counts by status
  const quoteReqCount = jobs.filter(j => j.status === 'quote_requested').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotedCount = jobs.filter(j => j.status === 'quoted').length;
  const urgentCount = jobs.filter(j => j.status === 'urgent').length;
  const completedCount = jobs.filter(j => j.status === 'completed' || j.status === 'invoiced').length;

  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-none">
      {/* Top row: Horizontal status pills scroll & Action buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Status Pills Container */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg max-w-[calc(100%-120px)] sm:max-w-none">
          <button
            onClick={() => onSelectStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> All ({jobs.length})
          </button>

          <button
            onClick={() => onSelectStatus('quote_requested')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'quote_requested'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'text-amber-800 bg-amber-50 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Needs Quote ({quoteReqCount})
          </button>

          <button
            onClick={() => onSelectStatus('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'in_progress'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            In Progress ({inProgressCount})
          </button>

          <button
            onClick={() => onSelectStatus('quoted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'quoted'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'text-purple-800 bg-purple-50 border-purple-200/80 hover:bg-purple-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Quoted ({quotedCount})
          </button>

          {urgentCount > 0 && (
            <button
              onClick={() => onSelectStatus('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedStatus === 'urgent'
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Urgent ({urgentCount})
            </button>
          )}

          <button
            onClick={() => onSelectStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedStatus === 'completed'
                ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Done ({completedCount})
          </button>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onCenterMyLocation}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-lg backdrop-blur-md transition active:scale-95"
            title="Recenter Map"
          >
            <Compass className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={onOptimizeQuotesRoute}
            disabled={isOptimizing || quoteReqCount === 0}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
              hasActiveRoute
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 hover:bg-blue-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700'
            } ${quoteReqCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Navigation className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isOptimizing ? 'Planning Route...' : hasActiveRoute ? 'Route Active' : 'Optimal Quote Route'}
            </span>
            <span className="sm:hidden">
              {isOptimizing ? '...' : 'Route'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

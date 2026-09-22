import React, { useState } from 'react';
import { Job, JobStatus, HandymanProfile } from '../../types';
import { STATUS_CONFIG, formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  Search,
  Plus,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  profile: HandymanProfile;
  onSelectJob: (job: Job) => void;
  onAddNewJob: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  profile,
  onSelectJob,
  onAddNewJob
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(searchLower) ||
      job.clientName.toLowerCase().includes(searchLower) ||
      job.address.toLowerCase().includes(searchLower) ||
      job.jobNumber.toLowerCase().includes(searchLower) ||
      job.category.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24 text-slate-900 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Jobs & Quotes Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your customer requests, approved estimates, and in-progress jobs.
          </p>
        </div>

        <button
          onClick={onAddNewJob}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Lead / Quote</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by client, title, address, or #ID..."
            className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setStatusFilter('quote_requested')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              statusFilter === 'quote_requested'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Needs Quote
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              statusFilter === 'in_progress'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('quoted')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              statusFilter === 'quoted'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
          >
            Quoted
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              statusFilter === 'urgent'
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            Urgent
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">No matching jobs found</p>
          <p className="text-xs text-slate-500 mt-1">Try tweaking your search term or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => {
            const statusCfg = STATUS_CONFIG[job.status];

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div>
                  {/* Top meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {job.jobNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                      >
                        {statusCfg.shortLabel}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                      {job.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition leading-snug">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Client & Pricing footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{job.address}</span>
                    </div>

                    <span className="font-semibold text-slate-800">{job.clientName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div>
                      {job.quote ? (
                        <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          {formatCurrency(job.quote.totalAmount, profile.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          Visit: {formatDateTime(job.appointmentTime || job.quoteRequestedDate).split(' at ')[1] || 'Today'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${job.clientPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Call Client"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </a>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs flex items-center gap-1 border border-blue-200 transition duration-150"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

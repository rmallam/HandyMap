import React, { useState } from 'react';
import { Job, JobStatus, HandymanProfile, ReminderItem } from '../../types';
import { STATUS_CONFIG, formatCurrency, formatDateTime, buildLiveNavigationUrl, buildWhatsAppLink } from '../../utils/helpers';
import { generateQuotePDF } from '../../services/pdfGenerator';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { REAL_ESTATE_AGENCIES } from '../../data/mockJobs';
import {
  Search,
  Plus,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  BellRing,
  Building2,
  Filter,
  X,
  FileSpreadsheet,
  ListTodo,
  MessageSquare,
  Navigation2,
  CheckCircle2,
  Download,
  Receipt
} from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  profile: HandymanProfile;
  reminders?: ReminderItem[];
  onSelectJob: (job: Job) => void;
  onAddNewJob: () => void;
  onOpenImport?: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  profile,
  reminders = [],
  onSelectJob,
  onAddNewJob,
  onOpenImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all' | 'all_total'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const agencyCount = jobs.filter(j => j.isAgencyJob && j.realEstateAgency && j.realEstateAgency.trim().length > 0).length;

  const activeJobsCount = jobs.filter(j => j.status !== 'invoiced').length;
  const quoteReqCount = jobs.filter(j => j.status === 'quote_requested').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotedCount = jobs.filter(j => j.status === 'quoted').length;
  const urgentCount = jobs.filter(j => j.status === 'urgent').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const invoicedJobs = jobs.filter(j => j.status === 'invoiced');
  const invoicedCount = invoicedJobs.length;
  const totalPaidRevenue = invoicedJobs.reduce((sum, j) => sum + (j.quote?.totalAmount || 0), 0);

  // Extract unique agencies from current jobs list
  const dynamicAgencies = Array.from(
    new Set(
      jobs
        .map(j => j.realEstateAgency?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  ).sort();

  const filteredJobs = jobs.filter(job => {
    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = job.status !== 'invoiced';
    } else if (statusFilter === 'all_total') {
      matchesStatus = true;
    } else {
      matchesStatus = job.status === statusFilter;
    }
    
    let matchesAgency = true;
    if (agencyFilter === 'agency_only') {
      matchesAgency = Boolean(job.isAgencyJob && job.realEstateAgency && job.realEstateAgency.trim().length > 0);
    } else if (agencyFilter === 'direct_only') {
      matchesAgency = !job.isAgencyJob || !job.realEstateAgency || job.realEstateAgency.trim().length === 0;
    } else if (agencyFilter !== 'all') {
      matchesAgency = Boolean(
        job.realEstateAgency &&
        job.realEstateAgency.trim().toLowerCase() === agencyFilter.trim().toLowerCase()
      );
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(searchLower) ||
      job.clientName.toLowerCase().includes(searchLower) ||
      job.address.toLowerCase().includes(searchLower) ||
      job.jobNumber.toLowerCase().includes(searchLower) ||
      job.category.toLowerCase().includes(searchLower) ||
      (job.realEstateAgency && job.realEstateAgency.toLowerCase().includes(searchLower)) ||
      (job.workOrderNumber && job.workOrderNumber.toLowerCase().includes(searchLower));

    return matchesStatus && matchesAgency && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Jobs & Estimates</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filteredJobs.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage customer requests, approved estimates, and real estate work orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              title="Bulk import jobs from Excel or CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={onAddNewJob}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Lead / Quote</span>
          </button>
        </div>
      </div>

      {/* Search & Status Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 stroke-[2.2]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search client, address, agency, work order #, or trade..."
            className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
            }`}
          >
            All Active ({activeJobsCount})
          </button>
          <button
            onClick={() => setStatusFilter('quote_requested')}
            className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'quote_requested'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-xs'
            }`}
          >
            Needs Quote ({quoteReqCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'in_progress'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('quoted')}
            className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'quoted'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100 shadow-xs'
            }`}
          >
            Quoted ({quotedCount})
          </button>
          {urgentCount > 0 && (
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
                statusFilter === 'urgent'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-500/20'
                  : 'bg-red-50/80 text-red-700 border-red-200 hover:bg-red-100 shadow-xs'
              }`}
            >
              Urgent ({urgentCount})
            </button>
          )}
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === 'completed'
                ? 'bg-slate-700 text-white border-slate-800 shadow-md'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('invoiced')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === 'invoiced'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 shadow-xs'
            }`}
          >
            💼 Paid Archive ({invoicedCount})
          </button>
        </div>
      </div>

      {/* Real Estate Agency Filter Bar */}
      {agencyCount > 0 && (
        <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-sm mb-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 shrink-0 px-2">
            <Building2 className="w-3.5 h-3.5 text-purple-600" /> Agency Filter:
          </span>

          <button
            onClick={() => setAgencyFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              agencyFilter === 'all'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Sources
          </button>

          <button
            onClick={() => setAgencyFilter('agency_only')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              agencyFilter === 'agency_only'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <span>All Agency Orders</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              agencyFilter === 'agency_only' ? 'bg-purple-800 text-white' : 'bg-purple-200 text-purple-800'
            }`}>
              {agencyCount}
            </span>
          </button>

          {dynamicAgencies.map(agency => {
            const count = jobs.filter(j => j.realEstateAgency?.trim().toLowerCase() === agency.toLowerCase()).length;
            if (count === 0) return null;
            const isSelected = agencyFilter.trim().toLowerCase() === agency.toLowerCase();
            return (
              <button
                key={agency}
                onClick={() => setAgencyFilter(agency)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50 border border-slate-200/60'
                }`}
              >
                <span>{agency}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setAgencyFilter('direct_only')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              agencyFilter === 'direct_only'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Direct Residential Only
          </button>
        </div>
      )}

      {/* Active Filter Notice if specific agency is isolated */}
      {agencyFilter !== 'all' && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs text-purple-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              Showing ONLY work orders for: <strong>{agencyFilter === 'agency_only' ? 'All Real Estate Agencies' : agencyFilter === 'direct_only' ? 'Direct Residential Clients' : agencyFilter}</strong> ({filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'})
            </span>
          </div>
          <button
            onClick={() => setAgencyFilter('all')}
            className="p-1 rounded-lg hover:bg-purple-200/60 text-purple-700 transition"
            title="Clear agency filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* Finished & Paid Jobs Archive Summary Banner */}
      {statusFilter === 'invoiced' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 mb-5 shadow-lg border border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Finished & Paid Archive</h2>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Archived from Active Map
                </span>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5 max-w-md">
                Paid jobs are safely archived here with Tax Invoice records. They are hidden from active map pins to keep your route navigation focused.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shrink-0 self-stretch sm:self-auto justify-around sm:justify-start">
            <div>
              <p className="text-[10px] uppercase font-extrabold text-blue-300">Total Paid Revenue</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(totalPaidRevenue, profile.currencySymbol)}</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <p className="text-[10px] uppercase font-extrabold text-blue-300">Paid Invoices</p>
              <p className="text-lg sm:text-xl font-black text-white">{invoicedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-800 font-bold text-sm">No matching jobs found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You can add a new lead, tweak your filters, or upload existing data from a spreadsheet.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Excel / CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNewJob}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => {
            const statusCfg = STATUS_CONFIG[job.status];
            const activeReminder = reminders.find(r => r.jobId === job.id && !r.isSnoozed);

            // Left accent border color mapping
            const statusBorderAccent =
              job.status === 'urgent'
                ? 'border-l-rose-500'
                : job.status === 'quote_requested'
                ? 'border-l-amber-500'
                : job.status === 'in_progress'
                ? 'border-l-emerald-500'
                : job.status === 'quoted'
                ? 'border-l-purple-500'
                : job.status === 'completed'
                ? 'border-l-slate-400'
                : 'border-l-blue-600';

            return (
              <div
                key={job.id}
                onClick={() => {
                  triggerHapticFeedback('light');
                  onSelectJob(job);
                }}
                className={`bg-white hover:bg-slate-50/70 border border-slate-200/90 border-l-[5px] ${statusBorderAccent} rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer group active:scale-[0.99] ${
                  activeReminder?.urgency === 'urgent'
                    ? 'ring-2 ring-red-400/40'
                    : activeReminder?.urgency === 'warning'
                    ? 'ring-2 ring-amber-400/30'
                    : ''
                }`}
              >
                <div>
                  {/* Top meta */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                        {job.jobNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                      >
                        {statusCfg.shortLabel}
                      </span>
                      {activeReminder && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${
                          activeReminder.urgency === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <BellRing className="w-2.5 h-2.5" />
                          {activeReminder.dueText}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-xl border border-slate-200/80">
                      {job.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition leading-snug tracking-tight">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {job.description}
                  </p>

                  {/* Real Estate Agency Work Order Pill */}
                  {job.isAgencyJob && job.realEstateAgency && (
                    <div className="mt-3 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/40 border border-purple-200/80 text-[11px] font-extrabold text-purple-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{job.realEstateAgency}</span>
                      </span>
                      {job.workOrderNumber && (
                        <span className="font-mono text-[10px] font-black text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded-lg">
                          WO #{job.workOrderNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Checklist Tasks Progress Bar (if job has checklist tasks) */}
                  {job.tasks && job.tasks.length > 0 && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                          <span>{job.tasks.filter(t => t.isCompleted).length} of {job.tasks.length} Tasks Done</span>
                        </span>
                        <span className="font-black text-blue-600">
                          {Math.round((job.tasks.filter(t => t.isCompleted).length / job.tasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${(job.tasks.filter(t => t.isCompleted).length / job.tasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Client & Pricing footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[2.2]" />
                      <span className="truncate font-medium">{job.address}</span>
                    </div>

                    <span className="font-extrabold text-slate-900 shrink-0 ml-2">{job.clientName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap sm:flex-nowrap">
                    <div>
                      {job.quote ? (
                        <span className="text-sm font-black text-emerald-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          {formatCurrency(job.quote.totalAmount, profile.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-800 font-extrabold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-xs">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          Visit: {formatDateTime(job.appointmentTime || job.quoteRequestedDate).split(' at ')[1] || 'Today'}
                        </span>
                      )}
                    </div>

                    {/* Direct 1-Tap Action Row */}
                    <div className="flex items-center gap-1.5">
                      {job.clientPhone && (
                        <>
                          <a
                            href={`tel:${job.clientPhone}`}
                            onClick={e => {
                              e.stopPropagation();
                              triggerHapticFeedback('light');
                            }}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95 shadow-xs"
                            title="Call Client"
                          >
                            <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                          </a>

                          <a
                            href={buildWhatsAppLink(job.clientPhone, `Hi ${job.clientName}, regarding your job ${job.title}...`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => {
                              e.stopPropagation();
                              triggerHapticFeedback('light');
                            }}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95 shadow-xs"
                            title="WhatsApp Client"
                          >
                            <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                          </a>
                        </>
                      )}

                      <a
                        href={buildLiveNavigationUrl(job.coordinates, job.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                        }}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95 shadow-xs"
                        title="Google Maps Navigation"
                      >
                        <Navigation2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </a>

                      {(job.status === 'completed' || job.status === 'invoiced') && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            triggerHapticFeedback('light');
                            generateQuotePDF(job, profile);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition active:scale-95"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="w-3 h-3 stroke-[2.5]" />
                          <span>Invoice</span>
                        </button>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                          onSelectJob(job);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-blue-500/20 transition active:scale-95 ml-0.5"
                      >
                        <span>Checklist</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
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

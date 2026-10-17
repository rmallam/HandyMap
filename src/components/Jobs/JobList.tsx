import React, { useState } from 'react';
import { Job, JobStatus, HandymanProfile, ReminderItem } from '../../types';
import {
  STATUS_CONFIG,
  formatCurrency,
  formatDateTime,
  buildLiveNavigationUrl,
  buildWhatsAppLink,
  DateFilterType,
  matchesDateFilter,
  calculateDateFilterCounts,
  getRelativeJobDateLabel,
  isJobToday,
  isJobTomorrow,
  formatJobDisplayId,
  formatDate,
  formatTime
} from '../../utils/helpers';
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
  Receipt,
  ChevronDown,
  User,
  Clock
} from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  profile: HandymanProfile;
  reminders?: ReminderItem[];
  onSelectJob: (job: Job) => void;
  onAddNewJob: () => void;
  onOpenImport?: () => void;
  // Shared Operational Filter Props
  statusFilter?: JobStatus | 'all' | 'all_total';
  onSelectStatus?: (status: JobStatus | 'all' | 'all_total') => void;
  dateFilter?: DateFilterType;
  onSelectDate?: (date: DateFilterType) => void;
  agencyFilter?: string;
  onSelectAgency?: (agency: string) => void;
  agentFilter?: string;
  onSelectAgent?: (agent: string) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  profile,
  reminders = [],
  onSelectJob,
  onAddNewJob,
  onOpenImport,
  statusFilter: propStatusFilter,
  onSelectStatus: propOnSelectStatus,
  dateFilter: propDateFilter,
  onSelectDate: propOnSelectDate,
  agencyFilter: propAgencyFilter,
  onSelectAgency: propOnSelectAgency,
  agentFilter: propAgentFilter,
  onSelectAgent: propOnSelectAgent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState<JobStatus | 'all' | 'all_total'>('all');
  const [internalDateFilter, setInternalDateFilter] = useState<DateFilterType>('all');
  const [internalAgencyFilter, setInternalAgencyFilter] = useState<string>('all');
  const [internalAgentFilter, setInternalAgentFilter] = useState<string>('all');

  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : internalStatusFilter;
  const setStatusFilter = propOnSelectStatus || setInternalStatusFilter;

  const dateFilter = propDateFilter !== undefined ? propDateFilter : internalDateFilter;
  const setDateFilter = propOnSelectDate || setInternalDateFilter;

  const agencyFilter = propAgencyFilter !== undefined ? propAgencyFilter : internalAgencyFilter;
  const setAgencyFilter = propOnSelectAgency || setInternalAgencyFilter;

  const agentFilter = propAgentFilter !== undefined ? propAgentFilter : internalAgentFilter;
  const setAgentFilter = propOnSelectAgent || setInternalAgentFilter;
  const agencyCount = jobs.filter(j => j.isAgencyJob && j.realEstateAgency && j.realEstateAgency.trim().length > 0).length;

  const activeJobsCount = jobs.filter(j => j.status !== 'invoiced' && j.status !== 'cancelled').length;
  const quoteReqCount = jobs.filter(j => j.status === 'quote_requested').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotedCount = jobs.filter(j => j.status === 'quoted').length;
  const urgentCount = jobs.filter(j => j.status === 'urgent').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const cancelledCount = jobs.filter(j => j.status === 'cancelled').length;
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

  // Extract unique agents based on currently selected agency
  const dynamicAgents = Array.from(
    new Set(
      jobs
        .filter(j => {
          if (agencyFilter === 'all' || agencyFilter === 'agency_only') {
            return Boolean(j.isAgencyJob && j.realEstateAgentName?.trim());
          }
          if (agencyFilter === 'direct_only') return false;
          const targetAgency = agencyFilter.trim().toLowerCase();
          const jobAgency = (j.realEstateAgency || '').trim().toLowerCase();
          return Boolean(
            (jobAgency === targetAgency || jobAgency.includes(targetAgency) || targetAgency.includes(jobAgency)) &&
            j.realEstateAgentName?.trim()
          );
        })
        .map(j => j.realEstateAgentName!.trim())
    )
  ).sort();

  // 1. Status & Agency & Agent baseline (Used for dynamic date counts)
  const statusAndAgencyJobs = jobs.filter(job => {
    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = job.status !== 'invoiced' && job.status !== 'cancelled';
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
      const targetAgency = agencyFilter.trim().toLowerCase();
      const jobAgency = (job.realEstateAgency || '').trim().toLowerCase();
      matchesAgency = Boolean(
        jobAgency &&
        (jobAgency === targetAgency ||
         jobAgency.includes(targetAgency) ||
         targetAgency.includes(jobAgency))
      );
    }

    let matchesAgent = true;
    if (agentFilter !== 'all') {
      const targetAgent = agentFilter.trim().toLowerCase();
      const jobAgent = (job.realEstateAgentName || '').trim().toLowerCase();
      matchesAgent = Boolean(
        jobAgent &&
        (jobAgent === targetAgent ||
         jobAgent.includes(targetAgent) ||
         targetAgent.includes(jobAgent))
      );
    }

    return matchesStatus && matchesAgency && matchesAgent;
  });

  // Calculate date counts specifically matching current status & agency scope
  const dateCounts = calculateDateFilterCounts(statusAndAgencyJobs);

  // Baseline date counts across all active open jobs (for empty state context)
  const allActiveOpenJobs = jobs.filter(job => job.status !== 'invoiced' && job.status !== 'cancelled');
  const globalDateCounts = calculateDateFilterCounts(allActiveOpenJobs);

  // 2. Filter by Date and Search term
  const filteredJobs = statusAndAgencyJobs.filter(job => {
    const matchesDate = matchesDateFilter(job, dateFilter);

    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      job.title.toLowerCase().includes(searchLower) ||
      job.clientName.toLowerCase().includes(searchLower) ||
      job.address.toLowerCase().includes(searchLower) ||
      job.jobNumber.toLowerCase().includes(searchLower) ||
      (job.quoteNumber && job.quoteNumber.toLowerCase().includes(searchLower)) ||
      (job.invoiceNumber && job.invoiceNumber.toLowerCase().includes(searchLower)) ||
      job.category.toLowerCase().includes(searchLower) ||
      (job.realEstateAgency && job.realEstateAgency.toLowerCase().includes(searchLower)) ||
      (job.realEstateAgentName && job.realEstateAgentName.toLowerCase().includes(searchLower)) ||
      (job.realEstateAgentEmail && job.realEstateAgentEmail.toLowerCase().includes(searchLower)) ||
      (job.realEstateAgentPhone && job.realEstateAgentPhone.toLowerCase().includes(searchLower)) ||
      (job.workOrderNumber && job.workOrderNumber.toLowerCase().includes(searchLower)) ||
      (job.tenant1Name && job.tenant1Name.toLowerCase().includes(searchLower)) ||
      (job.tenant2Name && job.tenant2Name.toLowerCase().includes(searchLower)) ||
      (job.tenantName && job.tenantName.toLowerCase().includes(searchLower));

    return matchesDate && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Title & Quick Stats */}
      <div className="shrink-0 flex items-center justify-between gap-2 mb-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Jobs & Estimates</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/90 text-slate-700">
              {filteredJobs.length}
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Customer requests, approved estimates & agency orders
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onAddNewJob();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
            title="Create New Job or Import Work Order PDF"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* Quick Work Order PDF / Email Auto-Fill Banner */}
      <div className="shrink-0 mb-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/60 border border-blue-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 truncate">Have a Work Order PDF?</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                100% Free
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Auto-fill Reliance, Ray White or PropertyMe jobs in 1 second
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            onAddNewJob();
          }}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition"
        >
          <span>Import PDF</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prominent Standalone Search Bar */}
      <div className="shrink-0 relative mb-3 group">
        <div className="relative flex items-center">
          {/* Blue Icon Accent Badge */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white shadow-xs group-focus-within:bg-blue-700 group-focus-within:scale-105 transition pointer-events-none">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by client, agent, agency, phone, address, or trade..."
            className="w-full bg-white border-2 border-slate-200/90 hover:border-blue-300 focus:border-blue-600 rounded-2xl pl-12 pr-12 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none shadow-xs hover:shadow-sm focus:shadow-md focus:ring-4 focus:ring-blue-500/10 transition-all"
          />

          {/* Right Action / Match indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm ? (
              <>
                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'match' : 'matches'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setSearchTerm('');
                  }}
                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3 min-h-[46px]">
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('all');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
            }`}
          >
            All Open ({activeJobsCount})
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('quote_requested');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'quote_requested'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-xs'
            }`}
          >
            Needs Quote ({quoteReqCount})
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('in_progress');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'in_progress'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('quoted');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
              statusFilter === 'quoted'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100 shadow-xs'
            }`}
          >
            Quoted ({quotedCount})
          </button>
          {urgentCount > 0 && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setStatusFilter('urgent');
              }}
              className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
                statusFilter === 'urgent'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-500/20'
                  : 'bg-red-50/80 text-red-700 border-red-200 hover:bg-red-100 shadow-xs'
              }`}
            >
              Urgent ({urgentCount})
            </button>
          )}
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('completed');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === 'completed'
                ? 'bg-slate-700 text-white border-slate-800 shadow-md'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setStatusFilter('invoiced');
            }}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === 'invoiced'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 shadow-xs'
            }`}
          >
            💼 Paid Archive ({invoicedCount})
          </button>
          {cancelledCount > 0 && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setStatusFilter('cancelled');
              }}
              className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                statusFilter === 'cancelled'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-rose-50/80 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-xs'
              }`}
            >
              🚫 Cancelled ({cancelledCount})
            </button>
          )}
        </div>

      {/* Date Filter Bar: Today / Tomorrow / This Week / All Dates */}
      <div className="shrink-0 flex items-center justify-between gap-2 mb-2 flex-wrap max-w-full">
        <div className="shrink-0 flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs overflow-x-auto no-scrollbar max-w-full min-h-[42px]">
          <div className="flex items-center gap-1 px-2 py-1 text-xs font-black text-blue-600 shrink-0 border-r border-slate-200/80 mr-0.5">
            <Calendar className="w-3.5 h-3.5 stroke-[2.4]" />
            <span className="text-[11px] hidden xs:inline">When:</span>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setDateFilter('all');
            }}
            className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              dateFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 bg-slate-50/90 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              dateFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {dateCounts.all}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setDateFilter('today');
            }}
            className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              dateFilter === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 bg-slate-50/90 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span>Today</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              dateFilter === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {dateCounts.today}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setDateFilter('tomorrow');
            }}
            className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              dateFilter === 'tomorrow'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 bg-slate-50/90 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span>Tomorrow</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              dateFilter === 'tomorrow' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {dateCounts.tomorrow}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setDateFilter('this_week');
            }}
            className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              dateFilter === 'this_week'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 bg-slate-50/90 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span>This Week</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              dateFilter === 'this_week' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {dateCounts.this_week}
            </span>
          </button>
        </div>
      </div>

      {/* Active Filter Badges Ribbon (Removable pills for active status, date, agency, agent, or search) */}
      {(statusFilter !== 'all' || dateFilter !== 'all' || agencyFilter !== 'all' || agentFilter !== 'all' || searchTerm) && (
        <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3 text-xs flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Active:
          </span>

          {statusFilter !== 'all' && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setStatusFilter('all');
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white font-bold text-[11px] shadow-xs active:scale-95 transition"
              title="Remove status filter"
            >
              <span>Status: <strong className="font-black">{STATUS_CONFIG[statusFilter as JobStatus]?.shortLabel || statusFilter}</strong></span>
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}

          {dateFilter !== 'all' && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setDateFilter('all');
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-[11px] shadow-xs active:scale-95 transition"
              title="Remove date filter"
            >
              <span>When: <strong className="font-black capitalize">{dateFilter === 'today' ? 'Today' : dateFilter === 'tomorrow' ? 'Tomorrow' : 'This Week'}</strong></span>
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}

          {agencyFilter !== 'all' && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setAgencyFilter('all');
                setAgentFilter('all');
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition"
              title="Remove agency filter"
            >
              <span>Agency: <strong className="font-black">{agencyFilter === 'agency_only' ? 'All Agencies' : agencyFilter === 'direct_only' ? 'Direct' : agencyFilter}</strong></span>
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}

          {agentFilter !== 'all' && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setAgentFilter('all');
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition"
              title="Remove agent filter"
            >
              <span>Agent: <strong className="font-black">{agentFilter}</strong></span>
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}

          {searchTerm && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setSearchTerm('');
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 font-bold text-[11px] shadow-xs active:scale-95 transition"
              title="Clear search term"
            >
              <span>&quot;<strong className="font-black truncate max-w-[90px] inline-block align-bottom">{searchTerm}</strong>&quot;</span>
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}

          {/* Reset All Filters button if multiple filters active */}
          {((statusFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0) + (agencyFilter !== 'all' ? 1 : 0) + (agentFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0)) > 1 && (
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                setStatusFilter('all');
                setDateFilter('all');
                setAgencyFilter('all');
                setAgentFilter('all');
                setSearchTerm('');
              }}
              className="shrink-0 text-[11px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 transition active:scale-95 ml-auto"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Real Estate Agency & Agent Smart Cascading Filter */}
      {agencyCount > 0 && (
        <div className="shrink-0 bg-white px-2.5 py-2 rounded-2xl border border-slate-200/90 shadow-xs mb-3 transition">
          <div className="flex items-center gap-1.5">
            {/* Agency Selector */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-purple-600">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <select
                value={agencyFilter}
                onChange={(e) => {
                  triggerHapticFeedback('light');
                  setAgencyFilter(e.target.value);
                  setAgentFilter('all');
                }}
                className={`w-full appearance-none pl-7 pr-6 py-1.5 text-xs font-bold rounded-xl border transition truncate focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                  agencyFilter !== 'all'
                    ? 'bg-purple-50 text-purple-900 border-purple-300 font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="all">🏢 All Sources</option>
                <option value="agency_only">🏢 All Agencies ({agencyCount})</option>
                <option value="direct_only">👤 Direct Clients</option>
                {dynamicAgencies.length > 0 && (
                  <optgroup label="Agencies">
                    {dynamicAgencies.map((agency) => {
                      const count = jobs.filter(
                        (j) => j.realEstateAgency?.trim().toLowerCase() === agency.toLowerCase()
                      ).length;
                      return (
                        <option key={agency} value={agency}>
                          {agency} ({count})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Agent / Property Manager Selector */}
            <div className="relative flex-1 min-w-0">
              <div
                className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                  agencyFilter === 'direct_only' ? 'text-slate-300' : 'text-indigo-600'
                }`}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <select
                value={agentFilter}
                disabled={agencyFilter === 'direct_only'}
                onChange={(e) => {
                  triggerHapticFeedback('light');
                  setAgentFilter(e.target.value);
                }}
                className={`w-full appearance-none pl-7 pr-6 py-1.5 text-xs font-bold rounded-xl border transition truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  agencyFilter === 'direct_only'
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    : agentFilter !== 'all'
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {agencyFilter === 'direct_only' ? (
                  <option value="all">No Agents (Direct)</option>
                ) : (
                  <>
                    <option value="all">
                      {agencyFilter !== 'all' && agencyFilter !== 'agency_only'
                        ? `All in ${agencyFilter}`
                        : dynamicAgents.length > 0
                        ? `All Agents (${dynamicAgents.length})`
                        : 'All Agents'}
                    </option>
                    {dynamicAgents.map((agent) => {
                      const count = jobs.filter((j) => {
                        const matchesThisAgent =
                          j.realEstateAgentName?.trim().toLowerCase() === agent.toLowerCase();
                        if (!matchesThisAgent) return false;
                        if (agencyFilter !== 'all' && agencyFilter !== 'agency_only') {
                          return (
                            j.realEstateAgency?.trim().toLowerCase() ===
                            agencyFilter.trim().toLowerCase()
                          );
                        }
                        return true;
                      }).length;

                      return (
                        <option key={agent} value={agent}>
                          {agent} ({count})
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Clear Filter Button */}
            {(agencyFilter !== 'all' || agentFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setAgencyFilter('all');
                  setAgentFilter('all');
                }}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200/80 transition shrink-0"
                title="Reset agency & agent filters"
                aria-label="Reset filters"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Micro Active Filter Tag (Ultra compact 1-line indicator when filtered) */}
          {(agencyFilter !== 'all' || agentFilter !== 'all') && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
              <span className="truncate">
                Showing:{' '}
                <strong className="text-purple-900 font-bold">
                  {agencyFilter === 'agency_only'
                    ? 'All Agency Orders'
                    : agencyFilter === 'direct_only'
                    ? 'Direct Clients'
                    : agencyFilter}
                </strong>
                {agentFilter !== 'all' && (
                  <>
                    {' '}• Agent: <strong className="text-indigo-900 font-bold">{agentFilter}</strong>
                  </>
                )}
              </span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full shrink-0 ml-2">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          )}
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
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-slate-900 font-black text-base">
              {statusFilter !== 'all' && dateFilter !== 'all'
                ? `No ${STATUS_CONFIG[statusFilter as JobStatus]?.shortLabel || 'matching'} jobs scheduled for ${dateFilter === 'today' ? 'Today' : dateFilter === 'tomorrow' ? 'Tomorrow' : 'This Week'}`
                : dateFilter === 'today'
                ? 'No jobs scheduled for Today'
                : dateFilter === 'tomorrow'
                ? 'No jobs scheduled for Tomorrow'
                : dateFilter === 'this_week'
                ? 'No jobs scheduled for This Week'
                : statusFilter !== 'all'
                ? `No ${STATUS_CONFIG[statusFilter as JobStatus]?.shortLabel || 'matching'} jobs found`
                : 'No matching jobs found'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              {statusFilter !== 'all' && dateFilter !== 'all'
                ? `You have ${statusAndAgencyJobs.length} ${STATUS_CONFIG[statusFilter as JobStatus]?.shortLabel || ''} job(s) in total, and ${globalDateCounts[dateFilter]} visit(s) scheduled for ${dateFilter.replace('_', ' ')} across all categories.`
                : dateFilter !== 'all'
                ? `You have 0 jobs scheduled for ${dateFilter.replace('_', ' ')} under the current filters.`
                : statusFilter !== 'all'
                ? `No jobs currently under status "${STATUS_CONFIG[statusFilter as JobStatus]?.label || statusFilter}".`
                : 'Try adjusting your search terms, clearing your filters, or importing your job records.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setSearchTerm('');
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Clear Search &quot;{searchTerm}&quot;</span>
              </button>
            )}

            {/* If both status and date are filtered, provide 1-tap buttons for either */}
            {statusFilter !== 'all' && dateFilter !== 'all' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setDateFilter('all');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <span>Show All Dates for {STATUS_CONFIG[statusFilter as JobStatus]?.shortLabel || 'Status'} ({statusAndAgencyJobs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <span>Show All {dateFilter === 'today' ? "Today's" : dateFilter === 'tomorrow' ? "Tomorrow's" : "This Week's"} Visits ({globalDateCounts[dateFilter]})</span>
                </button>
              </>
            ) : (
              <>
                {dateFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setDateFilter('all');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <span>View All Dates ({dateCounts.all})</span>
                  </button>
                )}

                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <span>View All Open Jobs ({activeJobsCount})</span>
                  </button>
                )}
              </>
            )}

            {(statusFilter !== 'all' || dateFilter !== 'all' || agencyFilter !== 'all' || agentFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setAgencyFilter('all');
                  setAgentFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Reset All Filters</span>
              </button>
            )}

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
              className="px-4 py-2.5 rounded-xl brand-gradient hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
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

            const completedTasksCount = job.tasks?.filter(t => t.isCompleted).length || 0;
            const totalTasksCount = job.tasks?.length || 0;

            return (
              <div
                key={job.id}
                onClick={() => {
                  triggerHapticFeedback('light');
                  onSelectJob(job);
                }}
                className={`bg-white hover:bg-slate-50/80 border border-slate-200/90 border-l-4 ${statusBorderAccent} rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between gap-1.5 sm:gap-2 cursor-pointer group active:scale-[0.99] ${
                  activeReminder?.urgency === 'urgent'
                    ? 'ring-2 ring-red-400/40'
                    : activeReminder?.urgency === 'warning'
                    ? 'ring-2 ring-amber-400/30'
                    : ''
                }`}
              >
                <div>
                  {/* Top row: Badges & Category */}
                  <div className="flex items-center justify-between gap-1.5 mb-1 text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="font-mono font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 shrink-0">
                        {formatJobDisplayId(job)}
                      </span>
                      <span
                        className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                      >
                        {statusCfg.shortLabel}
                      </span>

                      {/* Scheduled Timing Badge (Today / Tomorrow) */}
                      {isJobToday(job) && (
                        <span className="font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Today
                        </span>
                      )}
                      {isJobTomorrow(job) && (
                        <span className="font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-300 flex items-center gap-1 shrink-0">
                          <Calendar className="w-2.5 h-2.5 text-sky-600" />
                          Tomorrow
                        </span>
                      )}

                      {activeReminder && (
                        <span
                          className={`font-black px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                            activeReminder.urgency === 'urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <BellRing className="w-2.5 h-2.5" />
                          {activeReminder.dueText}
                        </span>
                      )}
                    </div>

                    <span className="font-extrabold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/80 truncate shrink-0 max-w-[110px]">
                      {job.category}
                    </span>
                  </div>

                  {/* Title & 1-line Description snippet */}
                  <h3 className="font-extrabold text-sm sm:text-[15px] text-slate-900 group-hover:text-blue-600 transition leading-snug tracking-tight truncate">
                    {job.title}
                  </h3>

                  {job.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-normal font-normal">
                      {job.description}
                    </p>
                  )}

                  {/* Real Estate Agency & Agent Work Order Pill */}
                  {job.isAgencyJob && (job.realEstateAgency || job.realEstateAgentName) && (
                    <div className="mt-1 px-2 py-0.5 rounded-md bg-purple-50/70 border border-purple-200/70 text-[10px] font-bold text-purple-900 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{job.realEstateAgency || 'Agency'}</span>
                        {job.realEstateAgentName && (
                          <span className="text-purple-700 font-semibold truncate">
                            • {job.realEstateAgentName}
                          </span>
                        )}
                      </span>
                      {job.workOrderNumber && (
                        <span className="font-mono text-[9px] font-extrabold text-purple-800 bg-purple-200/70 px-1.5 py-0.2 rounded shrink-0">
                          WO #{job.workOrderNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Checklist Tasks Progress Bar (Micro-bar) */}
                  {totalTasksCount > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      <span className="font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                        <ListTodo className="w-3 h-3 text-blue-600" />
                        <span>{completedTasksCount}/{totalTasksCount}</span>
                      </span>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${(completedTasksCount / totalTasksCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-black text-blue-600 shrink-0">
                        {Math.round((completedTasksCount / totalTasksCount) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Client & Address row */}
                <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1 text-slate-600 min-w-0 flex-1">
                      <MapPin className="w-3 h-3 text-blue-500 shrink-0 stroke-[2.2]" />
                      <span className="truncate font-medium">{job.address}</span>
                    </div>
                    <span className="font-extrabold text-slate-800 shrink-0 truncate max-w-[120px]">{job.clientName}</span>
                  </div>

                  {/* Creation Date & Time for future reference */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">Created: {formatDateTime(job.createdAt || job.quoteRequestedDate)}</span>
                    </span>
                  </div>

                  {/* Bottom Actions & Price/Date on a single unified line */}
                  <div className="flex items-center justify-between text-xs gap-1 pt-0.5">
                    <div className="min-w-0">
                      {job.quote ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                            {formatCurrency(job.quote.totalAmount, profile.currencySymbol)}
                          </span>
                          {job.appointmentTime && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 hidden xs:inline-flex items-center gap-1 truncate">
                              {getRelativeJobDateLabel(job.appointmentTime)}
                            </span>
                          )}
                        </div>
                      ) : (
                        job.appointmentTime ? (
                          <span className="text-[10px] text-amber-800 font-extrabold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 truncate">
                            <Calendar className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate">{getRelativeJobDateLabel(job.appointmentTime)}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 truncate">
                            <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">Unscheduled</span>
                          </span>
                        )
                      )}
                    </div>

                    {/* Direct 1-Tap Action Row */}
                    <div className="flex items-center gap-1 shrink-0">
                      {job.clientPhone && (
                        <>
                          <a
                            href={`tel:${job.clientPhone}`}
                            onClick={e => {
                              e.stopPropagation();
                              triggerHapticFeedback('light');
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95 shadow-2xs"
                            title="Call Client"
                          >
                            <Phone className="w-3 h-3" />
                          </a>

                          <a
                            href={buildWhatsAppLink(job.clientPhone, `Hi ${job.clientName}, regarding your job ${job.title}...`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => {
                              e.stopPropagation();
                              triggerHapticFeedback('light');
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95 shadow-2xs"
                            title="WhatsApp Client"
                          >
                            <MessageSquare className="w-3 h-3" />
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
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95 shadow-2xs"
                        title="Google Maps Navigation"
                      >
                        <Navigation2 className="w-3 h-3" />
                      </a>

                      {(job.status === 'completed' || job.status === 'invoiced') && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            triggerHapticFeedback('light');
                            generateQuotePDF(job, profile);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs transition active:scale-95"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>Invoice</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                          onSelectJob(job);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs shadow-blue-500/20 transition active:scale-95"
                      >
                        <span>Checklist</span>
                        <ArrowRight className="w-2.5 h-2.5 stroke-[2.5]" />
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

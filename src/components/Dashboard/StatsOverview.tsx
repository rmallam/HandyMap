import React from 'react';
import { Job, HandymanProfile } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import {
  Fuel,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  Award,
  Layers,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

interface StatsOverviewProps {
  jobs: Job[];
  profile: HandymanProfile;
  onResetDemoData: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  jobs,
  profile,
  onResetDemoData
}) => {
  // Financial pipeline sums
  const quoteJobs = jobs.filter(j => j.status === 'quote_requested');
  const quotedJobs = jobs.filter(j => j.status === 'quoted');
  const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'urgent');
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'invoiced');

  const pendingQuoteSum = jobs
    .filter(j => j.status === 'quote_requested' || j.status === 'quoted')
    .reduce((sum, j) => sum + (j.quote?.totalAmount || (profile.defaultHourlyRate * 2.5)), 0);

  const activePipelineSum = activeJobs.reduce((sum, j) => sum + (j.quote?.totalAmount || (profile.defaultHourlyRate * 3)), 0);
  const completedRevenueSum = completedJobs.reduce((sum, j) => sum + (j.quote?.totalAmount || 350), 0);

  // Category counts
  const categoryCounts: Record<string, number> = {};
  jobs.forEach(j => {
    categoryCounts[j.category] = (categoryCounts[j.category] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3.5 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Operations & Revenue Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Financial pipeline estimation, trade activity breakdown, and route fuel savings.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHapticFeedback('warning');
            if (window.confirm('Reset all jobs back to initial Point Cook dataset?')) {
              onResetDemoData();
            }
          }}
          className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center gap-1.5 border border-slate-200/90 shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Pending Quotes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 shadow-xs">
              Pending Quotes
            </span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            {formatCurrency(pendingQuoteSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {quoteJobs.length} site visits • {quotedJobs.length} sent quotes
          </p>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-xs">
              In-Progress Work
            </span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            {formatCurrency(activePipelineSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {activeJobs.length} active jobs currently being performed
          </p>
        </div>

        {/* Card 3: Invoiced & Completed */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80 shadow-xs">
              Billed / Invoiced
            </span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            {formatCurrency(completedRevenueSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {completedJobs.length} closed & archived jobs
          </p>
        </div>
      </div>

      {/* Operational Efficiency & Route Savings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs">
              <Fuel className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Route Fuel & Driving Savings
              </h3>
              <p className="text-[11px] text-slate-500">TSP algorithmic route sequencer</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">~38%</span>
            <span className="text-xs font-bold text-slate-500">driving reduction</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            By grouping multiple quote visits in optimal sequence around Point Cook instead of back-and-forth driving, you save an estimated <strong className="text-slate-900 font-bold">1.4 hours of driving</strong> and <strong className="text-slate-900 font-bold">24.5 km of fuel</strong> per day.
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 shadow-xs">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                On-Site Quote Conversion Rate
              </h3>
              <p className="text-[11px] text-slate-500">Digital signature & WhatsApp export</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-blue-600 tracking-tight">76%</span>
            <span className="text-xs font-bold text-slate-500">estimate close rate</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Presenting itemized estimates with immediate on-screen digital signature capture increases customer approval speed by <strong className="text-slate-900 font-bold">3x</strong> compared to delayed evening paperwork.
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 stroke-[2.4]" /> Jobs & Leads by Trade Category
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <div key={cat} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition">
              <span className="text-xs font-bold text-slate-600 block">{cat}</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{count} {count === 1 ? 'job' : 'jobs'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

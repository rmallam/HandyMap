import React from 'react';
import { Job, HandymanProfile } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import {
  Fuel,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  Award,
  Layers
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
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Performance & Route Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key operational metrics, pipeline estimation values, and travel fuel savings.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset all jobs back to initial Point Cook dataset?')) {
              onResetDemoData();
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Pending Quotes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
              Pending Quotes
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            {formatCurrency(pendingQuoteSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {quoteJobs.length} site visits + {quotedJobs.length} sent quotes
          </p>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
              In-Progress Work
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            {formatCurrency(activePipelineSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeJobs.length} active jobs currently being performed
          </p>
        </div>

        {/* Card 3: Invoiced & Completed */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
              Billed / Invoiced
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            {formatCurrency(completedRevenueSum, profile.currencySymbol)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {completedJobs.length} closed jobs
          </p>
        </div>
      </div>

      {/* Operational Efficiency & Route Savings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Fuel className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Smart Route Fuel & Windshield Savings
            </h3>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-emerald-700">~38%</span>
            <span className="text-xs text-slate-500">driving reduction</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            By grouping multiple quote visits in optimal TSP sequence around Point Cook instead of back-and-forth driving, you save an estimated <strong>1.4 hours of driving time</strong> and <strong>24.5 km of fuel</strong> per day.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              On-Site Quote Conversion Rate
            </h3>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-blue-700">76%</span>
            <span className="text-xs text-slate-500">estimate close rate</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Presenting itemized estimates with immediate on-screen digital signature capture increases client approval speed by <strong>3x</strong> compared to delayed evening paperwork.
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" /> Jobs & Leads by Trade
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <div key={cat} className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">{cat}</span>
              <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{count} jobs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

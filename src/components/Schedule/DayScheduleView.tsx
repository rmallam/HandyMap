import React, { useState } from 'react';
import { Job, HandymanProfile } from '../../types';
import {
  STATUS_CONFIG,
  formatTime,
  DateFilterType,
  matchesDateFilter,
  calculateDateFilterCounts,
  getRelativeJobDateLabel
} from '../../utils/helpers';
import { buildGoogleCalendarUrl, downloadIcsCalendarFile } from '../../utils/calendarExport';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { Calendar, Clock, MapPin, Phone, ArrowRight, Navigation, Download, Plus } from 'lucide-react';

interface DayScheduleViewProps {
  jobs: Job[];
  profile: HandymanProfile;
  onSelectJob: (job: Job) => void;
  onPlanRoute: () => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  jobs,
  profile,
  onSelectJob,
  onPlanRoute
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');

  // Baseline open jobs
  const openJobs = jobs.filter(
    j => j.status !== 'completed' && j.status !== 'invoiced' && j.status !== 'cancelled'
  );

  const dateCounts = calculateDateFilterCounts(openJobs);

  // Filter and sort jobs by appointmentTime or quoteRequestedDate
  const scheduledJobs = openJobs
    .filter(j => matchesDateFilter(j, dateFilter))
    .sort((a, b) => {
      const timeA = a.appointmentTime ? new Date(a.appointmentTime).getTime() : new Date(a.quoteRequestedDate).getTime();
      const timeB = b.appointmentTime ? new Date(b.appointmentTime).getTime() : new Date(b.quoteRequestedDate).getTime();
      return timeA - timeB;
    });

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
    return 'All Scheduled & Pending Lead Visits';
  };

  const getOptimizeRouteLabel = () => {
    if (dateFilter === 'today') return "Optimize Today's Route";
    if (dateFilter === 'tomorrow') return "Optimize Tomorrow's Route";
    if (dateFilter === 'this_week') return "Optimize Week's Route";
    return 'Optimize Route';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3.5 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
              <Calendar className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {dateFilter === 'today'
                  ? "Today's Schedule & Visits"
                  : dateFilter === 'tomorrow'
                  ? "Tomorrow's Schedule & Visits"
                  : dateFilter === 'this_week'
                  ? "This Week's Schedule & Visits"
                  : 'Planned Schedule & Timeline'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {getSubtitle()} • <span className="font-extrabold text-purple-700">{scheduledJobs.length} Visits</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            onPlanRoute();
          }}
          disabled={scheduledJobs.length === 0}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
            scheduledJobs.length > 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Navigation className="w-4 h-4 stroke-[2.5]" />
          <span>{getOptimizeRouteLabel()}</span>
        </button>
      </div>

      {/* Date Filter Segmented Bar */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('today');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'today'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span>Today</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'today' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {dateCounts.today}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('tomorrow');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'tomorrow'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span>Tomorrow</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'tomorrow' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {dateCounts.tomorrow}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('this_week');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'this_week'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span>This Week</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'this_week' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {dateCounts.this_week}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setDateFilter('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
            dateFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <span>All Upcoming</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            dateFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {dateCounts.all}
          </span>
        </button>
      </div>

      {/* Timeline List or Empty State */}
      {scheduledJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-slate-900 font-black text-base">
              {dateFilter === 'today'
                ? 'No visits scheduled for Today'
                : dateFilter === 'tomorrow'
                ? 'No visits scheduled for Tomorrow'
                : dateFilter === 'this_week'
                ? 'No visits scheduled for This Week'
                : 'No upcoming visits found'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              {dateFilter === 'today'
                ? 'Enjoy your downtime, or check tomorrow and this week to plan ahead.'
                : 'Select a job to set an appointment time, or view all upcoming visits.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {dateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setDateFilter('all');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                View All Upcoming ({dateCounts.all})
              </button>
            )}
            {dateFilter === 'today' && dateCounts.tomorrow > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setDateFilter('tomorrow');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                View Tomorrow ({dateCounts.tomorrow})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 flex flex-col gap-5 ml-3 sm:ml-4 mt-2">
        {scheduledJobs.map((job, index) => {
          const statusCfg = STATUS_CONFIG[job.status];
          const appointmentDate = job.appointmentTime ? new Date(job.appointmentTime) : new Date(job.quoteRequestedDate);
          const timeFormatted = formatTime(appointmentDate.toISOString());

          return (
            <div key={job.id} className="relative group">
              {/* Timeline Pin Dot */}
              <div
                className="absolute -left-[31px] sm:-left-[39px] top-2.5 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition group-hover:scale-125"
                style={{ backgroundColor: statusCfg.colorHex }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>

              {/* Schedule Card */}
              <div
                onClick={() => {
                  triggerHapticFeedback('light');
                  onSelectJob(job);
                }}
                className="bg-white hover:bg-slate-50/70 border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 flex flex-col gap-3 cursor-pointer transition-all duration-200 active:scale-[0.99]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-blue-700 text-xs flex items-center gap-1.5 bg-blue-50/90 px-3 py-1 rounded-xl border border-blue-200/80 shadow-xs">
                      <Clock className="w-3.5 h-3.5 stroke-[2.4]" /> {timeFormatted || `Slot ${index + 1}`}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                    >
                      {statusCfg.shortLabel}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
                    Est: {job.estimatedDurationMinutes} mins
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition leading-snug tracking-tight">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-normal">
                    {job.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 min-w-0 flex-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[2.2]" />
                    <span className="truncate font-medium">{job.address}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <span className="font-extrabold text-slate-900">{job.clientName}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                          window.open(buildGoogleCalendarUrl(job, profile), '_blank');
                        }}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95 shadow-xs"
                        title="Sync to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                          downloadIcsCalendarFile(job, profile);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition active:scale-95 shadow-xs"
                        title="Download Apple / Outlook iCal (.ics)"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>

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

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          triggerHapticFeedback('light');
                          onSelectJob(job);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-blue-500/20 transition active:scale-95 ml-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
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

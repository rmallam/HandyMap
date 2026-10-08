import React from 'react';
import { Job, HandymanProfile } from '../../types';
import { STATUS_CONFIG, formatTime } from '../../utils/helpers';
import { buildGoogleCalendarUrl, downloadIcsCalendarFile } from '../../utils/calendarExport';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { Calendar, Clock, MapPin, Phone, ArrowRight, Navigation, Download } from 'lucide-react';

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
  // Sort jobs by appointmentTime or quoteRequestedDate
  const scheduledJobs = [...jobs]
    .filter(j => j.status !== 'completed' && j.status !== 'invoiced')
    .sort((a, b) => {
      const timeA = a.appointmentTime ? new Date(a.appointmentTime).getTime() : new Date(a.quoteRequestedDate).getTime();
      const timeB = b.appointmentTime ? new Date(b.appointmentTime).getTime() : new Date(b.quoteRequestedDate).getTime();
      return timeA - timeB;
    });

  const todayStr = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3.5 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
              <Calendar className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daily Timeline & Visits
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {todayStr} • <span className="font-extrabold text-purple-700">{scheduledJobs.length} Planned Visits</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHapticFeedback('light');
            onPlanRoute();
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95"
        >
          <Navigation className="w-4 h-4 stroke-[2.5]" />
          <span>Optimize Today's Route</span>
        </button>
      </div>

      {/* Timeline List */}
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
    </div>
  );
};

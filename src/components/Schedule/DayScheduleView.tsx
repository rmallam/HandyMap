import React from 'react';
import { Job, HandymanProfile } from '../../types';
import { STATUS_CONFIG, formatTime } from '../../utils/helpers';
import { Calendar, Clock, MapPin, Phone, ArrowRight, Navigation } from 'lucide-react';

interface DayScheduleViewProps {
  jobs: Job[];
  profile: HandymanProfile;
  onSelectJob: (job: Job) => void;
  onPlanRoute: () => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  jobs,
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
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24 text-slate-900 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Day Schedule & Timeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {todayStr} • {scheduledJobs.length} Planned Visits & Jobs
          </p>
        </div>

        <button
          onClick={onPlanRoute}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Navigation className="w-4 h-4" />
          <span>Optimize Today's Route</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 flex flex-col gap-6 ml-3 sm:ml-4 mt-2">
        {scheduledJobs.map((job, index) => {
          const statusCfg = STATUS_CONFIG[job.status];
          const appointmentDate = job.appointmentTime ? new Date(job.appointmentTime) : new Date(job.quoteRequestedDate);
          const timeFormatted = formatTime(appointmentDate.toISOString());

          return (
            <div key={job.id} className="relative group">
              {/* Timeline Pin Dot */}
              <div
                className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition group-hover:scale-125"
                style={{ backgroundColor: statusCfg.colorHex }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>

              {/* Schedule Card */}
              <div
                onClick={() => onSelectJob(job)}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-md flex flex-col gap-3 cursor-pointer transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 text-sm flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                      <Clock className="w-3.5 h-3.5" /> {timeFormatted || `Slot ${index + 1}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                    >
                      {statusCfg.shortLabel}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
                    Est. Duration: {job.estimatedDurationMinutes} mins
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{job.address}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <span className="font-semibold text-slate-800">{job.clientName}</span>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${job.clientPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs flex items-center gap-1 transition border border-blue-200"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
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

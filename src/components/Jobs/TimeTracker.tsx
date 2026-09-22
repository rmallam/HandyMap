import React, { useState, useEffect } from 'react';
import { Job, TimeLog } from '../../types';
import { Play, Square, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { formatTime } from '../../utils/helpers';

interface TimeTrackerProps {
  job: Job;
  onUpdateJob: (updatedJob: Job) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ job, onUpdateJob }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState('');

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStartTimer = () => {
    setIsRunning(true);
    setSessionStartTime(new Date().toISOString());
  };

  const handleStopTimer = () => {
    if (!sessionStartTime) return;
    setIsRunning(false);

    const durationMin = Math.max(1, Math.round(seconds / 60));
    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      durationMinutes: durationMin,
      notes: sessionNote.trim() || 'On-site labor session'
    };

    const updatedJob: Job = {
      ...job,
      timeLogs: [newLog, ...job.timeLogs],
      updatedAt: new Date().toISOString()
    };

    onUpdateJob(updatedJob);
    setSeconds(0);
    setSessionStartTime(null);
    setSessionNote('');
  };

  const handleDeleteLog = (id: string) => {
    const updatedJob: Job = {
      ...job,
      timeLogs: job.timeLogs.filter(t => t.id !== id),
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
  };

  // Format stopwatch seconds as HH:MM:SS
  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalLoggedMinutes = job.timeLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHoursFormatted = (totalLoggedMinutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      {/* Live Stopwatch Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className={`w-7 h-7 ${isRunning ? 'animate-pulse text-emerald-600' : ''}`} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isRunning ? 'Currently Punching Time' : 'On-Site Labor Stopwatch'}
            </span>
            <div className="font-mono text-3xl font-black text-slate-900 tracking-wider">
              {formatStopwatch(seconds)}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {isRunning && (
            <input
              type="text"
              value={sessionNote}
              onChange={e => setSessionNote(e.target.value)}
              placeholder="What task are you working on?"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full sm:w-60 focus:border-blue-500 outline-none"
            />
          )}

          {!isRunning ? (
            <button
              onClick={handleStartTimer}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Punch In / Start Work</span>
            </button>
          ) : (
            <button
              onClick={handleStopTimer}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Punch Out & Log Time</span>
            </button>
          )}
        </div>
      </div>

      {/* Time History Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Recorded Labor Sessions
          </h3>
          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Total: {totalHoursFormatted} hrs ({totalLoggedMinutes} mins)
          </span>
        </div>

        {job.timeLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No labor time logged yet. Hit "Punch In" when you begin on-site work.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {job.timeLogs.map(log => (
              <div
                key={log.id}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">{log.notes || 'Labor session'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatTime(log.startTime)} {log.endTime ? `– ${formatTime(log.endTime)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {log.durationMinutes} min
                  </span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

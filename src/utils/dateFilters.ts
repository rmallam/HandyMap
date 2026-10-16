import { Job } from '../types';

export type DateFilterType = 'all' | 'today' | 'tomorrow' | 'this_week';

/**
 * Extracts target date for a job.
 * Only returns a date if the job has an explicit appointmentTime scheduled.
 * Unscheduled jobs return null so they are not falsely treated as today's visits.
 */
export function getJobTargetDate(job: Job): Date | null {
  if (!job.appointmentTime) return null;
  const d = new Date(job.appointmentTime);
  return isNaN(d.getTime()) ? null : d;
}


/**
 * Checks whether two Date objects share the same local calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Checks whether a job is scheduled or requested for today.
 */
export function isJobToday(job: Job, now: Date = new Date()): boolean {
  const d = getJobTargetDate(job);
  if (!d) return false;
  return isSameDay(d, now);
}

/**
 * Checks whether a job is scheduled or requested for tomorrow.
 */
export function isJobTomorrow(job: Job, now: Date = new Date()): boolean {
  const d = getJobTargetDate(job);
  if (!d) return false;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return isSameDay(d, tomorrow);
}

/**
 * Checks whether a job falls within the current calendar week (Monday 00:00 to Sunday 23:59:59).
 */
export function isJobThisWeek(job: Job, now: Date = new Date()): boolean {
  const d = getJobTargetDate(job);
  if (!d) return false;
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
}

/**
 * Filters a job by DateFilterType.
 */
export function matchesDateFilter(job: Job, filter: DateFilterType, now: Date = new Date()): boolean {
  if (filter === 'all') return true;
  if (filter === 'today') return isJobToday(job, now);
  if (filter === 'tomorrow') return isJobTomorrow(job, now);
  if (filter === 'this_week') return isJobThisWeek(job, now);
  return true;
}

/**
 * Counts how many jobs match each date filter option.
 */
export function calculateDateFilterCounts(jobs: Job[], now: Date = new Date()): {
  all: number;
  today: number;
  tomorrow: number;
  this_week: number;
} {
  let today = 0;
  let tomorrow = 0;
  let this_week = 0;

  for (const job of jobs) {
    if (isJobToday(job, now)) today++;
    if (isJobTomorrow(job, now)) tomorrow++;
    if (isJobThisWeek(job, now)) this_week++;
  }

  return {
    all: jobs.length,
    today,
    tomorrow,
    this_week
  };
}

/**
 * Returns a human-friendly label for a job's scheduled timing relative to today.
 * e.g. "Today at 2:30 PM", "Tomorrow at 9:00 AM", or "Thu, 15 Oct at 11:00 AM"
 */
export function getRelativeJobDateLabel(dateStr?: string, now: Date = new Date()): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const timeStr = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isSameDay(d, now)) {
    return `Today at ${timeStr}`;
  }

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (isSameDay(d, tomorrow)) {
    return `Tomorrow at ${timeStr}`;
  }

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(d, yesterday)) {
    return `Yesterday at ${timeStr}`;
  }

  return `${d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at ${timeStr}`;
}

import { Job } from '../types';

export type DateFilterType = 'all' | 'today' | 'yesterday' | 'tomorrow' | 'this_week' | 'last_week' | 'date_range';

/**
 * Parses a YYYY-MM-DD or ISO date string into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

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
 * Returns the effective date of a job for filtering.
 * If allowFallback is true, falls back to quoteRequestedDate or createdAt if appointmentTime is not set.
 */
export function getJobDate(job: Job, allowFallback: boolean = false): Date | null {
  if (job.appointmentTime) {
    const d = new Date(job.appointmentTime);
    if (!isNaN(d.getTime())) return d;
  }
  if (allowFallback) {
    const fallbackStr = job.quoteRequestedDate || job.createdAt;
    if (fallbackStr) {
      const d = new Date(fallbackStr);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
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
 * Checks whether a job was scheduled or created/requested yesterday.
 */
export function isJobYesterday(job: Job, now: Date = new Date()): boolean {
  const d = getJobDate(job, true);
  if (!d) return false;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return isSameDay(d, yesterday);
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
 * Checks whether a job falls within the previous calendar week (Monday 00:00 to Sunday 23:59:59 of last week).
 */
export function isJobLastWeek(job: Job, now: Date = new Date()): boolean {
  const d = getJobDate(job, true);
  if (!d) return false;
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToThisMonday = (day === 0 ? -6 : 1) - day;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToThisMonday, 0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 7, 0, 0, 0, 0);
  const endOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 1, 23, 59, 59, 999);
  return d >= startOfLastWeek && d <= endOfLastWeek;
}

/**
 * Checks whether a job falls within a custom date range (inclusive).
 */
export function isJobInDateRange(
  job: Job,
  startDateStr?: string,
  endDateStr?: string
): boolean {
  if (!startDateStr && !endDateStr) return true;
  const d = getJobDate(job, true);
  if (!d) return false;

  if (startDateStr) {
    const s = parseLocalDate(startDateStr);
    if (s) {
      s.setHours(0, 0, 0, 0);
      if (d < s) return false;
    }
  }
  if (endDateStr) {
    const e = parseLocalDate(endDateStr);
    if (e) {
      e.setHours(23, 59, 59, 999);
      if (d > e) return false;
    }
  }
  return true;
}

/**
 * Filters a job by DateFilterType.
 */
export function matchesDateFilter(
  job: Job,
  filter: DateFilterType,
  now: Date = new Date(),
  customStartDate?: string,
  customEndDate?: string
): boolean {
  if (filter === 'all') return true;
  if (filter === 'today') return isJobToday(job, now);
  if (filter === 'yesterday') return isJobYesterday(job, now);
  if (filter === 'tomorrow') return isJobTomorrow(job, now);
  if (filter === 'this_week') return isJobThisWeek(job, now);
  if (filter === 'last_week') return isJobLastWeek(job, now);
  if (filter === 'date_range') return isJobInDateRange(job, customStartDate, customEndDate);
  return true;
}

/**
 * Counts how many jobs match each date filter option.
 */
export function calculateDateFilterCounts(
  jobs: Job[],
  now: Date = new Date(),
  customStartDate?: string,
  customEndDate?: string
): {
  all: number;
  today: number;
  yesterday: number;
  tomorrow: number;
  this_week: number;
  last_week: number;
  date_range: number;
} {
  let today = 0;
  let yesterday = 0;
  let tomorrow = 0;
  let this_week = 0;
  let last_week = 0;
  let date_range = 0;

  for (const job of jobs) {
    if (isJobToday(job, now)) today++;
    if (isJobYesterday(job, now)) yesterday++;
    if (isJobTomorrow(job, now)) tomorrow++;
    if (isJobThisWeek(job, now)) this_week++;
    if (isJobLastWeek(job, now)) last_week++;
    if (customStartDate || customEndDate) {
      if (isJobInDateRange(job, customStartDate, customEndDate)) date_range++;
    }
  }

  return {
    all: jobs.length,
    today,
    yesterday,
    tomorrow,
    this_week,
    last_week,
    date_range
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

import { Job, HandymanProfile, ReminderItem, ReminderType, ReminderUrgency } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';

const SNOOZED_STORAGE_KEY = 'handymap_snoozed_reminders';
const LAST_MORNING_DIGEST_KEY = 'handymap_last_morning_digest_date';

export function loadSnoozedReminderIds(): string[] {
  try {
    const data = localStorage.getItem(SNOOZED_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSnoozedReminderIds(ids: string[]): void {
  try {
    localStorage.setItem(SNOOZED_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save snoozed reminders:', err);
  }
}

/**
 * Checks if a date string falls on today's local date.
 */
export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const today = new Date();
  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}

/**
 * Returns all active jobs scheduled for today.
 */
export function getJobsScheduledForToday(jobs: Job[]): Job[] {
  return jobs.filter(j => {
    if (j.status === 'invoiced') return false; // Exclude paid/archived jobs
    return isDateToday(j.appointmentTime) || (j.status === 'in_progress' && isDateToday(j.updatedAt));
  }).sort((a, b) => {
    const timeA = a.appointmentTime ? new Date(a.appointmentTime).getTime() : 0;
    const timeB = b.appointmentTime ? new Date(b.appointmentTime).getTime() : 0;
    return timeA - timeB;
  });
}

/**
 * Generates an actionable list of high-value reminders based on active job states.
 * Filters out noise so only truly critical & urgent items appear in Alerts.
 */
export function generateReminders(
  jobs: Job[],
  profile: HandymanProfile,
  snoozedIds: string[] = []
): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const now = new Date().getTime();
  const ONE_HOUR = 60 * 60 * 1000;

  for (const job of jobs) {
    // Exclude finished & paid jobs from active alerts
    if (job.status === 'invoiced') continue;

    // 1. URGENT / EMERGENCY UNATTENDED LEADS
    if (job.priority === 'urgent' && (job.status === 'quote_requested' || job.status === 'in_progress')) {
      const reminderId = `urgent-${job.id}`;
      reminders.push({
        id: reminderId,
        jobId: job.id,
        job,
        type: 'urgent_unattended',
        urgency: 'urgent',
        title: `🚨 Urgent Job: ${job.title}`,
        message: `High-priority emergency lead from ${job.clientName} (${job.address}). Immediate response needed.`,
        suggestedActionLabel: 'Call Client Now',
        suggestedActionType: 'call',
        actionDraftText: `Hi ${job.clientName}, Alex from ${profile.businessName} responding urgently regarding ${job.title}. I am available to attend immediately.`,
        dueText: 'Immediate Action',
        createdAt: job.updatedAt || job.createdAt,
        isSnoozed: snoozedIds.includes(reminderId)
      });
    }

    // 2. APPOINTMENTS SCHEDULED FOR TODAY
    if (job.appointmentTime && isDateToday(job.appointmentTime) && job.status !== 'completed') {
      const apptTime = new Date(job.appointmentTime).getTime();
      const diffHours = (apptTime - now) / ONE_HOUR;
      const reminderId = `today-appt-${job.id}`;
      const timeFormatted = formatTime(job.appointmentTime);
      const isImminent = diffHours > 0 && diffHours <= 1.5;

      reminders.push({
        id: reminderId,
        jobId: job.id,
        job,
        type: 'upcoming_appointment',
        urgency: isImminent ? 'urgent' : 'warning',
        title: `⏰ Today: ${job.title} at ${timeFormatted}`,
        message: `Scheduled site visit with ${job.clientName} at ${job.address}.`,
        suggestedActionLabel: 'Send Arrival SMS',
        suggestedActionType: 'sms_followup',
        actionDraftText: `Hi ${job.clientName}, Alex from ${profile.businessName} here. Confirming our appointment today around ${timeFormatted} for "${job.title}". See you soon!`,
        dueText: diffHours < 0 ? 'Happening now' : `At ${timeFormatted}`,
        createdAt: job.appointmentTime,
        isSnoozed: snoozedIds.includes(reminderId)
      });
    }

    // 3. OVERDUE QUOTE REQUESTS (> 24 Hours Unscheduled)
    if (job.status === 'quote_requested' && job.priority !== 'urgent' && !job.appointmentTime) {
      const requestedTime = new Date(job.quoteRequestedDate || job.createdAt).getTime();
      const elapsedHours = Math.max(1, Math.round((now - requestedTime) / ONE_HOUR));

      // Only alert if waiting over 24 hours to avoid spamming brand-new leads
      if (elapsedHours >= 24) {
        const reminderId = `quote-overdue-${job.id}`;
        const draftSms = `Hi ${job.clientName}, this is Alex from ${profile.businessName}. We received your quote request for "${job.title}" and would love to arrange a quick on-site inspection. When suits you best this week?`;

        reminders.push({
          id: reminderId,
          jobId: job.id,
          job,
          type: 'delayed_quote_visit',
          urgency: elapsedHours >= 48 ? 'urgent' : 'warning',
          title: `🟠 Quote Pending (${Math.round(elapsedHours / 24)}d unscheduled)`,
          message: `${job.clientName} requested an estimate for "${job.title}". Book a site visit before the lead goes cold.`,
          suggestedActionLabel: 'Send Visit Invite SMS',
          suggestedActionType: 'sms_followup',
          actionDraftText: draftSms,
          dueText: `${Math.round(elapsedHours / 24)}d pending`,
          createdAt: job.quoteRequestedDate || job.createdAt,
          isSnoozed: snoozedIds.includes(reminderId)
        });
      }
    }

    // 4. QUOTE FOLLOW-UPS (> 48 Hours Awaiting Customer Approval)
    if (job.status === 'quoted') {
      const quoteTime = job.quote?.createdAt ? new Date(job.quote.createdAt).getTime() : new Date(job.updatedAt).getTime();
      const elapsedHours = Math.max(1, Math.round((now - quoteTime) / ONE_HOUR));

      if (elapsedHours >= 48) {
        const quoteTotal = job.quote ? formatCurrency(job.quote.totalAmount) : '$0';
        const reminderId = `quoted-followup-${job.id}`;
        const draftSms = `Hi ${job.clientName}, Alex from ${profile.businessName} here! Just following up on the estimate for "${job.title}" (${quoteTotal}). Let me know if you have any questions or want to lock in a date!`;

        reminders.push({
          id: reminderId,
          jobId: job.id,
          job,
          type: 'quote_followup',
          urgency: 'info',
          title: `🟣 Follow Up on Quote (${quoteTotal})`,
          message: `Quote sent to ${job.clientName} ${Math.round(elapsedHours / 24)} days ago. Follow up to secure the job.`,
          suggestedActionLabel: 'Send Follow-Up SMS',
          suggestedActionType: 'sms_followup',
          actionDraftText: draftSms,
          dueText: `${Math.round(elapsedHours / 24)}d ago`,
          createdAt: job.quote?.createdAt || job.updatedAt,
          isSnoozed: snoozedIds.includes(reminderId)
        });
      }
    }

    // 5. UNINVOICED COMPLETED JOBS (Collect Payment)
    if (job.status === 'completed') {
      const reminderId = `uninvoiced-${job.id}`;
      const totalAmount = job.quote?.totalAmount ? formatCurrency(job.quote.totalAmount) : 'Tax Invoice';
      reminders.push({
        id: reminderId,
        jobId: job.id,
        job,
        type: 'uninvoiced_completion',
        urgency: 'warning',
        title: `🔵 Unbilled Job: Send Invoice (${totalAmount})`,
        message: `Work completed for ${job.clientName}. Generate Tax Invoice to collect payment.`,
        suggestedActionLabel: 'Generate Tax Invoice',
        suggestedActionType: 'invoice',
        actionDraftText: `Hi ${job.clientName}, thank you for choosing ${profile.businessName}. The work on "${job.title}" is complete. Please find your invoice attached.`,
        dueText: 'Ready to bill',
        createdAt: job.updatedAt,
        isSnoozed: snoozedIds.includes(reminderId)
      });
    }
  }

  // Sort reminders: Urgent first, then warnings, then info, then by creation
  const urgencyWeight: Record<ReminderUrgency, number> = {
    urgent: 3,
    warning: 2,
    info: 1
  };

  return reminders.sort((a, b) => {
    if (a.isSnoozed !== b.isSnoozed) {
      return a.isSnoozed ? 1 : -1;
    }
    const weightDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Web Browser Native Notification API Helpers
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export function sendBrowserNotification(title: string, body: string, onClickUrl?: string): boolean {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const notif = new Notification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg'
    });
    if (onClickUrl) {
      notif.onclick = () => {
        window.focus();
        window.location.href = onClickUrl;
      };
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger browser notification:', err);
    return false;
  }
}

/**
 * Formats a clean, consolidated Morning Daily Digest of all jobs scheduled for today.
 */
export function formatMorningDigest(todayJobs: Job[], profile: HandymanProfile): { title: string; body: string } {
  const count = todayJobs.length;
  const title = `☀️ Good Morning, ${profile.name}! (${count} ${count === 1 ? 'Job' : 'Jobs'} Today)`;

  const lines = todayJobs.slice(0, 4).map((j, idx) => {
    const timeStr = j.appointmentTime ? formatTime(j.appointmentTime) : 'Site Visit';
    const suburbStr = j.suburb || j.address.split(',')[1]?.trim() || 'Site';
    return `${idx + 1}. ${timeStr} • ${suburbStr} — ${j.title.slice(0, 30)}`;
  });

  if (todayJobs.length > 4) {
    lines.push(`+ ${todayJobs.length - 4} more scheduled visits`);
  }

  const body = lines.join('\n');
  return { title, body };
}

/**
 * Checks and sends ONE single consolidated push notification in the morning
 * listing all jobs scheduled for that day. Does not spam multiple alerts.
 */
export function checkAndSendMorningDailyDigest(
  jobs: Job[],
  profile: HandymanProfile,
  force = false
): boolean {
  const todayKey = new Date().toISOString().slice(0, 10);
  const lastSentDate = localStorage.getItem(LAST_MORNING_DIGEST_KEY);

  // Send only once per calendar day (unless forced for testing)
  if (!force && lastSentDate === todayKey) {
    return false;
  }

  const todayJobs = getJobsScheduledForToday(jobs);
  if (todayJobs.length === 0) {
    return false;
  }

  const { title, body } = formatMorningDigest(todayJobs, profile);
  const sent = sendBrowserNotification(title, body, '/#schedule');

  if (sent || isBrowserNotificationSupported()) {
    localStorage.setItem(LAST_MORNING_DIGEST_KEY, todayKey);
  }

  return sent;
}


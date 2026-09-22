import { Job, HandymanProfile, ReminderItem, ReminderType, ReminderUrgency } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';

const SNOOZED_STORAGE_KEY = 'handymap_snoozed_reminders';

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
 * Generates an actionable list of reminders based on active job states and time thresholds.
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
        message: `High-priority emergency lead from ${job.clientName} (${job.address}). Needs immediate contact or dispatch.`,
        suggestedActionLabel: 'Call Client Now',
        suggestedActionType: 'call',
        actionDraftText: `Hi ${job.clientName}, Alex from ${profile.businessName} responding urgently regarding ${job.title}. I am available to attend immediately.`,
        dueText: 'Immediate Action',
        createdAt: job.updatedAt || job.createdAt,
        isSnoozed: snoozedIds.includes(reminderId)
      });
    }

    // 2. WAITING QUOTE REQUESTS (Overdue / Delayed Site Visits)
    if (job.status === 'quote_requested' && job.priority !== 'urgent') {
      const requestedTime = new Date(job.quoteRequestedDate || job.createdAt).getTime();
      const elapsedHours = Math.max(1, Math.round((now - requestedTime) / ONE_HOUR));
      const isDelayed = elapsedHours >= 12 || !job.appointmentTime;

      if (isDelayed) {
        const reminderId = `quote-delayed-${job.id}`;
        const urgency: ReminderUrgency = elapsedHours >= 24 ? 'urgent' : 'warning';
        const draftSms = `Hi ${job.clientName}, this is Alex from ${profile.businessName}. We received your quote request for "${job.title}" and would love to arrange a quick on-site inspection. When suits you best today or tomorrow?`;

        reminders.push({
          id: reminderId,
          jobId: job.id,
          job,
          type: 'delayed_quote_visit',
          urgency,
          title: `🟠 Quote Visit Pending (${elapsedHours}h elapsed)`,
          message: `${job.clientName} requested an estimate for "${job.title}". No appointment locked in yet.`,
          suggestedActionLabel: 'Send Visit Invite SMS',
          suggestedActionType: 'sms_followup',
          actionDraftText: draftSms,
          dueText: elapsedHours >= 24 ? `${Math.round(elapsedHours / 24)}d overdue` : `${elapsedHours}h ago`,
          createdAt: job.quoteRequestedDate || job.createdAt,
          isSnoozed: snoozedIds.includes(reminderId)
        });
      }
    }

    // 3. QUOTED FOLLOW-UPS (Sent quotes awaiting customer approval)
    if (job.status === 'quoted') {
      const quoteTime = job.quote?.createdAt ? new Date(job.quote.createdAt).getTime() : new Date(job.updatedAt).getTime();
      const elapsedHours = Math.max(1, Math.round((now - quoteTime) / ONE_HOUR));
      const quoteTotal = job.quote ? formatCurrency(job.quote.totalAmount) : '$0';

      const reminderId = `quoted-followup-${job.id}`;
      const draftSms = `Hi ${job.clientName}, Alex from ${profile.businessName} here! Just checking in to see if you had any questions regarding the estimate for "${job.title}" (${quoteTotal})? Let me know if you'd like to lock in a start date!`;

      reminders.push({
        id: reminderId,
        jobId: job.id,
        job,
        type: 'quote_followup',
        urgency: elapsedHours >= 48 ? 'warning' : 'info',
        title: `🟣 Follow Up on Quote (${quoteTotal})`,
        message: `Estimate presented to ${job.clientName}. Follow up to answer questions and close the job.`,
        suggestedActionLabel: 'Send Follow-Up SMS',
        suggestedActionType: 'sms_followup',
        actionDraftText: draftSms,
        dueText: elapsedHours >= 24 ? `${Math.round(elapsedHours / 24)}d pending` : `${elapsedHours}h pending`,
        createdAt: job.quote?.createdAt || job.updatedAt,
        isSnoozed: snoozedIds.includes(reminderId)
      });
    }

    // 4. UPCOMING SITE APPOINTMENTS (Within today or next 6 hours)
    if (job.appointmentTime && (job.status === 'quote_requested' || job.status === 'in_progress')) {
      const apptTime = new Date(job.appointmentTime).getTime();
      const diffHours = (apptTime - now) / ONE_HOUR;

      // Appointment within the next 8 hours or slightly past (today's appointment)
      if (diffHours >= -2 && diffHours <= 8) {
        const reminderId = `appt-${job.id}`;
        const isImminent = diffHours > 0 && diffHours <= 1.5;
        const timeFormatted = formatTime(job.appointmentTime);
        const draftSms = `Hi ${job.clientName}, Alex from ${profile.businessName} here. I am confirming our appointment today around ${timeFormatted} for "${job.title}". See you soon!`;

        reminders.push({
          id: reminderId,
          jobId: job.id,
          job,
          type: 'upcoming_appointment',
          urgency: isImminent ? 'urgent' : 'info',
          title: `⏰ Appointment Today at ${timeFormatted}`,
          message: `Site visit scheduled with ${job.clientName} at ${job.address}.`,
          suggestedActionLabel: 'Send Arrival SMS',
          suggestedActionType: 'sms_followup',
          actionDraftText: draftSms,
          dueText: diffHours < 0 ? 'Happening now' : `In ${Math.max(1, Math.round(diffHours * 60))} mins`,
          createdAt: job.appointmentTime,
          isSnoozed: snoozedIds.includes(reminderId)
        });
      }
    }

    // 5. IN-PROGRESS ACTIVE JOBS (Checkpoints)
    if (job.status === 'in_progress') {
      const hasPhotos = job.photos && job.photos.length > 0;
      const hasTimeLogs = job.timeLogs && job.timeLogs.length > 0;

      if (!hasPhotos || !hasTimeLogs) {
        const reminderId = `active-check-${job.id}`;
        reminders.push({
          id: reminderId,
          jobId: job.id,
          job,
          type: 'in_progress_check',
          urgency: 'info',
          title: `🟢 Active Job: Log Time & Photos`,
          message: `"${job.title}" for ${job.clientName} is in progress. Remember to track on-site labor & snap completion photos.`,
          suggestedActionLabel: 'Open Job Tracker',
          suggestedActionType: 'open_job',
          dueText: 'In Progress',
          createdAt: job.updatedAt,
          isSnoozed: snoozedIds.includes(reminderId)
        });
      }
    }

    // 6. UNINVOICED COMPLETED JOBS (Collect Payment)
    if (job.status === 'completed') {
      const reminderId = `uninvoiced-${job.id}`;
      const totalAmount = job.quote?.totalAmount ? formatCurrency(job.quote.totalAmount) : 'Tax Invoice';
      reminders.push({
        id: reminderId,
        jobId: job.id,
        job,
        type: 'uninvoiced_completion',
        urgency: 'warning',
        title: `🔵 Send Invoice & Collect (${totalAmount})`,
        message: `Work completed for ${job.clientName}. Send tax invoice to finalize payment.`,
        suggestedActionLabel: 'Generate Invoice & Bill',
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

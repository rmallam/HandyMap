import React, { useState } from 'react';
import { Job, ReminderItem, ReminderType, HandymanProfile } from '../../types';
import {
  buildSmsLink,
  buildWhatsAppLink,
  buildLiveNavigationUrl,
  formatCurrency
} from '../../utils/helpers';
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission
} from '../../services/reminderEngine';
import {
  X,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  FileText,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Check,
  ChevronRight
} from 'lucide-react';

interface RemindersDrawerProps {
  isOpen: boolean;
  reminders: ReminderItem[];
  profile: HandymanProfile;
  onClose: () => void;
  onOpenJob: (job: Job) => void;
  onSnoozeReminder: (reminderId: string) => void;
  onClearAllSnoozed: () => void;
}

export const RemindersDrawer: React.FC<RemindersDrawerProps> = ({
  isOpen,
  reminders,
  profile,
  onClose,
  onOpenJob,
  onSnoozeReminder,
  onClearAllSnoozed
}) => {
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<'all' | ReminderType>('all');
  const [browserPerm, setBrowserPerm] = useState<string>(getBrowserNotificationPermission());

  const activeReminders = reminders.filter(r => !r.isSnoozed);
  const snoozedReminders = reminders.filter(r => r.isSnoozed);

  const displayedReminders = reminders.filter(r => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const handleRequestPush = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPerm(granted ? 'granted' : 'denied');
  };

  const getUrgencyStyles = (urgency: ReminderItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return {
          cardBg: 'bg-red-50/70 border-red-200/90 hover:border-red-300',
          badgeBg: 'bg-red-600 text-white',
          borderLeft: 'border-l-4 border-l-red-600'
        };
      case 'warning':
        return {
          cardBg: 'bg-amber-50/60 border-amber-200/90 hover:border-amber-300',
          badgeBg: 'bg-amber-500 text-white',
          borderLeft: 'border-l-4 border-l-amber-500'
        };
      case 'info':
      default:
        return {
          cardBg: 'bg-blue-50/50 border-blue-200/80 hover:border-blue-300',
          badgeBg: 'bg-blue-600 text-white',
          borderLeft: 'border-l-4 border-l-blue-600'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200 text-slate-900 pb-[env(safe-area-inset-bottom,0px)] overflow-hidden">
        
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm relative">
              <BellRing className="w-5 h-5 stroke-[2.3] animate-pulse" />
              {activeReminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white ring-1 ring-red-400"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Reminders & Follow-Ups
                </h2>
                <span className="text-xs font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {activeReminders.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated alerts for pending quotes, follow-ups & billing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Browser Push Notification Banner */}
        {isBrowserNotificationSupported() && browserPerm !== 'granted' && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-blue-900">
              <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Enable native alerts for urgent job inquiries?</span>
            </div>
            <button
              onClick={handleRequestPush}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 shadow-sm transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/70 shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({reminders.length})
          </button>

          <button
            onClick={() => setFilterType('delayed_quote_visit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'delayed_quote_visit'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🟠 Quotes ({reminders.filter(r => r.type === 'delayed_quote_visit').length})
          </button>

          <button
            onClick={() => setFilterType('quote_followup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'quote_followup'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🟣 Follow-Ups ({reminders.filter(r => r.type === 'quote_followup').length})
          </button>

          <button
            onClick={() => setFilterType('upcoming_appointment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'upcoming_appointment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ⏰ Today's Visits ({reminders.filter(r => r.type === 'upcoming_appointment').length})
          </button>

          <button
            onClick={() => setFilterType('uninvoiced_completion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterType === 'uninvoiced_completion'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🔵 Billing ({reminders.filter(r => r.type === 'uninvoiced_completion').length})
          </button>
        </div>

        {/* Reminders List Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {displayedReminders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                No pending follow-ups or overdue quotes matching this filter.
              </p>
            </div>
          ) : (
            displayedReminders.map(reminder => {
              const styles = getUrgencyStyles(reminder.urgency);
              const job = reminder.job;
              const isSnoozed = reminder.isSnoozed;

              return (
                <div
                  key={reminder.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm transition flex flex-col gap-3 relative ${styles.cardBg} ${styles.borderLeft} ${
                    isSnoozed ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${styles.badgeBg}`}>
                        {reminder.urgency}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {reminder.dueText}
                      </span>
                    </div>

                    <button
                      onClick={() => onSnoozeReminder(reminder.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm transition"
                      title={isSnoozed ? 'Un-snooze' : 'Dismiss / Snooze'}
                    >
                      {isSnoozed ? 'Snoozed' : 'Dismiss'}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {reminder.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {reminder.message}
                    </p>
                  </div>

                  {/* Client & Address Info */}
                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{job.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{job.address}</p>
                    </div>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {job.category}
                    </span>
                  </div>

                  {/* Suggested Draft Text Preview */}
                  {reminder.actionDraftText && (
                    <div className="bg-white/70 rounded-xl p-2.5 border border-slate-200/60 text-[11px] text-slate-600 italic">
                      "{reminder.actionDraftText}"
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {reminder.actionDraftText && (
                      <>
                        <a
                          href={buildSmsLink(job.clientPhone, reminder.actionDraftText)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                          title="Send Pre-Drafted SMS"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>SMS</span>
                        </a>

                        <a
                          href={buildWhatsAppLink(job.clientPhone, reminder.actionDraftText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                          title="Send via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}

                    <a
                      href={`tel:${job.clientPhone}`}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1 border border-slate-200 shadow-sm transition active:scale-95"
                      title="Call Client"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => {
                        onOpenJob(job);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 ml-auto border border-slate-200/80 transition active:scale-95"
                    >
                      <span>View Job</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Reset */}
        {snoozedReminders.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>{snoozedReminders.length} reminder(s) dismissed</span>
            <button
              onClick={onClearAllSnoozed}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Restore All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Bell, Check, X } from 'lucide-react';
import { ReminderAlert } from '../types/planner';
import { formatTime12h } from '../utils/scheduler';

interface ReminderToastStackProps {
  alerts: ReminderAlert[];
  onDismiss: (alertId: string) => void;
  onCompleteFromAlert: (alert: ReminderAlert) => void;
}

export const ReminderToastStack: React.FC<ReminderToastStackProps> = ({
  alerts,
  onDismiss,
  onCompleteFromAlert,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)]"
      aria-live="polite"
      aria-label="Scheduled reminders"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 ring-1 ring-slate-900/5 dark:ring-white/10 bg-white dark:bg-slate-900 shadow-2xl p-4 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)] dark:text-[var(--accent)] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                Reminder · {formatTime12h(alert.slotTime)}
                {alert.slotLabel ? ` · ${alert.slotLabel}` : ''}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {alert.taskTitle}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCompleteFromAlert(alert)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-medium hover:bg-[var(--accent-hover)] cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3 h-3" aria-hidden="true" />
                  <span>Mark Done</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(alert.id)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            aria-label={`Dismiss reminder for ${alert.taskTitle}`}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};

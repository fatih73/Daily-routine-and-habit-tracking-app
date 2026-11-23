import React from 'react';
import {
  Bell,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Paperclip,
  Plus,
} from 'lucide-react';
import { TaskItem } from '../types/planner';
import {
  addDays,
  formatDateKey,
  formatDisplayDate,
  formatTime12h,
  getFrequencySummary,
  getPeriodQuotaProgress,
  getTaskDayProgress,
  getWeekDateKeys,
  isTaskScheduledForDate,
  parseDateKey,
} from '../utils/scheduler';

interface TodayViewProps {
  tasks: TaskItem[];
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  inspectedTaskId: string | null;
  onInspectTask: (taskId: string) => void;
  onToggleSlot: (taskId: string, dateKey: string, slotId: string) => void;
  onToggleWholeTask: (taskId: string, dateKey: string) => void;
  onOpenNewTask: (presetDate?: string) => void;
  onUiClick?: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  selectedDateKey,
  onSelectDateKey,
  inspectedTaskId,
  onInspectTask,
  onToggleSlot,
  onToggleWholeTask,
  onOpenNewTask,
  onUiClick,
}) => {
  const todayKey = formatDateKey(new Date());
  const weekKeys = getWeekDateKeys(selectedDateKey);

  const scheduledForDate = tasks.filter((t) =>
    isTaskScheduledForDate(t, selectedDateKey)
  );

  const primaryScheduled = scheduledForDate.filter(
    (t) => t.frequency !== 'weekly_target' && t.frequency !== 'monthly_target'
  );
  const flexibleTemplates = scheduledForDate.filter(
    (t) => t.frequency === 'weekly_target' || t.frequency === 'monthly_target'
  );

  let totalSlots = 0;
  let completedSlots = 0;
  for (const t of primaryScheduled) {
    const p = getTaskDayProgress(t, selectedDateKey);
    totalSlots += p.totalCount;
    completedSlots += p.doneCount;
  }

  const completedTasksCount = primaryScheduled.filter(
    (t) => getTaskDayProgress(t, selectedDateKey).isComplete
  ).length;

  const upcomingDatedPlans = tasks.filter(
    (t) =>
      !t.archived &&
      t.frequency === 'specific_date' &&
      t.specificDate &&
      t.specificDate >= todayKey
  ).length;

  const activeQuotas = tasks.filter(
    (t) =>
      !t.archived &&
      (t.frequency === 'weekly_target' || t.frequency === 'monthly_target')
  );
  const metQuotas = activeQuotas.filter(
    (t) => getPeriodQuotaProgress(t, selectedDateKey)?.isQuotaMet
  ).length;

  const renderTaskRow = (task: TaskItem) => {
    const dayProgress = getTaskDayProgress(task, selectedDateKey);
    const quota = getPeriodQuotaProgress(task, selectedDateKey);
    const record = task.logs[selectedDateKey];
    const isSelected = inspectedTaskId === task.id;

    const totalAttachments =
      (task.attachments?.length || 0) +
      Object.values(record?.slots || {}).reduce(
        (acc, s) => acc + (s.attachments?.length || 0),
        0
      );
    const hasNotes =
      Boolean(task.generalNote.trim()) ||
      Object.values(record?.slots || {}).some((s) => Boolean(s.note?.trim()));

    return (
      <div
        key={task.id}
        data-testid={`task-row-${task.id}`}
        className={`rounded-2xl border transition-colors bg-white dark:bg-slate-900 ${
          isSelected
            ? 'border-[var(--accent)] ring-1 ring-[var(--accent-ring)]'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Top Row: Whole-task checkbox + Title + Metadata + Inspector trigger */}
        <div className="px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onToggleWholeTask(task.id, selectedDateKey)}
              aria-label={`Mark ${task.title} ${dayProgress.isComplete ? 'incomplete' : 'complete'}`}
              aria-pressed={dayProgress.isComplete}
              className={`mt-0.5 w-6 h-6 min-w-[24px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                dayProgress.isComplete
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                  : 'border-slate-300 dark:border-slate-600 hover:border-[var(--accent)] bg-white dark:bg-slate-950'
              }`}
            >
              {dayProgress.isComplete && (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  onUiClick?.();
                  onInspectTask(task.id);
                }}
                className="text-left group cursor-pointer focus-visible:outline-none"
              >
                <h3
                  className={`text-sm font-semibold transition-colors ${
                    dayProgress.isComplete
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent)]'
                  }`}
                >
                  {task.title}
                </h3>
              </button>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span>{task.category}</span>
                <span aria-hidden="true">·</span>
                <span>{getFrequencySummary(task)}</span>
                {task.slots.length > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num text-slate-700 dark:text-slate-300">
                      {dayProgress.doneCount}/{dayProgress.totalCount} done
                    </span>
                  </>
                )}
                {quota && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num text-[var(--accent-strong)] dark:text-[var(--accent)] font-medium">
                      {quota.completedSessions}/{quota.targetCount} {quota.periodLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onInspectTask(task.id);
            }}
            aria-label={`Open notes and media for ${task.title}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              isSelected
                ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Notes</span>
            {totalAttachments > 0 && (
              <span className="inline-flex items-center gap-0.5 font-mono-num text-[11px]">
                <Paperclip className="w-3 h-3" aria-hidden="true" />
                {totalAttachments}
              </span>
            )}
            {hasNotes && totalAttachments === 0 && (
              <span className="text-[11px] text-slate-400">· Saved</span>
            )}
          </button>
        </div>

        {/* Time Slots List */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/70">
          {task.slots.map((slot) => {
            const slotLog = record?.slots[slot.id];
            const isSlotDone = slotLog?.completed ?? false;
            const slotNote = slotLog?.note?.trim();
            const slotAttCount = slotLog?.attachments?.length || 0;

            return (
              <div
                key={slot.id}
                className="px-4 py-2.5 pl-12 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onToggleSlot(task.id, selectedDateKey, slot.id)}
                  aria-label={`Mark ${task.title} ${formatTime12h(slot.time)} ${slot.label || ''} ${isSlotDone ? 'incomplete' : 'complete'}`}
                  aria-pressed={isSlotDone}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer min-h-[36px]"
                >
                  <span
                    className={`w-4 h-4 min-w-[16px] rounded-sm border flex items-center justify-center transition-colors ${
                      isSlotDone
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                    }`}
                  >
                    {isSlotDone && <Check className="w-3 h-3" aria-hidden="true" />}
                  </span>

                  <span
                    className={`text-xs font-mono-num font-medium shrink-0 ${
                      isSlotDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {formatTime12h(slot.time)}
                  </span>

                  {slot.label && (
                    <span
                      className={`text-xs truncate ${
                        isSlotDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {slot.label}
                    </span>
                  )}

                  {slotNote && (
                    <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 truncate">
                      — {slotNote}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {slotAttCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 font-mono-num">
                      <Paperclip className="w-3 h-3" aria-hidden="true" />
                      {slotAttCount}
                    </span>
                  )}
                  {slot.reminderEnabled && (
                    <Bell
                      className={`w-3.5 h-3.5 ${
                        isSlotDone
                          ? 'text-slate-300 dark:text-slate-700'
                          : 'text-[var(--accent)]'
                      }`}
                      aria-label="Reminder active"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Compact Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-4 flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Completed ({selectedDateKey === todayKey ? 'Today' : formatDisplayDate(selectedDateKey)})
          </p>
          <p className="mt-1.5 text-xl font-semibold font-mono-num text-slate-900 dark:text-slate-100">
            {completedTasksCount} / {primaryScheduled.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-4 flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Time Slots Checked
          </p>
          <p className="mt-1.5 text-xl font-semibold font-mono-num text-slate-900 dark:text-slate-100">
            {completedSlots} / {totalSlots}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-4 flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Period Quotas
          </p>
          <p className="mt-1.5 text-xl font-semibold font-mono-num text-slate-900 dark:text-slate-100">
            {metQuotas} / {activeQuotas.length} met
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-4 flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Upcoming Plans
          </p>
          <p className="mt-1.5 text-xl font-semibold font-mono-num text-slate-900 dark:text-slate-100">
            {upcomingDatedPlans}
          </p>
        </div>
      </div>

      {/* Horizontal 7-Day Scroller */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onUiClick?.();
            onSelectDateKey(addDays(selectedDateKey, -7));
          }}
          aria-label="Previous week"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1">
          {weekKeys.map((key) => {
            const d = parseDateKey(key);
            const weekdayShort = d.toLocaleDateString('en-US', {
              weekday: 'short',
            });
            const dayNum = d.getDate();
            const isSelected = key === selectedDateKey;
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onUiClick?.();
                  onSelectDateKey(key);
                }}
                aria-label={`Select ${formatDisplayDate(key)}`}
                aria-current={isSelected ? 'date' : undefined}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[48px] ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                    : isToday
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11px] font-medium">{weekdayShort}</span>
                <span className="text-sm font-semibold font-mono-num mt-0.5">
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedDateKey !== todayKey && (
            <button
              type="button"
              onClick={() => {
                onUiClick?.();
                onSelectDateKey(todayKey);
              }}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onSelectDateKey(addDays(selectedDateKey, 7));
            }}
            aria-label="Next week"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scheduled Items */}
      <section className="space-y-3" aria-label="Scheduled Tasks and Habits">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Schedule for {formatDisplayDate(selectedDateKey)}
          </h2>
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onOpenNewTask(
                selectedDateKey !== todayKey ? selectedDateKey : undefined
              );
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-strong)] dark:text-[var(--accent)] hover:underline cursor-pointer whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Plan for this day</span>
          </button>
        </div>

        {primaryScheduled.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-8 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No fixed tasks scheduled for {formatDisplayDate(selectedDateKey)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add a routine, custom-day habit, or future date plan to get started.
            </p>
            <button
              type="button"
              onClick={() => {
                onUiClick?.();
                onOpenNewTask(selectedDateKey);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {primaryScheduled.map((task) => renderTaskRow(task))}
          </div>
        )}
      </section>

      {/* Flexible Period Templates */}
      {flexibleTemplates.length > 0 && (
        <section className="space-y-3 pt-2" aria-label="Flexible Period Templates">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Flexible Weekly & Monthly Quotas
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Log on any day to count toward target
            </span>
          </div>
          <div className="space-y-3">
            {flexibleTemplates.map((task) => renderTaskRow(task))}
          </div>
        </section>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
} from 'lucide-react';
import { TaskItem } from '../types/planner';
import {
  formatDateKey,
  formatDisplayDate,
  formatTime12h,
  getFrequencySummary,
  getTaskDayProgress,
  isTaskScheduledForDate,
} from '../utils/scheduler';

interface CalendarViewProps {
  tasks: TaskItem[];
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  onInspectTask: (taskId: string) => void;
  onToggleSlot: (taskId: string, dateKey: string, slotId: string) => void;
  onPlanForDate: (dateKey: string) => void;
  onUiClick?: () => void;
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  selectedDateKey,
  onSelectDateKey,
  onInspectTask,
  onToggleSlot,
  onPlanForDate,
  onUiClick,
}) => {
  const initialDate = new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  const todayKey = formatDateKey(new Date());

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-based column offset (0=Mon .. 6=Sun)
  const startOffset =
    firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i += 1) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(formatDateKey(new Date(viewYear, viewMonth, day)));
  }

  const monthTitle = firstDayOfMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    onUiClick?.();
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    onUiClick?.();
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    onUiClick?.();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDateKey(formatDateKey(now));
  };

  const agendaTasks = tasks.filter(
    (t) =>
      isTaskScheduledForDate(t, selectedDateKey) &&
      t.frequency !== 'weekly_target' &&
      t.frequency !== 'monthly_target'
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      {/* Monthly Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {monthTitle}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleJumpToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          {WEEKDAY_HEADERS.map((wd) => (
            <div
              key={wd}
              className="py-2.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {calendarCells.map((dateKey, index) => {
            if (!dateKey) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[84px] sm:min-h-[96px] bg-slate-50/40 dark:bg-slate-950/20"
                />
              );
            }

            const dayNum = Number(dateKey.split('-')[2]);
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === todayKey;

            const dayTasks = tasks.filter(
              (t) =>
                isTaskScheduledForDate(t, dateKey) &&
                t.frequency !== 'weekly_target' &&
                t.frequency !== 'monthly_target'
            );

            const datedPlans = dayTasks.filter(
              (t) => t.frequency === 'specific_date'
            );

            let totalDaySlots = 0;
            let doneDaySlots = 0;
            for (const dt of dayTasks) {
              const p = getTaskDayProgress(dt, dateKey);
              totalDaySlots += p.totalCount;
              doneDaySlots += p.doneCount;
            }

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  onUiClick?.();
                  onSelectDateKey(dateKey);
                }}
                aria-label={`Select ${formatDisplayDate(dateKey)}`}
                aria-current={isSelected ? 'date' : undefined}
                className={`min-h-[84px] sm:min-h-[96px] p-2 text-left flex flex-col justify-between transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  isSelected
                    ? 'bg-[var(--accent-soft)]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono-num font-semibold ${
                      isToday
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : isSelected
                        ? 'text-[var(--accent-strong)] dark:text-[var(--accent)]'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {totalDaySlots > 0 && (
                    <span className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                      {doneDaySlots}/{totalDaySlots}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1.5 w-full overflow-hidden">
                  {datedPlans.slice(0, 2).map((plan) => (
                    <p
                      key={plan.id}
                      className="text-[11px] font-medium truncate text-[var(--accent-strong)] dark:text-[var(--accent)]"
                    >
                      {plan.title}
                    </p>
                  ))}
                  {datedPlans.length === 0 && dayTasks.length > 0 && (
                    <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all"
                        style={{
                          width: `${
                            totalDaySlots > 0
                              ? Math.round((doneDaySlots / totalDaySlots) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Agenda & Future Plan Trigger */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selected Date
            </p>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {formatDisplayDate(selectedDateKey)}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onPlanForDate(selectedDateKey);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Plan for Date</span>
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[540px] overflow-y-auto">
          {agendaTasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No scheduled items on this day
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use "Plan for Date" to add an event or task with reminder alerts.
              </p>
            </div>
          ) : (
            agendaTasks.map((task) => {
              const progress = getTaskDayProgress(task, selectedDateKey);
              const record = task.logs[selectedDateKey];

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          progress.isComplete
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.category} · {getFrequencySummary(task)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUiClick?.();
                        onInspectTask(task.id);
                      }}
                      aria-label={`Inspect ${task.title}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {task.slots.map((slot) => {
                      const done = record?.slots[slot.id]?.completed ?? false;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() =>
                            onToggleSlot(task.id, selectedDateKey, slot.id)
                          }
                          aria-label={`Toggle ${task.title} at ${formatTime12h(slot.time)}`}
                          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                                done
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {done && <Check className="w-3 h-3" aria-hidden="true" />}
                            </span>
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                            <span
                              className={`text-xs font-mono-num ${
                                done
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {formatTime12h(slot.time)}
                            </span>
                            {slot.label && (
                              <span
                                className={`text-xs truncate ${
                                  done
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {slot.label}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

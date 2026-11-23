import React, { useState } from 'react';
import { Bell, Check, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FrequencyType, TaskItem } from '../types/planner';
import {
  formatDateKey,
  formatTime12h,
  getFrequencySummary,
  getPeriodQuotaProgress,
  getTaskDayProgress,
} from '../utils/scheduler';

interface RoutinesViewProps {
  tasks: TaskItem[];
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onInspectTask: (taskId: string) => void;
  onToggleWholeTask: (taskId: string, dateKey: string) => void;
  onOpenNewTask: () => void;
  onUiClick?: () => void;
}

type FilterOption = 'all' | FrequencyType | 'quotas';

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onInspectTask,
  onToggleWholeTask,
  onOpenNewTask,
  onUiClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayKey = formatDateKey(new Date());

  const filteredTasks = tasks.filter((task) => {
    if (task.archived) return false;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      task.generalNote.toLowerCase().includes(searchQuery.trim().toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'quotas') {
      return (
        task.frequency === 'weekly_target' || task.frequency === 'monthly_target'
      );
    }
    return task.frequency === filter;
  });

  const filterButtons: { id: FilterOption; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'daily', label: 'Daily' },
    { id: 'custom_days', label: 'Custom Days' },
    { id: 'quotas', label: 'Weekly & Monthly' },
    { id: 'specific_date', label: 'Dated Plans' },
  ];

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, routines, notes..."
            aria-label="Search routines and templates"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                onUiClick?.();
                setFilter(btn.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === btn.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-10 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No routines or tasks match your filter
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Adjust your search or create a new recurring routine.
          </p>
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onOpenNewTask();
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Routine</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const quota = getPeriodQuotaProgress(task, todayKey);
            const todayProgress = getTaskDayProgress(task, todayKey);

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.kind === 'habit' ? 'Habit' : 'Task'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUiClick?.();
                          onInspectTask(task.id);
                        }}
                        className="mt-1 text-left cursor-pointer group"
                      >
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent)] transition-colors">
                          {task.title}
                        </h3>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onUiClick?.();
                          onEditTask(task);
                        }}
                        aria-label={`Edit ${task.title}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {confirmDeleteId !== task.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            onUiClick?.();
                            setConfirmDeleteId(task.id);
                          }}
                          aria-label={`Delete ${task.title}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              onDeleteTask(task.id);
                            }}
                            className="px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {getFrequencySummary(task)}
                  </p>

                  {/* Slot Times Summary */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {task.slots.map((slot) => (
                      <span
                        key={slot.id}
                        className="inline-flex items-center gap-1 font-mono-num"
                      >
                        {slot.reminderEnabled && (
                          <Bell
                            className="w-3 h-3 text-[var(--accent)]"
                            aria-hidden="true"
                          />
                        )}
                        <span>{formatTime12h(slot.time)}</span>
                      </span>
                    ))}
                  </div>

                  {task.generalNote && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.generalNote}
                    </p>
                  )}
                </div>

                {/* Footer Quota or Today Toggle */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  {quota ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          Target {quota.periodLabel}
                        </span>
                        <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                          {quota.completedSessions} / {quota.targetCount}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (quota.completedSessions / quota.targetCount) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                      Today: {todayProgress.doneCount}/{todayProgress.totalCount}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleWholeTask(task.id, todayKey)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      todayProgress.isComplete
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {todayProgress.isComplete ? 'Logged Today' : 'Log Today'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

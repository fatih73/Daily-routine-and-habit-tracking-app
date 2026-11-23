import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { MediaAttachment, TaskItem } from '../types/planner';
import {
  addSlotAttachment,
  formatDisplayDate,
  formatTime12h,
  getFrequencySummary,
  getPeriodQuotaProgress,
  getTaskDayProgress,
  removeSlotAttachment,
  updateSlotNote,
} from '../utils/scheduler';
import { MediaAttachments } from './MediaAttachments';

interface TaskInspectorProps {
  task: TaskItem | null;
  selectedDateKey: string;
  onUpdateTask: (updated: TaskItem) => void;
  onToggleSlot: (taskId: string, dateKey: string, slotId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onCloseMobile?: () => void;
  onUiClick?: () => void;
}

export const TaskInspector: React.FC<TaskInspectorProps> = ({
  task,
  selectedDateKey,
  onUpdateTask,
  onToggleSlot,
  onEditTask,
  onDeleteTask,
  onCloseMobile,
  onUiClick,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Select a task or habit to inspect
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          View and edit general notes, time-slot reflections, and attached media for{' '}
          {formatDisplayDate(selectedDateKey)}.
        </p>
      </div>
    );
  }

  const dayRecord = task.logs[selectedDateKey];
  const dayProgress = getTaskDayProgress(task, selectedDateKey);
  const quota = getPeriodQuotaProgress(task, selectedDateKey);

  const handleGeneralNoteChange = (value: string) => {
    onUpdateTask({
      ...task,
      generalNote: value,
    });
  };

  const handleAddGeneralAttachment = (att: MediaAttachment) => {
    onUpdateTask({
      ...task,
      attachments: [...(task.attachments || []), att],
    });
  };

  const handleRemoveGeneralAttachment = (attId: string) => {
    onUpdateTask({
      ...task,
      attachments: (task.attachments || []).filter((a) => a.id !== attId),
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col max-h-[calc(100vh-112px)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{task.category}</span>
            <span aria-hidden="true">·</span>
            <span>{getFrequencySummary(task)}</span>
          </div>
          <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onEditTask(task);
            }}
            aria-label={`Edit ${task.title}`}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" aria-hidden="true" />
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                onUiClick?.();
                setConfirmDelete(true);
              }}
              aria-label={`Delete ${task.title}`}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDeleteTask(task.id);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 cursor-pointer whitespace-nowrap"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close inspector"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Daily & Period Progress Summary */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Progress for {formatDisplayDate(selectedDateKey)}
          </span>
          <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
            {dayProgress.doneCount} / {dayProgress.totalCount} slots
          </span>
        </div>

        {quota && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Template quota ({quota.periodLabel})
              </span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                {quota.completedSessions} / {quota.targetCount}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((quota.completedSessions / quota.targetCount) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* General Task Notes & Media */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label
            htmlFor={`inspector-general-note-${task.id}`}
            className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            General Notes
          </label>
          <textarea
            id={`inspector-general-note-${task.id}`}
            rows={3}
            value={task.generalNote}
            onChange={(e) => handleGeneralNoteChange(e.target.value)}
            placeholder="Add overarching instructions, links, or guidelines..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 px-3 py-2 text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
          />

          <MediaAttachments
            attachments={task.attachments || []}
            label="Task Media & Files"
            compact
            onAdd={handleAddGeneralAttachment}
            onRemove={handleRemoveGeneralAttachment}
          />
        </div>

        {/* Per-Slot Notes & Per-Slot Media for Selected Date */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Time Slot Logs ({formatDisplayDate(selectedDateKey)})
            </h4>
            <span className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
              {task.slots.length} {task.slots.length === 1 ? 'slot' : 'slots'}
            </span>
          </div>

          <div className="space-y-4">
            {task.slots.map((slot, idx) => {
              const slotLog = dayRecord?.slots[slot.id];
              const isDone = slotLog?.completed ?? false;
              const slotNote = slotLog?.note ?? '';
              const slotAttachments = slotLog?.attachments ?? [];

              return (
                <div
                  key={slot.id}
                  className="pt-3 border-t border-slate-100 dark:border-slate-800/70 first:border-t-0 first:pt-0 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleSlot(task.id, selectedDateKey, slot.id)}
                      aria-label={`Toggle ${task.title} ${formatTime12h(slot.time)} slot`}
                      className="flex items-center gap-2.5 text-left group cursor-pointer min-h-[36px]"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isDone
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-[var(--accent)]'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </span>
                      <span
                        className={`text-xs font-mono-num font-medium ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatTime12h(slot.time)}
                      </span>
                      {slot.label && (
                        <span
                          className={`text-xs ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {slot.label}
                        </span>
                      )}
                    </button>

                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0"
                      title={
                        slot.reminderEnabled ? 'Reminder enabled' : 'Reminder muted'
                      }
                    >
                      {slot.reminderEnabled ? (
                        <Bell className="w-3 h-3 text-[var(--accent)]" aria-hidden="true" />
                      ) : (
                        <BellOff className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>{slot.reminderEnabled ? 'Alert' : 'Muted'}</span>
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    aria-label={`Note for ${formatTime12h(slot.time)} slot ${idx + 1}`}
                    value={slotNote}
                    onChange={(e) =>
                      onUpdateTask(
                        updateSlotNote(task, selectedDateKey, slot.id, e.target.value)
                      )
                    }
                    placeholder={`Notes for ${formatTime12h(slot.time)} session...`}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
                  />

                  <MediaAttachments
                    attachments={slotAttachments}
                    label={`Slot ${idx + 1} Media`}
                    compact
                    onAdd={(att) =>
                      onUpdateTask(
                        addSlotAttachment(task, selectedDateKey, slot.id, att)
                      )
                    }
                    onRemove={(attId) =>
                      onUpdateTask(
                        removeSlotAttachment(task, selectedDateKey, slot.id, attId)
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

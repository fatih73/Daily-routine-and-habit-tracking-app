import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Minus, Plus, X } from 'lucide-react';
import {
  FrequencyType,
  MediaAttachment,
  TaskItem,
  TaskKind,
  TimeSlot,
} from '../types/planner';
import { formatDateKey, normalizeSlotsForCount } from '../utils/scheduler';
import { MediaAttachments } from './MediaAttachments';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskItem) => void;
  initialTask?: TaskItem | null;
  presetDate?: string;
  onUiClick?: () => void;
}

const CATEGORIES = [
  'Care & Health',
  'Focus',
  'Movement',
  'Home',
  'Admin',
  'Personal',
];

const WEEKDAYS = [
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
  { day: 0, short: 'Sun' },
];

const FREQUENCY_OPTIONS: { id: FrequencyType; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'custom_days', label: 'Custom Days' },
  { id: 'weekly_target', label: 'Weekly Quota' },
  { id: 'monthly_target', label: 'Monthly Quota' },
  { id: 'specific_date', label: 'Specific Date' },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  presetDate,
  onUiClick,
}) => {
  const todayKey = formatDateKey(new Date());

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('habit');
  const [category, setCategory] = useState('Care & Health');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [targetCount, setTargetCount] = useState<number>(4);
  const [specificDate, setSpecificDate] = useState<string>(todayKey);
  const [dailyRepetitions, setDailyRepetitions] = useState<number>(1);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [generalNote, setGeneralNote] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    if (initialTask) {
      setTitle(initialTask.title);
      setKind(initialTask.kind);
      setCategory(initialTask.category);
      setFrequency(initialTask.frequency);
      setCustomDays(
        initialTask.customDays.length > 0 ? initialTask.customDays : [1, 3, 5]
      );
      setTargetCount(initialTask.targetCount || 4);
      setSpecificDate(initialTask.specificDate || presetDate || todayKey);
      const count = Math.max(1, initialTask.slots.length);
      setDailyRepetitions(count);
      setSlots(initialTask.slots);
      setGeneralNote(initialTask.generalNote);
      setAttachments(initialTask.attachments || []);
    } else {
      setTitle('');
      setKind(presetDate ? 'task' : 'habit');
      setCategory('Care & Health');
      setFrequency(presetDate ? 'specific_date' : 'daily');
      setCustomDays([1, 3, 5]);
      setTargetCount(4);
      setSpecificDate(presetDate || todayKey);
      setDailyRepetitions(1);
      setSlots(normalizeSlotsForCount([], 1));
      setGeneralNote('');
      setAttachments([]);
    }
  }, [isOpen, initialTask, presetDate, todayKey]);

  if (!isOpen) return null;

  const handleRepetitionsChange = (nextCount: number) => {
    onUiClick?.();
    const clamped = Math.min(12, Math.max(1, nextCount));
    setDailyRepetitions(clamped);
    setSlots((prev) => normalizeSlotsForCount(prev, clamped));
  };

  const handleToggleDay = (dayNum: number) => {
    onUiClick?.();
    setCustomDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleSlotChange = (
    slotId: string,
    patch: Partial<TimeSlot>
  ) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setValidationError('Please enter a name for this task or habit.');
      return;
    }
    if (frequency === 'custom_days' && customDays.length === 0) {
      setValidationError('Select at least one day of the week.');
      return;
    }
    if (frequency === 'specific_date' && !specificDate) {
      setValidationError('Choose a target calendar date.');
      return;
    }

    const nowIso = new Date().toISOString();
    const savedTask: TaskItem = {
      id: initialTask?.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      kind,
      category,
      frequency,
      customDays: frequency === 'custom_days' ? [...customDays].sort((a, b) => a - b) : [],
      targetCount:
        frequency === 'weekly_target' || frequency === 'monthly_target'
          ? Math.max(1, targetCount)
          : 1,
      specificDate: frequency === 'specific_date' ? specificDate : undefined,
      startDate:
        frequency === 'specific_date'
          ? specificDate
          : initialTask?.startDate || todayKey,
      dailyRepetitions: slots.length,
      slots,
      generalNote: generalNote.trim(),
      attachments,
      logs: initialTask?.logs || {},
      createdAt: initialTask?.createdAt || nowIso,
      archived: initialTask?.archived || false,
    };

    onSave(savedTask);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2
            id="task-form-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {initialTask ? `Edit "${initialTask.title}"` : 'Create Task or Habit'}
          </h2>
          <button
            type="button"
            onClick={() => {
              onUiClick?.();
              onClose();
            }}
            aria-label="Close task editor"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {validationError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {validationError}
            </div>
          )}

          {/* Name & Kind */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="task-title-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Task or Habit Name
              </label>
              <input
                id="task-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g., Sonda, Evening Reading, Hydration"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Entry Type
              </span>
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onUiClick?.();
                    setKind('habit');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    kind === 'habit'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Habit / Routine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUiClick?.();
                    setKind('task');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    kind === 'task'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Task / Plan
                </button>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="task-category-select"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onUiClick?.();
                    setCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    category === cat
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency & Schedule */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Frequency & Calendar Rule
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onUiClick?.();
                      setFrequency(opt.id);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      frequency === opt.id
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {frequency === 'custom_days' && (
              <div className="space-y-1.5">
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Select active days of the week
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((wd) => {
                    const active = customDays.includes(wd.day);
                    return (
                      <button
                        key={wd.day}
                        type="button"
                        onClick={() => handleToggleDay(wd.day)}
                        aria-pressed={active}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {wd.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(frequency === 'weekly_target' || frequency === 'monthly_target') && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/70 dark:bg-slate-950/40">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Flexible Target Count
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete on any days{' '}
                    {frequency === 'weekly_target' ? 'within each week' : 'within each month'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onUiClick?.();
                      setTargetCount((c) => Math.max(1, c - 1));
                    }}
                    aria-label="Decrease target count"
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-16 text-center text-xs font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {targetCount}x/{frequency === 'weekly_target' ? 'wk' : 'mo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onUiClick?.();
                      setTargetCount((c) =>
                        Math.min(frequency === 'weekly_target' ? 7 : 31, c + 1)
                      );
                    }}
                    aria-label="Increase target count"
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {frequency === 'specific_date' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="specific-date-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Scheduled Date
                </label>
                <input
                  id="specific-date-input"
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
              </div>
            )}
          </div>

          {/* Multiple Daily Repetitions & Individual Time Slots */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Daily Repetitions & Time-Based Reminders
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set how many times per day (e.g., 3x) with separate reminder times
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRepetitionsChange(dailyRepetitions - 1)}
                  aria-label="Decrease daily repetitions"
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="w-14 text-center text-sm font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {dailyRepetitions}x
                </span>
                <button
                  type="button"
                  onClick={() => handleRepetitionsChange(dailyRepetitions + 1)}
                  aria-label="Increase daily repetitions"
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/30"
                >
                  <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400 w-7 shrink-0">
                    #{index + 1}
                  </span>
                  <input
                    type="time"
                    value={slot.time}
                    aria-label={`Time for slot ${index + 1}`}
                    onChange={(e) =>
                      handleSlotChange(slot.id, { time: e.target.value })
                    }
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                  />
                  <input
                    type="text"
                    value={slot.label || ''}
                    aria-label={`Label for slot ${index + 1}`}
                    onChange={(e) =>
                      handleSlotChange(slot.id, { label: e.target.value })
                    }
                    placeholder="Optional label (e.g., Morning)"
                    className="flex-1 min-w-[130px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUiClick?.();
                      handleSlotChange(slot.id, {
                        reminderEnabled: !slot.reminderEnabled,
                      });
                    }}
                    aria-label={`Toggle reminder for slot ${index + 1}`}
                    aria-pressed={slot.reminderEnabled}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      slot.reminderEnabled
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {slot.reminderEnabled ? (
                      <>
                        <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Remind</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Muted</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* General Notes & Media */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="task-general-note"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                General Notes
              </label>
              <textarea
                id="task-general-note"
                rows={3}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="Instructions, checklist guidelines, or context..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] resize-y"
              />
            </div>

            <MediaAttachments
              attachments={attachments}
              label="General Media & Files"
              onAdd={(att) => setAttachments((prev) => [...prev, att])}
              onRemove={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onUiClick?.();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {initialTask ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

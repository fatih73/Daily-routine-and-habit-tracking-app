import {
  MediaAttachment,
  ReminderAlert,
  TaskCompletionRecord,
  TaskItem,
  TimeSlot,
} from '../types/planner';

const DEFAULT_SLOT_TIMES = [
  '09:00',
  '14:00',
  '20:00',
  '12:00',
  '17:00',
  '21:30',
  '07:30',
  '10:30',
  '15:30',
  '18:30',
  '22:00',
  '08:00',
];

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

export function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function getWeekDateKeys(dateKey: string): string[] {
  const date = parseDateKey(dateKey);
  const dayOfWeek = date.getDay(); // 0=Sun..6=Sat
  // Monday-start week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  const keys: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.push(formatDateKey(d));
  }
  return keys;
}

export function getMonthDateKeys(year: number, monthIndex: number): string[] {
  const keys: string[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    keys.push(formatDateKey(new Date(year, monthIndex, day)));
  }
  return keys;
}

export function isTaskScheduledForDate(task: TaskItem, dateKey: string): boolean {
  if (task.archived) return false;
  if (task.frequency === 'specific_date') {
    return task.specificDate === dateKey;
  }
  if (dateKey < task.startDate) {
    return false;
  }
  const date = parseDateKey(dateKey);
  const dayOfWeek = date.getDay();

  switch (task.frequency) {
    case 'daily':
      return true;
    case 'custom_days':
      return task.customDays.includes(dayOfWeek);
    case 'weekly_target':
    case 'monthly_target':
      // Flexible templates can be logged on any day within the period
      return true;
    default:
      return false;
  }
}

export function getTaskDayProgress(
  task: TaskItem,
  dateKey: string
): { doneCount: number; totalCount: number; isComplete: boolean } {
  const totalCount = Math.max(1, task.slots.length);
  const record = task.logs[dateKey];
  if (!record) {
    return { doneCount: 0, totalCount, isComplete: false };
  }
  let doneCount = 0;
  for (const slot of task.slots) {
    if (record.slots[slot.id]?.completed) {
      doneCount += 1;
    }
  }
  return {
    doneCount,
    totalCount,
    isComplete: doneCount >= totalCount,
  };
}

export interface PeriodQuotaProgress {
  completedSessions: number;
  targetCount: number;
  periodLabel: string;
  isQuotaMet: boolean;
}

export function getPeriodQuotaProgress(
  task: TaskItem,
  dateKey: string
): PeriodQuotaProgress | null {
  if (task.frequency === 'weekly_target') {
    const weekKeys = getWeekDateKeys(dateKey);
    let completedSessions = 0;
    for (const key of weekKeys) {
      const progress = getTaskDayProgress(task, key);
      if (progress.isComplete) {
        completedSessions += 1;
      }
    }
    const target = Math.max(1, task.targetCount || 1);
    return {
      completedSessions,
      targetCount: target,
      periodLabel: 'this week',
      isQuotaMet: completedSessions >= target,
    };
  }

  if (task.frequency === 'monthly_target') {
    const date = parseDateKey(dateKey);
    const monthKeys = getMonthDateKeys(date.getFullYear(), date.getMonth());
    let completedSessions = 0;
    for (const key of monthKeys) {
      const progress = getTaskDayProgress(task, key);
      if (progress.isComplete) {
        completedSessions += 1;
      }
    }
    const target = Math.max(1, task.targetCount || 1);
    return {
      completedSessions,
      targetCount: target,
      periodLabel: 'this month',
      isQuotaMet: completedSessions >= target,
    };
  }

  return null;
}

function ensureRecord(task: TaskItem, dateKey: string): TaskCompletionRecord {
  const existing = task.logs[dateKey];
  if (existing) {
    return {
      dayNote: existing.dayNote,
      slots: { ...existing.slots },
    };
  }
  return { slots: {} };
}

export function toggleSlotCompletion(
  task: TaskItem,
  dateKey: string,
  slotId: string,
  nowIso: string = new Date().toISOString()
): TaskItem {
  const record = ensureRecord(task, dateKey);
  const currentEntry = record.slots[slotId] ?? { completed: false };
  const nextCompleted = !currentEntry.completed;

  record.slots[slotId] = {
    ...currentEntry,
    completed: nextCompleted,
    completedAt: nextCompleted ? nowIso : undefined,
  };

  return {
    ...task,
    logs: {
      ...task.logs,
      [dateKey]: record,
    },
  };
}

export function toggleWholeTaskCompletion(
  task: TaskItem,
  dateKey: string,
  nowIso: string = new Date().toISOString()
): TaskItem {
  const { isComplete } = getTaskDayProgress(task, dateKey);
  const targetState = !isComplete;
  const record = ensureRecord(task, dateKey);

  for (const slot of task.slots) {
    const existing = record.slots[slot.id] ?? { completed: false };
    record.slots[slot.id] = {
      ...existing,
      completed: targetState,
      completedAt: targetState ? nowIso : undefined,
    };
  }

  return {
    ...task,
    logs: {
      ...task.logs,
      [dateKey]: record,
    },
  };
}

export function updateSlotNote(
  task: TaskItem,
  dateKey: string,
  slotId: string,
  note: string
): TaskItem {
  const record = ensureRecord(task, dateKey);
  const existing = record.slots[slotId] ?? { completed: false };
  record.slots[slotId] = {
    ...existing,
    note,
  };

  return {
    ...task,
    logs: {
      ...task.logs,
      [dateKey]: record,
    },
  };
}

export function addSlotAttachment(
  task: TaskItem,
  dateKey: string,
  slotId: string,
  attachment: MediaAttachment
): TaskItem {
  const record = ensureRecord(task, dateKey);
  const existing = record.slots[slotId] ?? { completed: false };
  const currentAttachments = existing.attachments ?? [];

  record.slots[slotId] = {
    ...existing,
    attachments: [...currentAttachments, attachment],
  };

  return {
    ...task,
    logs: {
      ...task.logs,
      [dateKey]: record,
    },
  };
}

export function removeSlotAttachment(
  task: TaskItem,
  dateKey: string,
  slotId: string,
  attachmentId: string
): TaskItem {
  const record = ensureRecord(task, dateKey);
  const existing = record.slots[slotId] ?? { completed: false };
  const currentAttachments = existing.attachments ?? [];

  record.slots[slotId] = {
    ...existing,
    attachments: currentAttachments.filter((a) => a.id !== attachmentId),
  };

  return {
    ...task,
    logs: {
      ...task.logs,
      [dateKey]: record,
    },
  };
}

export function normalizeSlotsForCount(
  existingSlots: TimeSlot[],
  count: number
): TimeSlot[] {
  const safeCount = Math.min(12, Math.max(1, Math.floor(count)));
  const result: TimeSlot[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    if (existingSlots[i]) {
      result.push(existingSlots[i]);
    } else {
      const defaultTime = DEFAULT_SLOT_TIMES[i % DEFAULT_SLOT_TIMES.length];
      result.push({
        id: `slot-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
        time: defaultTime,
        label: safeCount > 1 ? `Session ${i + 1}` : '',
        reminderEnabled: true,
      });
    }
  }

  return result;
}

export function findDueReminders(
  tasks: TaskItem[],
  dateKey: string,
  currentHHMM: string,
  alreadyTriggeredIds: Set<string>
): ReminderAlert[] {
  const alerts: ReminderAlert[] = [];

  for (const task of tasks) {
    if (!isTaskScheduledForDate(task, dateKey)) continue;
    const record = task.logs[dateKey];

    for (const slot of task.slots) {
      if (!slot.reminderEnabled) continue;
      if (slot.time !== currentHHMM) continue;
      const isDone = record?.slots[slot.id]?.completed ?? false;
      if (isDone) continue;

      const alertId = `${dateKey}__${task.id}__${slot.id}__${slot.time}`;
      if (alreadyTriggeredIds.has(alertId)) continue;

      alerts.push({
        id: alertId,
        taskId: task.id,
        taskTitle: task.title,
        slotId: slot.id,
        slotTime: slot.time,
        slotLabel: slot.label,
        dateStr: dateKey,
        triggeredAt: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getFrequencySummary(task: TaskItem): string {
  const repLabel =
    task.slots.length > 1 ? ` · ${task.slots.length}x/day` : '';

  switch (task.frequency) {
    case 'daily':
      return `Daily${repLabel}`;
    case 'custom_days': {
      const sorted = [...task.customDays].sort((a, b) => a - b);
      const names =
        sorted.length > 0
          ? sorted.map((d) => DAY_NAMES_SHORT[d]).join(', ')
          : 'No days';
      return `${names}${repLabel}`;
    }
    case 'weekly_target':
      return `${task.targetCount}x per week${repLabel}`;
    case 'monthly_target':
      return `${task.targetCount}x per month${repLabel}`;
    case 'specific_date':
      return task.specificDate
        ? `Scheduled ${formatDisplayDate(task.specificDate)}`
        : 'Scheduled date';
    default:
      return 'Custom';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

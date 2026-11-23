export type ThemePolarity = 'light' | 'dark';

export type AccentThemeId =
  | 'indigo'
  | 'sage'
  | 'ochre'
  | 'cobalt'
  | 'rose'
  | 'graphite';

export type FrequencyType =
  | 'daily'
  | 'custom_days'
  | 'weekly_target'
  | 'monthly_target'
  | 'specific_date';

export type TaskKind = 'habit' | 'task';

export interface MediaAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  time: string; // HH:MM (24h)
  label?: string;
  reminderEnabled: boolean;
}

export interface SlotLogEntry {
  completed: boolean;
  completedAt?: string;
  note?: string;
  attachments?: MediaAttachment[];
}

export interface TaskCompletionRecord {
  slots: Record<string, SlotLogEntry>;
  dayNote?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  kind: TaskKind;
  category: string;
  frequency: FrequencyType;
  customDays: number[]; // 0 (Sun) - 6 (Sat)
  targetCount: number; // Used for weekly_target or monthly_target
  specificDate?: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  dailyRepetitions: number;
  slots: TimeSlot[];
  generalNote: string;
  attachments: MediaAttachment[];
  logs: Record<string, TaskCompletionRecord>; // Keyed by YYYY-MM-DD
  createdAt: string;
  archived?: boolean;
}

export interface ReminderAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  slotId: string;
  slotTime: string;
  slotLabel?: string;
  dateStr: string;
  triggeredAt: string;
}

export interface AppPreferences {
  polarity: ThemePolarity;
  accent: AccentThemeId;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
  notificationsEnabled: boolean;
}

export type ActiveView = 'today' | 'calendar' | 'routines';

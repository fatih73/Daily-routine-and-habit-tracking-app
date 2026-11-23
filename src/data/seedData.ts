import { AppPreferences, TaskItem } from '../types/planner';
import { addDays, formatDateKey, getWeekDateKeys } from '../utils/scheduler';

export function createSeedTasks(referenceDate: Date = new Date()): TaskItem[] {
  const todayKey = formatDateKey(referenceDate);
  const yesterdayKey = addDays(todayKey, -1);
  const weekKeys = getWeekDateKeys(todayKey);
  const earlierWeekKey = weekKeys.find((k) => k < todayKey) ?? yesterdayKey;
  const futureDateKey = addDays(todayKey, 2);
  const nextWeekDateKey = addDays(todayKey, 5);
  const startKey = addDays(todayKey, -14);

  return [
    {
      id: 'habit-sonda',
      title: 'Sonda',
      kind: 'habit',
      category: 'Care & Health',
      frequency: 'daily',
      customDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      startDate: startKey,
      dailyRepetitions: 3,
      slots: [
        { id: 'sonda-morning', time: '09:00', label: 'Morning', reminderEnabled: true },
        { id: 'sonda-afternoon', time: '14:00', label: 'Afternoon', reminderEnabled: true },
        { id: 'sonda-evening', time: '20:00', label: 'Evening', reminderEnabled: true },
      ],
      generalNote:
        'Keep sterile supplies stocked in the top drawer. Log volume, comfort notes, or attach reference photos on each session slot.',
      attachments: [],
      logs: {
        [yesterdayKey]: {
          slots: {
            'sonda-morning': {
              completed: true,
              completedAt: `${yesterdayKey}T09:10:00.000Z`,
              note: 'Completed smoothly at 09:10.',
            },
            'sonda-afternoon': {
              completed: true,
              completedAt: `${yesterdayKey}T14:05:00.000Z`,
            },
            'sonda-evening': {
              completed: true,
              completedAt: `${yesterdayKey}T20:15:00.000Z`,
            },
          },
        },
        [todayKey]: {
          slots: {
            'sonda-morning': {
              completed: false,
              note: 'Prepare warm water & fresh kit before starting.',
            },
          },
        },
      },
      createdAt: `${startKey}T08:00:00.000Z`,
    },
    {
      id: 'task-deep-focus',
      title: 'Deep Focus Writing & Review',
      kind: 'task',
      category: 'Focus',
      frequency: 'custom_days',
      customDays: [1, 3, 5],
      targetCount: 3,
      startDate: startKey,
      dailyRepetitions: 1,
      slots: [
        { id: 'focus-slot-1', time: '10:30', label: 'Primary Block', reminderEnabled: true },
      ],
      generalNote:
        'Silence notifications for 90 minutes. Outline weekly deliverables before checking email.',
      attachments: [],
      logs: {},
      createdAt: `${startKey}T08:30:00.000Z`,
    },
    {
      id: 'habit-hydration',
      title: 'Electrolyte & Hydration Check',
      kind: 'habit',
      category: 'Health',
      frequency: 'daily',
      customDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      startDate: startKey,
      dailyRepetitions: 2,
      slots: [
        { id: 'hydro-1', time: '11:00', label: 'Mid-Morning', reminderEnabled: true },
        { id: 'hydro-2', time: '17:00', label: 'Late Afternoon', reminderEnabled: true },
      ],
      generalNote: '500 ml per session.',
      attachments: [],
      logs: {},
      createdAt: `${startKey}T09:00:00.000Z`,
    },
    {
      id: 'habit-strength',
      title: 'Strength & Mobility Session',
      kind: 'habit',
      category: 'Movement',
      frequency: 'weekly_target',
      customDays: [],
      targetCount: 4,
      startDate: startKey,
      dailyRepetitions: 1,
      slots: [
        { id: 'strength-1', time: '18:00', label: 'Workout', reminderEnabled: true },
      ],
      generalNote:
        'Flexible 4x/week quota: complete on any four days between Monday and Sunday.',
      attachments: [],
      logs: earlierWeekKey !== todayKey
        ? {
            [earlierWeekKey]: {
              slots: {
                'strength-1': {
                  completed: true,
                  completedAt: `${earlierWeekKey}T18:30:00.000Z`,
                  note: 'Upper body + 15 min shoulder mobility.',
                },
              },
            },
          }
        : {},
      createdAt: `${startKey}T09:15:00.000Z`,
    },
    {
      id: 'task-monthly-review',
      title: 'Monthly Budget & Supply Audit',
      kind: 'task',
      category: 'Admin',
      frequency: 'monthly_target',
      customDays: [],
      targetCount: 2,
      startDate: startKey,
      dailyRepetitions: 1,
      slots: [
        { id: 'audit-1', time: '19:30', label: 'Evening Audit', reminderEnabled: false },
      ],
      generalNote: 'Check recurring subscriptions and reorder monthly care supplies.',
      attachments: [],
      logs: {},
      createdAt: `${startKey}T10:00:00.000Z`,
    },
    {
      id: 'plan-clinic-followup',
      title: 'Specialist Follow-up Appointment',
      kind: 'task',
      category: 'Care & Health',
      frequency: 'specific_date',
      customDays: [],
      targetCount: 1,
      specificDate: futureDateKey,
      startDate: futureDateKey,
      dailyRepetitions: 1,
      slots: [
        { id: 'clinic-1', time: '11:15', label: 'Check-in', reminderEnabled: true },
      ],
      generalNote: 'Bring printed Sonda log summary and medication list.',
      attachments: [],
      logs: {},
      createdAt: `${todayKey}T08:00:00.000Z`,
    },
    {
      id: 'plan-weekly-prep',
      title: 'Quarterly Lab & Kit Refill',
      kind: 'task',
      category: 'Admin',
      frequency: 'specific_date',
      customDays: [],
      targetCount: 1,
      specificDate: nextWeekDateKey,
      startDate: nextWeekDateKey,
      dailyRepetitions: 1,
      slots: [
        { id: 'refill-1', time: '15:00', label: 'Pharmacy Pickup', reminderEnabled: true },
      ],
      generalNote: 'Confirm prescription renewal 24 hours prior.',
      attachments: [],
      logs: {},
      createdAt: `${todayKey}T08:05:00.000Z`,
    },
  ];
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  polarity: 'light',
  accent: 'indigo',
  soundEnabled: true,
  soundVolume: 0.35,
  notificationsEnabled: false,
};

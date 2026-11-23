import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  findDueReminders,
  getFrequencySummary,
  getPeriodQuotaProgress,
  getTaskDayProgress,
  isTaskScheduledForDate,
  normalizeSlotsForCount,
  toggleSlotCompletion,
  toggleWholeTaskCompletion,
  updateSlotNote,
} from './scheduler';
import { TaskItem } from '../types/planner';

function makeTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 't1',
    title: 'Sonda',
    kind: 'habit',
    category: 'Health',
    frequency: 'daily',
    customDays: [1, 3, 5],
    targetCount: 4,
    startDate: '2026-11-01',
    dailyRepetitions: 3,
    slots: [
      { id: 's1', time: '09:00', label: 'Morning', reminderEnabled: true },
      { id: 's2', time: '14:00', label: 'Afternoon', reminderEnabled: true },
      { id: 's3', time: '20:00', label: 'Evening', reminderEnabled: true },
    ],
    generalNote: '',
    attachments: [],
    logs: {},
    createdAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

test('isTaskScheduledForDate respects daily, custom_days, and specific_date', () => {
  const dailyTask = makeTask({ frequency: 'daily', startDate: '2026-11-20' });
  assert.equal(isTaskScheduledForDate(dailyTask, '2026-11-19'), false);
  assert.equal(isTaskScheduledForDate(dailyTask, '2026-11-23'), true);

  // 2026-11-23 is Monday (day 1), 2026-11-24 is Tuesday (day 2)
  const customTask = makeTask({ frequency: 'custom_days', customDays: [1, 3, 5] });
  assert.equal(isTaskScheduledForDate(customTask, '2026-11-23'), true);
  assert.equal(isTaskScheduledForDate(customTask, '2026-11-24'), false);

  const datedTask = makeTask({
    frequency: 'specific_date',
    specificDate: '2026-11-28',
  });
  assert.equal(isTaskScheduledForDate(datedTask, '2026-11-23'), false);
  assert.equal(isTaskScheduledForDate(datedTask, '2026-11-28'), true);
});

test('multi-slot completion toggles and tracks progress accurately', () => {
  let task = makeTask();
  const dateKey = '2026-11-23';

  assert.deepEqual(getTaskDayProgress(task, dateKey), {
    doneCount: 0,
    totalCount: 3,
    isComplete: false,
  });

  task = toggleSlotCompletion(task, dateKey, 's1', '2026-11-23T09:05:00Z');
  assert.deepEqual(getTaskDayProgress(task, dateKey), {
    doneCount: 1,
    totalCount: 3,
    isComplete: false,
  });

  task = toggleSlotCompletion(task, dateKey, 's2', '2026-11-23T14:05:00Z');
  task = toggleSlotCompletion(task, dateKey, 's3', '2026-11-23T20:05:00Z');
  assert.deepEqual(getTaskDayProgress(task, dateKey), {
    doneCount: 3,
    totalCount: 3,
    isComplete: true,
  });

  // Toggle whole task when complete marks all incomplete
  task = toggleWholeTaskCompletion(task, dateKey);
  assert.deepEqual(getTaskDayProgress(task, dateKey), {
    doneCount: 0,
    totalCount: 3,
    isComplete: false,
  });
});

test('weekly and monthly quota templates compute period progress', () => {
  let weeklyTask = makeTask({
    frequency: 'weekly_target',
    targetCount: 4,
    dailyRepetitions: 1,
    slots: [{ id: 's1', time: '18:00', reminderEnabled: true }],
  });

  // Week of 2026-11-23 (Mon) to 2026-11-29 (Sun)
  weeklyTask = toggleSlotCompletion(weeklyTask, '2026-11-23', 's1');
  weeklyTask = toggleSlotCompletion(weeklyTask, '2026-11-25', 's1');

  const quota = getPeriodQuotaProgress(weeklyTask, '2026-11-26');
  assert.deepEqual(quota, {
    completedSessions: 2,
    targetCount: 4,
    periodLabel: 'this week',
    isQuotaMet: false,
  });

  weeklyTask = toggleSlotCompletion(weeklyTask, '2026-11-26', 's1');
  weeklyTask = toggleSlotCompletion(weeklyTask, '2026-11-27', 's1');
  assert.equal(getPeriodQuotaProgress(weeklyTask, '2026-11-26')?.isQuotaMet, true);
});

test('slot-specific notes persist independently of completion state', () => {
  let task = makeTask();
  task = updateSlotNote(task, '2026-11-23', 's2', 'Afternoon check complete');
  assert.equal(
    task.logs['2026-11-23'].slots['s2'].note,
    'Afternoon check complete'
  );
  assert.equal(task.logs['2026-11-23'].slots['s2'].completed, false);
});

test('findDueReminders triggers only for incomplete enabled slots at matching HH:MM', () => {
  let task = makeTask();
  task = toggleSlotCompletion(task, '2026-11-23', 's1'); // s1 (09:00) is done

  const seen = new Set<string>();
  const at0900 = findDueReminders([task], '2026-11-23', '09:00', seen);
  assert.equal(at0900.length, 0);

  const at1400 = findDueReminders([task], '2026-11-23', '14:00', seen);
  assert.equal(at1400.length, 1);
  assert.equal(at1400[0].slotId, 's2');

  seen.add(at1400[0].id);
  const repeat1400 = findDueReminders([task], '2026-11-23', '14:00', seen);
  assert.equal(repeat1400.length, 0);
});

test('normalizeSlotsForCount and addDays behave cleanly', () => {
  const slots = normalizeSlotsForCount(
    [{ id: 'a', time: '09:00', reminderEnabled: true }],
    3
  );
  assert.equal(slots.length, 3);
  assert.equal(slots[0].id, 'a');
  assert.equal(addDays('2026-11-23', 2), '2026-11-25');
  assert.equal(getFrequencySummary(makeTask()), 'Daily · 3x/day');
});

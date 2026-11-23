import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Layers,
  Moon,
  Palette,
  Plus,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ActiveView,
  AppPreferences,
  ReminderAlert,
  TaskItem,
} from './types/planner';
import {
  findDueReminders,
  formatDateKey,
  formatDisplayDate,
  formatTime12h,
  isTaskScheduledForDate,
  toggleSlotCompletion,
  toggleWholeTaskCompletion,
} from './utils/scheduler';
import {
  loadPreferences,
  loadTasks,
  savePreferences,
  saveTasks,
} from './utils/storage';
import {
  playCompletionChime,
  playReminderTone,
  playSubtleClick,
} from './utils/sound';
import { createSeedTasks } from './data/seedData';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { RoutinesView } from './components/RoutinesView';
import { TaskInspector } from './components/TaskInspector';
import { TaskFormModal } from './components/TaskFormModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { ReminderToastStack } from './components/ReminderToastStack';

export function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [preferences, setPreferences] = useState<AppPreferences>(() =>
    loadPreferences()
  );
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    formatDateKey(new Date())
  );
  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(() => {
    const initial = loadTasks();
    return initial[0]?.id ?? null;
  });
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ReminderAlert[]>([]);

  const triggeredReminderIds = useRef<Set<string>>(new Set());

  // Sync theme polarity & accent palette to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.polarity === 'dark');
    root.setAttribute('data-accent', preferences.accent);
    savePreferences(preferences);
  }, [preferences]);

  // Persist tasks to LocalStorage
  useEffect(() => {
    const result = saveTasks(tasks);
    if (!result.ok && result.error) {
      setStorageWarning(result.error);
    } else if (result.ok && storageWarning) {
      setStorageWarning(null);
    }
  }, [tasks, storageWarning]);

  // Real-time reminder scheduler (checks every 20 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayKey = formatDateKey(now);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;

      const due = findDueReminders(
        tasks,
        todayKey,
        currentHHMM,
        triggeredReminderIds.current
      );

      if (due.length > 0) {
        due.forEach((alert) => triggeredReminderIds.current.add(alert.id));
        setActiveAlerts((prev) => [...prev, ...due]);
        playReminderTone(preferences.soundEnabled, preferences.soundVolume);

        if (
          preferences.notificationsEnabled &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          due.forEach((alert) => {
            try {
              new Notification(`Cadence Reminder: ${alert.taskTitle}`, {
                body: `${formatTime12h(alert.slotTime)}${
                  alert.slotLabel ? ` · ${alert.slotLabel}` : ''
                }`,
              });
            } catch {
              // Ignore Notification constructor failures in sandboxed contexts
            }
          });
        }
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 20000);
    return () => window.clearInterval(timer);
  }, [
    tasks,
    preferences.soundEnabled,
    preferences.soundVolume,
    preferences.notificationsEnabled,
  ]);

  const clickSound = () => {
    playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
  };

  const inspectedTask = useMemo(
    () => tasks.find((t) => t.id === inspectedTaskId) ?? null,
    [tasks, inspectedTaskId]
  );

  // Upcoming reminders for today in sidebar
  const upcomingTodayReminders = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const items: {
      taskId: string;
      title: string;
      slotId: string;
      time: string;
      label?: string;
    }[] = [];

    for (const task of tasks) {
      if (!isTaskScheduledForDate(task, todayKey)) continue;
      const record = task.logs[todayKey];
      for (const slot of task.slots) {
        if (!slot.reminderEnabled) continue;
        if (record?.slots[slot.id]?.completed) continue;
        items.push({
          taskId: task.id,
          title: task.title,
          slotId: slot.id,
          time: slot.time,
          label: slot.label,
        });
      }
    }

    return items.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 4);
  }, [tasks]);

  const handleToggleSlot = (taskId: string, dateKey: string, slotId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const wasDone = task.logs[dateKey]?.slots[slotId]?.completed ?? false;
        if (!wasDone) {
          playCompletionChime(
            preferences.soundEnabled,
            preferences.soundVolume
          );
        } else {
          playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
        }
        return toggleSlotCompletion(task, dateKey, slotId);
      })
    );
  };

  const handleToggleWholeTask = (taskId: string, dateKey: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const next = toggleWholeTaskCompletion(task, dateKey);
        const nowDone = next.slots.every(
          (s) => next.logs[dateKey]?.slots[s.id]?.completed
        );
        if (nowDone) {
          playCompletionChime(
            preferences.soundEnabled,
            preferences.soundVolume
          );
        } else {
          playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
        }
        return next;
      })
    );
  };

  const handleUpdateTask = (updated: TaskItem) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updated.id ? updated : task))
    );
  };

  const handleSaveTaskForm = (saved: TaskItem) => {
    playCompletionChime(preferences.soundEnabled, preferences.soundVolume);
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      if (exists) {
        return prev.map((t) => (t.id === saved.id ? saved : t));
      }
      return [saved, ...prev];
    });
    setInspectedTaskId(saved.id);
    if (saved.frequency === 'specific_date' && saved.specificDate) {
      setSelectedDateKey(saved.specificDate);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    clickSound();
    setTasks((prev) => {
      const remaining = prev.filter((t) => t.id !== taskId);
      if (inspectedTaskId === taskId) {
        setInspectedTaskId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
    setMobileInspectorOpen(false);
  };

  const handleOpenNewTask = (datePreset?: string) => {
    clickSound();
    setEditingTask(null);
    setPresetDate(datePreset);
    setFormOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setPresetDate(undefined);
    setFormOpen(true);
  };

  const handleInspectTask = (taskId: string) => {
    setInspectedTaskId(taskId);
    // Open drawer on mobile/tablet or when not in Today 2-column inspector view
    if (activeView !== 'today' || window.innerWidth < 1280) {
      setMobileInspectorOpen(true);
    }
  };

  const handleTestReminder = () => {
    const sample = tasks[0];
    const slot = sample?.slots[0];
    playReminderTone(preferences.soundEnabled, preferences.soundVolume);
    const previewAlert: ReminderAlert = {
      id: `preview-${Date.now()}`,
      taskId: sample?.id ?? 'preview',
      taskTitle: sample?.title ?? 'Sonda',
      slotId: slot?.id ?? 'preview-slot',
      slotTime: slot?.time ?? '09:00',
      slotLabel: slot?.label || 'Morning',
      dateStr: formatDateKey(new Date()),
      triggeredAt: new Date().toISOString(),
    };
    setActiveAlerts((prev) => [...prev, previewAlert]);
  };

  const handleResetDemoData = () => {
    const fresh = createSeedTasks();
    setTasks(fresh);
    setInspectedTaskId(fresh[0]?.id ?? null);
    setSelectedDateKey(formatDateKey(new Date()));
  };

  const navItems: {
    id: ActiveView;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'today', label: 'Today', icon: CheckCircle2 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'routines', label: 'Routines', icon: Layers },
  ];

  const viewTitle =
    activeView === 'today'
      ? `Today · ${formatDisplayDate(selectedDateKey)}`
      : activeView === 'calendar'
      ? 'Calendar & Future Plans'
      : 'Routines & Period Templates';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[256px] lg:shrink-0 lg:flex-col lg:justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        <div className="p-5 space-y-6">
          <div className="px-2">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Cadence
            </span>
          </div>

          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    clickSound();
                    setActiveView(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] dark:text-[var(--accent)]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Upcoming Slot Reminders */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="px-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Today&apos;s Reminders
              </span>
              <Bell className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </div>

            {upcomingTodayReminders.length === 0 ? (
              <p className="px-2 text-xs text-slate-500 dark:text-slate-400">
                All active reminders completed for today.
              </p>
            ) : (
              <ul className="space-y-1">
                {upcomingTodayReminders.map((rem) => (
                  <li key={`${rem.taskId}-${rem.slotId}`}>
                    <button
                      type="button"
                      onClick={() => {
                        clickSound();
                        setActiveView('today');
                        setSelectedDateKey(formatDateKey(new Date()));
                        setInspectedTaskId(rem.taskId);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {rem.title}
                      </span>
                      <span className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400 shrink-0">
                        {formatTime12h(rem.time)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Quick Polarity, Sound & Theme Drawer Trigger */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                clickSound();
                setPreferences((p) => ({
                  ...p,
                  polarity: p.polarity === 'light' ? 'dark' : 'light',
                }));
              }}
              aria-label={`Switch to ${
                preferences.polarity === 'light' ? 'Dark' : 'Light'
              } Mode`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {preferences.polarity === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Light</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextSound = !preferences.soundEnabled;
                setPreferences((p) => ({ ...p, soundEnabled: nextSound }));
                if (nextSound) {
                  playSubtleClick(true, preferences.soundVolume);
                }
              }}
              aria-label={
                preferences.soundEnabled
                  ? 'Mute subtle UI sound'
                  : 'Enable subtle UI sound'
              }
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {preferences.soundEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              clickSound();
              setThemeModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Themes & Audio</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
              Cadence
            </span>
            <span
              className="lg:hidden text-slate-300 dark:text-slate-700"
              aria-hidden="true"
            >
              /
            </span>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {viewTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewTask()}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Storage Quota Alert if needed */}
        {storageWarning && (
          <div
            role="alert"
            className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200"
          >
            <span>{storageWarning}</span>
            <button
              type="button"
              onClick={() => setStorageWarning(null)}
              aria-label="Dismiss storage warning"
              className="p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Active View Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {activeView === 'today' && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
              <TodayView
                tasks={tasks}
                selectedDateKey={selectedDateKey}
                onSelectDateKey={setSelectedDateKey}
                inspectedTaskId={inspectedTaskId}
                onInspectTask={handleInspectTask}
                onToggleSlot={handleToggleSlot}
                onToggleWholeTask={handleToggleWholeTask}
                onOpenNewTask={handleOpenNewTask}
                onUiClick={clickSound}
              />

              {/* Desktop Sticky Inspector */}
              <div className="hidden xl:block sticky top-24">
                <TaskInspector
                  task={inspectedTask}
                  selectedDateKey={selectedDateKey}
                  onUpdateTask={handleUpdateTask}
                  onToggleSlot={handleToggleSlot}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onUiClick={clickSound}
                />
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              selectedDateKey={selectedDateKey}
              onSelectDateKey={setSelectedDateKey}
              onInspectTask={handleInspectTask}
              onToggleSlot={handleToggleSlot}
              onPlanForDate={(dateKey) => handleOpenNewTask(dateKey)}
              onUiClick={clickSound}
            />
          )}

          {activeView === 'routines' && (
            <RoutinesView
              tasks={tasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onInspectTask={handleInspectTask}
              onToggleWholeTask={handleToggleWholeTask}
              onOpenNewTask={() => handleOpenNewTask()}
              onUiClick={clickSound}
            />
          )}
        </main>
      </div>

      {/* Mobile & Tablet Slide-Over Inspector Drawer */}
      {mobileInspectorOpen && inspectedTask && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-end bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Inspect ${inspectedTask.title}`}
        >
          <div className="w-full sm:max-w-md h-[88vh] sm:h-full bg-white dark:bg-slate-900 sm:border-l border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col">
            <TaskInspector
              task={inspectedTask}
              selectedDateKey={selectedDateKey}
              onUpdateTask={handleUpdateTask}
              onToggleSlot={handleToggleSlot}
              onEditTask={(t) => {
                setMobileInspectorOpen(false);
                handleEditTask(t);
              }}
              onDeleteTask={handleDeleteTask}
              onCloseMobile={() => setMobileInspectorOpen(false)}
              onUiClick={clickSound}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Navigation (h-16, total sticky height < 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center px-2"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                clickSound();
                setActiveView(item.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            clickSound();
            setThemeModalOpen(true);
          }}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <Palette className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] font-medium">Themes</span>
        </button>
      </nav>

      {/* Modals & Reminder Toasts */}
      <TaskFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTaskForm}
        initialTask={editingTask}
        presetDate={presetDate}
        onUiClick={clickSound}
      />

      <ThemeSettingsModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onResetDemoData={handleResetDemoData}
        onTestReminder={handleTestReminder}
      />

      <ReminderToastStack
        alerts={activeAlerts}
        onDismiss={(alertId) =>
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
        }
        onCompleteFromAlert={(alert) => {
          if (alert.taskId !== 'preview') {
            handleToggleSlot(alert.taskId, alert.dateStr, alert.slotId);
          } else {
            playCompletionChime(
              preferences.soundEnabled,
              preferences.soundVolume
            );
          }
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }}
      />
    </div>
  );
}

export default App;

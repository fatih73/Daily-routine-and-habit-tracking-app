import { AppPreferences, TaskItem } from '../types/planner';
import { createSeedTasks, DEFAULT_PREFERENCES } from '../data/seedData';

const TASKS_STORAGE_KEY = 'cadence_planner_tasks_v1';
const PREFS_STORAGE_KEY = 'cadence_planner_prefs_v1';

export function loadTasks(): TaskItem[] {
  if (typeof window === 'undefined') return createSeedTasks();
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedTasks();
      saveTasks(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return createSeedTasks();
  } catch {
    return createSeedTasks();
  }
}

export function saveTasks(tasks: TaskItem[]): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: true };
  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? 'Storage limit reached. Try removing large media attachments.'
          : 'Unable to persist data to local storage.',
    };
  }
}

export function loadPreferences(): AppPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: AppPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore preference storage errors
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

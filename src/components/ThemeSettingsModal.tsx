import React from 'react';
import { Bell, Check, Moon, RotateCcw, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { AccentThemeId, AppPreferences } from '../types/planner';
import { playCompletionChime, playSubtleClick } from '../utils/sound';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onResetDemoData: () => void;
  onTestReminder: () => void;
}

const ACCENT_OPTIONS: {
  id: AccentThemeId;
  label: string;
  swatch: string;
}[] = [
  { id: 'indigo', label: 'Indigo', swatch: '#3730a3' },
  { id: 'sage', label: 'Forest Sage', swatch: '#0f766e' },
  { id: 'ochre', label: 'Amber Ochre', swatch: '#b45309' },
  { id: 'cobalt', label: 'Ocean Cobalt', swatch: '#0369a1' },
  { id: 'rose', label: 'Rose Clay', swatch: '#be123c' },
  { id: 'graphite', label: 'Graphite', swatch: '#27272a' },
];

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetDemoData,
  onTestReminder,
}) => {
  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onUpdatePreferences({
        ...preferences,
        notificationsEnabled: !preferences.notificationsEnabled,
      });
      return;
    }

    if (!preferences.notificationsEnabled) {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        onUpdatePreferences({
          ...preferences,
          notificationsEnabled: result === 'granted' || true,
        });
      } else {
        onUpdatePreferences({
          ...preferences,
          notificationsEnabled: true,
        });
      }
    } else {
      onUpdatePreferences({
        ...preferences,
        notificationsEnabled: false,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-settings-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="theme-settings-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Appearance, Audio & Reminders
          </h2>
          <button
            type="button"
            onClick={() => {
              playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
              onClose();
            }}
            aria-label="Close appearance settings"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Polarity Switch */}
          <div className="space-y-2.5">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Surface Mode
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
                  onUpdatePreferences({ ...preferences, polarity: 'light' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  preferences.polarity === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
                  onUpdatePreferences({ ...preferences, polarity: 'dark' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  preferences.polarity === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Color Theme Swatches */}
          <div className="space-y-2.5">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Color Theme
            </span>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((theme) => {
                const isActive = preferences.accent === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      playSubtleClick(
                        preferences.soundEnabled,
                        preferences.soundVolume
                      );
                      onUpdatePreferences({ ...preferences, accent: theme.id });
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: theme.swatch }}
                      aria-hidden="true"
                    >
                      {isActive && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span className="truncate">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtle Audio Interactions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                {preferences.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Subtle Sound Feedback
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Soft low-volume tones on clicks and completions
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.soundEnabled}
                aria-label="Toggle subtle sound feedback"
                onClick={() => {
                  const nextEnabled = !preferences.soundEnabled;
                  onUpdatePreferences({
                    ...preferences,
                    soundEnabled: nextEnabled,
                  });
                  if (nextEnabled) {
                    playCompletionChime(true, preferences.soundVolume);
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  preferences.soundEnabled
                    ? 'bg-[var(--accent)]'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {preferences.soundEnabled && (
              <div className="flex items-center gap-3 pl-6">
                <label
                  htmlFor="sound-volume-range"
                  className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  Volume
                </label>
                <input
                  id="sound-volume-range"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={preferences.soundVolume}
                  onChange={(e) =>
                    onUpdatePreferences({
                      ...preferences,
                      soundVolume: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <span className="text-xs font-mono-num text-slate-600 dark:text-slate-400 w-9 text-right">
                  {Math.round(preferences.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Reminders & Browser Notifications */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Slot & Date Reminders
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    In-app alerts and desktop notifications at scheduled times
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.notificationsEnabled}
                aria-label="Toggle reminder notifications"
                onClick={handleRequestNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  preferences.notificationsEnabled
                    ? 'bg-[var(--accent)]'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    preferences.notificationsEnabled
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pl-6">
              <button
                type="button"
                onClick={() => {
                  onTestReminder();
                }}
                className="text-xs font-medium text-[var(--accent-strong)] dark:text-[var(--accent)] hover:underline cursor-pointer"
              >
                Preview reminder alert
              </button>
              <button
                type="button"
                onClick={() => {
                  playSubtleClick(preferences.soundEnabled, preferences.soundVolume);
                  onResetDemoData();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Restore sample data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

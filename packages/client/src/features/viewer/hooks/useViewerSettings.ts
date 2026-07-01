import { useState, useCallback } from 'react';

export interface ViewerSettings {
  language: string;
  textSize: 'sm' | 'md' | 'lg';
  darkMode: boolean;
  autoPlayTts: boolean;
  showText: boolean;
  fullscreenImage: boolean;
}

interface PersistedSettings extends ViewerSettings {
  version?: number;
}

const STORAGE_KEY = 'tangobook-viewer-settings';

/** Increment when a one-time migration of existing persisted values is needed. */
const SETTINGS_VERSION = 2;

const DEFAULT_SETTINGS: ViewerSettings = {
  language: 'ko',
  textSize: 'md',
  darkMode: true,
  autoPlayTts: true,
  showText: true,
  fullscreenImage: true,
};

export function loadSettingsForTest(): PersistedSettings {
  return loadSettings();
}

function loadSettings(): PersistedSettings {
  let saved: Partial<PersistedSettings> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) as Partial<PersistedSettings>;
  } catch {
    /* ignore */
  }

  // Merge saved over defaults first
  let merged: PersistedSettings = { ...DEFAULT_SETTINGS, ...saved };

  // Version migration: if version is missing or outdated, force the migrated
  // fields to their new defaults (only fullscreenImage for v2), then bump version.
  if ((saved.version ?? 0) < SETTINGS_VERSION) {
    merged = {
      ...merged,
      fullscreenImage: DEFAULT_SETTINGS.fullscreenImage,
      version: SETTINGS_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }

  return merged;
}

export function useViewerSettings() {
  const [settings, setSettings] = useState<PersistedSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((prev) => {
      const next: PersistedSettings = { ...prev, ...patch, version: SETTINGS_VERSION };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [settings, updateSettings] as const;
}

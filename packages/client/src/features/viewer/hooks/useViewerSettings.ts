import { useState, useCallback } from 'react';

export interface ViewerSettings {
  language: string;
  textSize: 'sm' | 'md' | 'lg';
  darkMode: boolean;
  autoPlayTts: boolean;
  showText: boolean;
  fullscreenImage: boolean;
}

const STORAGE_KEY = 'tangobook-viewer-settings';

const DEFAULT_SETTINGS: ViewerSettings = {
  language: 'ko',
  textSize: 'md',
  darkMode: true,
  autoPlayTts: false,
  showText: true,
  fullscreenImage: false,
};

function loadSettings(): ViewerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function useViewerSettings() {
  const [settings, setSettings] = useState<ViewerSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return [settings, updateSettings] as const;
}

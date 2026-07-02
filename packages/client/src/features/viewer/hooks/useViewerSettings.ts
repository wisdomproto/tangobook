import { useState, useCallback } from 'react';

export type ViewerVolume = 'low' | 'mid' | 'high';

export interface ViewerSettings {
  language: string;
  textSize: 'sm' | 'md' | 'lg';
  darkMode: boolean;
  autoPlayTts: boolean;
  showText: boolean;
  fullscreenImage: boolean;
  /** 음량 3단계 (전역) — TTS 직접 적용, BGM 은 저작자 볼륨 × 계수 */
  volume: ViewerVolume;
}

/** 단계 → 실제 gain. high=1.0(기존과 동일), mid/low 는 체감 구분되는 계단. */
export const VOLUME_GAIN: Record<ViewerVolume, number> = {
  low: 0.35,
  mid: 0.7,
  high: 1,
};

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
  volume: 'high',
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

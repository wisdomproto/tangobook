import { useCallback, useEffect, useState } from 'react';
import type { ChildProfile } from '@tangobook/shared';
import { profilesApi } from '../api/profiles.api';

const KEY = 'tangobook:activeProfileId';

export function useActiveProfile(profiles: ChildProfile[]) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeId && !profiles.some((p) => p.id === activeId)) {
      setActiveId(null);
      try {
        localStorage.removeItem(KEY);
      } catch {
        // no-op
      }
    }
  }, [profiles, activeId]);

  // 자녀가 1명이면 자동 선택 (선택 화면 건너뛰기)
  useEffect(() => {
    if (!activeId && profiles.length === 1) {
      const only = profiles[0];
      setActiveId(only.id);
      try {
        localStorage.setItem(KEY, only.id);
      } catch {
        // no-op
      }
    }
  }, [profiles, activeId]);

  const setActive = useCallback((p: ChildProfile | null) => {
    if (p) {
      setActiveId(p.id);
      try {
        localStorage.setItem(KEY, p.id);
      } catch {
        // no-op
      }
      void profilesApi.touchActive(p.id).catch(() => {});
    } else {
      setActiveId(null);
      try {
        localStorage.removeItem(KEY);
      } catch {
        // no-op
      }
    }
  }, []);

  const activeProfile = activeId ? (profiles.find((p) => p.id === activeId) ?? null) : null;

  return { activeProfile, setActiveProfile: setActive };
}

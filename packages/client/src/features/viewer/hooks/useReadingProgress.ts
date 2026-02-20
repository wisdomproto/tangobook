import { useState, useCallback } from 'react';

function storageKey(id: string) {
  return `tangobook-progress-${id}`;
}

export function useReadingProgress(storybookId: string | undefined) {
  const [lastPage] = useState<number>(() => {
    if (!storybookId) return 0;
    try {
      const raw = localStorage.getItem(storageKey(storybookId));
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  });

  const saveProgress = useCallback(
    (page: number) => {
      if (!storybookId) return;
      try {
        localStorage.setItem(storageKey(storybookId), String(page));
      } catch {
        /* ignore */
      }
    },
    [storybookId]
  );

  return { lastPage, saveProgress };
}

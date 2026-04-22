import { useCallback, useState } from 'react';

interface SpeakingProgressEntry {
  version: 1;
  storybookId: string;
  lang: 'ko' | 'en';
  totalRounds: number;
  spokenRounds: number;
  wordsSpoken: string[];
  lastPlayedAt: string;
}

function emptyEntry(storybookId: string, lang: 'ko' | 'en'): SpeakingProgressEntry {
  return {
    version: 1,
    storybookId,
    lang,
    totalRounds: 0,
    spokenRounds: 0,
    wordsSpoken: [],
    lastPlayedAt: new Date().toISOString(),
  };
}

function storageKey(storybookId: string, lang: 'ko' | 'en'): string {
  return `tangobook:speaking:${storybookId}:${lang}`;
}

function readEntry(storybookId: string, lang: 'ko' | 'en'): SpeakingProgressEntry {
  try {
    const raw = localStorage.getItem(storageKey(storybookId, lang));
    if (!raw) return emptyEntry(storybookId, lang);
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.wordsSpoken)) {
      return emptyEntry(storybookId, lang);
    }
    return parsed;
  } catch {
    return emptyEntry(storybookId, lang);
  }
}

function writeEntry(entry: SpeakingProgressEntry): void {
  try {
    localStorage.setItem(storageKey(entry.storybookId, entry.lang), JSON.stringify(entry));
  } catch (err) {
    // private mode / quota exceeded — silent

    console.debug('[useSpeakingProgress] localStorage write failed', err);
  }
}

export function useSpeakingProgress(
  storybookId: string,
  lang: 'ko' | 'en'
): {
  progress: SpeakingProgressEntry;
  record: (r: { spoken: boolean; transcription: string | null; targetWord: string }) => void;
  reset: () => void;
} {
  const [progress, setProgress] = useState<SpeakingProgressEntry>(() =>
    readEntry(storybookId, lang)
  );

  const record = useCallback(
    (r: { spoken: boolean; transcription: string | null; targetWord: string }) => {
      setProgress((prev) => {
        const next: SpeakingProgressEntry = {
          ...prev,
          totalRounds: prev.totalRounds + 1,
          spokenRounds: r.spoken ? prev.spokenRounds + 1 : prev.spokenRounds,
          wordsSpoken:
            r.spoken && r.transcription && !prev.wordsSpoken.includes(r.targetWord)
              ? [...prev.wordsSpoken, r.targetWord]
              : prev.wordsSpoken,
          lastPlayedAt: new Date().toISOString(),
        };
        writeEntry(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(storybookId, lang));
    } catch {
      // silent
    }
    setProgress(emptyEntry(storybookId, lang));
  }, [storybookId, lang]);

  return { progress, record, reset };
}

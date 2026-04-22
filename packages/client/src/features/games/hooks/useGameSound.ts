import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface SystemSoundsOverride {
  correctUrl?: string;
  incorrectUrl?: string;
  clearUrl?: string;
}

interface UseGameSoundOptions {
  systemSounds?: SystemSoundsOverride;
}

const DEFAULT_CORRECT = '/sounds/game/correct.mp3';
const DEFAULT_INCORRECT = '/sounds/game/incorrect.mp3';
const DEFAULT_CLEAR = '/sounds/game/clear.mp3';
const STORAGE_KEY = 'tangobook-game-muted';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * 게임 효과음 재생 훅.
 * - 기본 URL: `/sounds/game/{correct,incorrect,clear}.mp3`
 * - `systemSounds` 옵션으로 storybook별 커스텀 URL override 가능
 * - 음소거는 localStorage('tangobook-game-muted')에 영속
 */
export function useGameSound(opts?: UseGameSoundOptions) {
  const correctUrl = opts?.systemSounds?.correctUrl ?? DEFAULT_CORRECT;
  const incorrectUrl = opts?.systemSounds?.incorrectUrl ?? DEFAULT_INCORRECT;
  const clearUrl = opts?.systemSounds?.clearUrl ?? DEFAULT_CLEAR;

  const correctRef = useRef<HTMLAudioElement | null>(null);
  const incorrectRef = useRef<HTMLAudioElement | null>(null);
  const clearRef = useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => loadMuted());

  // URL 변경 시 프리로드 (mount + URL 변경 시점)
  useEffect(() => {
    const a = new Audio(correctUrl);
    a.preload = 'auto';
    correctRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [correctUrl]);

  useEffect(() => {
    const a = new Audio(incorrectUrl);
    a.preload = 'auto';
    incorrectRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [incorrectUrl]);

  useEffect(() => {
    const a = new Audio(clearUrl);
    a.preload = 'auto';
    clearRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [clearUrl]);

  const playRef = useCallback(
    (ref: RefObject<HTMLAudioElement | null>) => {
      if (isMuted) return;
      const a = ref.current;
      if (!a) return;
      try {
        a.currentTime = 0;
        void a.play().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    [isMuted]
  );

  const playCorrect = useCallback(() => playRef(correctRef), [playRef]);
  const playIncorrect = useCallback(() => playRef(incorrectRef), [playRef]);
  const playClear = useCallback(() => playRef(clearRef), [playRef]);

  const toggleMuted = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { playCorrect, playIncorrect, playClear, isMuted, toggleMuted };
}

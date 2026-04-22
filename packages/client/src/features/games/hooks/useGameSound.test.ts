import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameSound } from './useGameSound';

// HTMLAudioElement 기본 mock. 인스턴스 전부 캡처해서 play 호출 여부 검증.
const audioInstances: AudioMock[] = [];
class AudioMock {
  currentTime = 0;
  src = '';
  preload = '';
  paused = true;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  constructor(src?: string) {
    if (src) this.src = src;
    audioInstances.push(this);
  }
}
vi.stubGlobal('Audio', AudioMock);

describe('useGameSound', () => {
  beforeEach(() => {
    localStorage.clear();
    audioInstances.length = 0;
    vi.clearAllMocks();
  });

  it('returns playCorrect/playIncorrect/playClear', () => {
    const { result } = renderHook(() => useGameSound());
    expect(typeof result.current.playCorrect).toBe('function');
    expect(typeof result.current.playIncorrect).toBe('function');
    expect(typeof result.current.playClear).toBe('function');
    expect(typeof result.current.toggleMuted).toBe('function');
    expect(result.current.isMuted).toBe(false);
  });

  it('uses default /sounds/game/*.mp3 when no systemSounds', () => {
    const { result } = renderHook(() => useGameSound());
    expect(() => result.current.playCorrect()).not.toThrow();
    const correct = audioInstances.find((a) => a.src.includes('/sounds/game/correct.mp3'));
    expect(correct).toBeDefined();
  });

  it('uses override URL when systemSounds.correctUrl provided', () => {
    const { result } = renderHook(() =>
      useGameSound({ systemSounds: { correctUrl: 'https://cdn/custom.mp3' } })
    );
    expect(() => result.current.playCorrect()).not.toThrow();
    const override = audioInstances.find((a) => a.src === 'https://cdn/custom.mp3');
    expect(override).toBeDefined();
  });

  it('toggleMuted persists to localStorage', () => {
    const { result } = renderHook(() => useGameSound());
    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem('tangobook-game-muted')).toBe('true');
  });

  it('restores muted state from localStorage on mount', () => {
    localStorage.setItem('tangobook-game-muted', 'true');
    const { result } = renderHook(() => useGameSound());
    expect(result.current.isMuted).toBe(true);
  });

  it('muted state skips play()', () => {
    localStorage.setItem('tangobook-game-muted', 'true');
    const { result } = renderHook(() => useGameSound());
    const correctInstance = audioInstances.find((a) => a.src.includes('correct.mp3'));
    expect(correctInstance).toBeDefined();
    act(() => result.current.playCorrect());
    expect(correctInstance!.play).not.toHaveBeenCalled();
  });

  it('unmuted state calls play()', () => {
    const { result } = renderHook(() => useGameSound());
    const correctInstance = audioInstances.find((a) => a.src.includes('correct.mp3'));
    expect(correctInstance).toBeDefined();
    act(() => result.current.playCorrect());
    expect(correctInstance!.play).toHaveBeenCalledTimes(1);
  });
});

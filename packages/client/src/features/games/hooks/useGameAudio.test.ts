import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameAudio } from './useGameAudio';
import { getSharedAudio } from '@/lib/audio-unlock';

vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: { getSystemSounds: () => Promise.resolve({}) },
}));

const flush = () => act(async () => {});

/** 요소 하나를 돌려쓰므로, 지금 무엇이 울리는지는 그 요소의 src 로 본다. */
function playing(): string {
  return getSharedAudio().src.split('/').slice(-1)[0];
}

function end() {
  act(() => {
    getSharedAudio().dispatchEvent(new Event('ended'));
  });
}

describe('useGameAudio.playAudio', () => {
  it('소리가 끝나면 다음 링크를 부른다', async () => {
    const { result } = renderHook(() => useGameAudio());
    const next = vi.fn();

    act(() => result.current.playAudio('https://x/ga.mp3', next));
    expect(playing()).toBe('ga.mp3');
    expect(next).not.toHaveBeenCalled();

    end();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('🔴 끼어들면 옛 체인을 닫아 준다 — 안 닫으면 그걸 기다리던 화면이 멈춘다', async () => {
    const { result } = renderHook(() => useGameAudio());
    const first = vi.fn();
    const second = vi.fn();

    act(() => result.current.playAudio('https://x/ga.mp3', first));
    act(() => result.current.playAudio('https://x/na.mp3', second));
    await flush();

    expect(playing()).toBe('na.mp3'); // 새 소리가 이긴다
    expect(first).toHaveBeenCalledTimes(1); // 옛 체인은 닫혔다
    expect(second).not.toHaveBeenCalled();

    end();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1); // 두 번 불리지 않는다
  });

  it('stopAll 뒤엔 끝나도 다음 링크를 안 부른다', async () => {
    const { result } = renderHook(() => useGameAudio());
    const next = vi.fn();

    act(() => result.current.playAudio('https://x/ga.mp3', next));
    act(() => result.current.stopAll());
    await flush();
    end();

    expect(next).not.toHaveBeenCalled();
  });

  it('URL 이 없으면 기다리지 않고 바로 다음으로', () => {
    const { result } = renderHook(() => useGameAudio());
    const next = vi.fn();
    act(() => result.current.playAudio(undefined, next));
    expect(next).toHaveBeenCalledTimes(1);
  });
});

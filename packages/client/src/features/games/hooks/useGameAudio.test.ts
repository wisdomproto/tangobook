import * as effects from '../effects/learning-effects';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameAudio } from './useGameAudio';
import { getSharedAudio } from '@/lib/audio-unlock';
import { warmAudioUrl } from './useGamePrefetch';

const fixture = vi.hoisted(() => ({
  sounds: {} as Record<string, { correct: Array<{ url: string }> }>,
}));
vi.mock('./useGamePrefetch', () => ({ warmAudioUrl: vi.fn(async () => {}) }));

vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: { getSystemSounds: () => Promise.resolve(fixture.sounds) },
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
  it('이탈 후 늦은 ended와 URL 응답이 옛 화면의 재생·예약을 되살리지 않는다', async () => {
    const hook = renderHook(() => useGameAudio());
    const audio = hook.result.current;
    const next = vi.fn();
    act(() => audio.playAudio('https://x/old.mp3', next));
    const lateEnded = getSharedAudio().onended;
    hook.unmount();
    const play = vi.spyOn(getSharedAudio(), 'play').mockClear();
    act(() => {
      lateEnded?.call(getSharedAudio(), new Event('ended'));
      audio.playAudio('https://x/late.mp3', next);
      audio.playAudio(undefined, next);
    });
    await flush();
    expect(next).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
    play.mockRestore();
  });

  it('다른 훅이 소리를 소유하면 옛 훅의 이탈이 새 발음을 끊지 않는다', async () => {
    const old = renderHook(() => useGameAudio());
    const fresh = renderHook(() => useGameAudio());
    const next = vi.fn();
    act(() => old.result.current.playAudio('https://x/old.mp3'));
    act(() => fresh.result.current.playAudio('https://x/fresh.mp3', next));
    await flush();
    const pause = vi.spyOn(getSharedAudio(), 'pause').mockClear();
    old.unmount();
    expect(pause.mock.contexts.filter((element) => element === getSharedAudio())).toHaveLength(0);
    end();
    expect(next).toHaveBeenCalledTimes(1);
    pause.mockRestore();
  });
  it('실패 처리 콜백이 있으면 재생 오류를 소리 완료로 알리지 않는다', () => {
    const { result } = renderHook(() => useGameAudio());
    const next = vi.fn(),
      fail = vi.fn();
    act(() => result.current.playAudio('https://x/missing.mp3', next, fail));
    act(() => getSharedAudio().dispatchEvent(new Event('error')));
    expect(fail).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });
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

describe('learning success response', () => {
  it('진입에서 준비한 칭찬을 실제로 쓰고, 종료 후 다음 칭찬만 준비한다', async () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    fixture.sounds = {
      korean: { correct: [{ url: 'https://x/ko1.mp3' }, { url: 'https://x/ko2.mp3' }] },
      english: { correct: [{ url: 'https://x/en.mp3' }] },
    };
    vi.mocked(warmAudioUrl).mockClear();
    const hook = renderHook(() => useGameAudio());
    await flush();
    expect(vi.mocked(warmAudioUrl).mock.calls.map(([url]) => url)).toEqual([
      'https://x/ko1.mp3',
      'https://x/en.mp3',
    ]);
    act(() => hook.result.current.playCorrectSequence({ language: 'ko' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(playing()).toBe('ko1.mp3');
    end();
    expect(warmAudioUrl).toHaveBeenLastCalledWith('https://x/ko2.mp3');
    hook.unmount();
    fixture.sounds = {};
    random.mockRestore();
    vi.useRealTimers();
  });
  it('uses a richer response on the third success, resets after a retry and when leaving', () => {
    const spy = vi.spyOn(effects, 'emitLearningEffect').mockImplementation(() => {});
    const { result } = renderHook(() => useGameAudio());
    act(() => {
      result.current.playFeedbackSound(true);
      result.current.playFeedbackSound(true);
      result.current.playFeedbackSound(true);
      result.current.playFeedbackSound(false);
      result.current.playFeedbackSound(true);
    });
    expect(spy.mock.calls.map(([kind]) => kind)).toEqual([
      'correct',
      'correct',
      'streak',
      'retry',
      'correct',
    ]);
    act(() => {
      result.current.stopAll();
      result.current.playFeedbackSound(true);
    });
    expect(spy.mock.calls.at(-1)).toEqual(['correct']);
    spy.mockRestore();
  });
});

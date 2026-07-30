import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivitySound, REST_MS } from './useActivitySound';

const played: Array<{ url?: string; at: number }> = [];
let now = 0;

vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn(async () => 'blob:word') }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    // 소리는 즉시 끝난다고 본다 — 재는 건 길이가 아니라 **사이 간격**이다.
    playAudio: (url?: string, onEnded?: () => void) => {
      played.push({ url, at: now });
      onEnded?.();
    },
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => {
      played.push({ url: 'praise', at: now });
      o?.onDone?.();
    },
    praiseVisible: false,
    scheduleTimer: (fn: () => void, ms: number) => {
      now += ms;
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    },
  }),
}));

describe('useActivitySound', () => {
  beforeEach(() => {
    played.length = 0;
    now = 0;
  });

  /**
   * 🔴 활동 14개가 각자 복사한 체인을 갖고 있어 이 규칙이 8개에만 들어 있었다.
   *    훅이 규칙을 소유해야 다음 활동이 자동으로 지킨다.
   */
  it('소리와 띵동 사이에 쉼을 넣는다', async () => {
    const { result } = renderHook(() => useActivitySound({ unitId: 'u1', prefix: 'test' }));
    await act(() => result.current.sayThenChime('고기'));
    expect(played.map((p) => p.url)).toEqual(['blob:word', '/sounds/game/correct.mp3']);
    expect(played[1].at - played[0].at).toBeGreaterThanOrEqual(REST_MS);
  });

  it('띵동이 끝난 뒤에도 쉬고 다음으로 넘어간다', async () => {
    const { result } = renderHook(() => useActivitySound({ unitId: 'u1', prefix: 'test' }));
    const onDone = vi.fn();
    await act(() => result.current.sayThenChime('고기', { onDone }));
    expect(onDone).toHaveBeenCalled();
    expect(now).toBeGreaterThanOrEqual(REST_MS * 2);
  });

  // 🔴 칭찬 음원이 띵동을 겸한다 — 둘 다 내면 한 채널에서 앞소리가 잘린다.
  it('마지막 판은 띵동 없이 칭찬으로 간다', async () => {
    const { result } = renderHook(() => useActivitySound({ unitId: 'u1', prefix: 'test' }));
    await act(() => result.current.sayThenChime('고기', { praise: true }));
    expect(played.map((p) => p.url)).toEqual(['blob:word', 'praise']);
  });

  // 🔴 음원이 없어도 활동이 멈추면 안 된다.
  it('음원이 없어도 다음 단계로 잇는다', async () => {
    const { result } = renderHook(() => useActivitySound({ unitId: 'u1', prefix: 'test' }));
    const onDone = vi.fn();
    await act(() => result.current.sayThenChime('고기', { onDone, directUrl: '' }));
    expect(onDone).toHaveBeenCalled();
  });
});

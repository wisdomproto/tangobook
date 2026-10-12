import { StrictMode, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGameEntryGuide } from './useGameEntryGuide';

vi.mock('../../phonics-learner/components/ActivityShell', () => ({
  usePhonicsEmbedded: () => false,
}));
describe('게임 입장 안내', () => {
  it('StrictMode 재입장 때 다시 재생하며 옛 ended와 이탈 후 ended는 완료를 부르지 않는다', () => {
    const play = vi.fn((_url?: string, _ended?: () => void) => {});
    const done = vi.fn();
    const hook = renderHook(() => useGameEntryGuide('/guide.mp3', play, done), {
      wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
    });
    expect(play).toHaveBeenCalledTimes(2);
    act(() => play.mock.calls[0][1]?.());
    expect(done).not.toHaveBeenCalled();
    act(() => play.mock.calls[1][1]?.());
    expect(done).toHaveBeenCalledTimes(1);
    hook.rerender();
    expect(play).toHaveBeenCalledTimes(2);
    hook.unmount();
    act(() => play.mock.calls[1][1]?.());
    expect(done).toHaveBeenCalledTimes(1);
  });
});

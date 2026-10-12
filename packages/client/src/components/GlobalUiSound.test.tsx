import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalUiSound } from './GlobalUiSound';
const play = vi.hoisted(() => vi.fn());
vi.mock('@/lib/uiSound', () => ({ playUi: play, preloadUiSounds: vi.fn() }));
describe('learning touch sound delegation', () => {
  it('replaces the ordinary tap once, while preserving explicit overrides and disabled/muted controls', () => {
    play.mockClear();
    const view = render(
      <>
        <GlobalUiSound />
        <button data-learning-fx="tap">가</button>
        <button>일반</button>
        <button data-learning-fx="tap" data-sound="none">
          조용히
        </button>
        <button data-learning-fx="tap" data-sound="select">
          선택음
        </button>
        <button data-learning-fx="tap" disabled>
          잠김
        </button>
      </>
    );
    for (const name of ['가', '일반', '조용히', '선택음', '잠김'])
      fireEvent.pointerDown(view.getByText(name));
    expect(play.mock.calls.map(([name]) => name)).toEqual(['learning-tap', 'tap', 'select']);
    view.unmount();
    fireEvent.pointerDown(document.body);
    expect(play).toHaveBeenCalledTimes(3);
  });
});

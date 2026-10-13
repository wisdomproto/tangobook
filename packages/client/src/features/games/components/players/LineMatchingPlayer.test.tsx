import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { LineMatchingPlayer } from './LineMatchingPlayer';

const audio = vi.hoisted(() => ({
  done: undefined as (() => void) | undefined,
  mapRef: { current: new Map<string, string>() },
  log: vi.fn(),
}));
vi.mock('../../hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_url: string, cb?: () => void) => cb?.(),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => {
      audio.done = o?.onDone;
    },
    scheduleTimer: (cb: () => void, ms: number) => window.setTimeout(cb, ms),
    praiseVisible: false,
  }),
}));
vi.mock('../../hooks/useGameEntryGuide', () => ({ useGameEntryGuide: vi.fn() }));
vi.mock('../../hooks/usePhonicsMap', () => ({
  usePhonicsMap: () => ({ mapRef: audio.mapRef, loading: false }),
}));
vi.mock('../../hooks/useGamePrefetch', () => ({ warmAudioUrl: vi.fn() }));
vi.mock('@/features/storybook', () => ({ useStorybook: () => ({ data: undefined }) }));
vi.mock('@/features/learning', () => ({ useGameLogger: () => audio.log }));
vi.mock('../GameStyleChip', () => ({ useGameStyle: () => ({ selectedStyle: 'default' }) }));
vi.mock('../GamePlayerLayout', () => ({
  GamePlayerLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('../GameHeader', () => ({ GameHeader: () => null }));
vi.mock('../FeedbackOverlay', () => ({ FeedbackOverlay: () => null }));
vi.mock('./LineMatchingTutorial/LineMatchingTutorial', () => ({
  LineMatchingTutorial: () => null,
}));
vi.mock('../GameResultScreen', () => ({
  GameResultScreen: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>old result</button>
  ),
}));
beforeEach(() => {
  vi.useFakeTimers();
  audio.done = undefined;
  audio.log.mockClear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function match() {
  fireEvent.click(document.querySelector('[data-image-card="0"]')!);
  fireEvent.click(document.querySelector('[data-word-card="0"]')!);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}
const data = {
  type: 'english-line-matching' as const,
  items: [{ word: 'cat', imageUrl: 'cat.webp', ttsUrl: 'cat.mp3' }],
};
it('hands the final result to curriculum only after the last sound and praise', async () => {
  const done = vi.fn(),
    onComplete = vi.fn();
  render(
    <LineMatchingPlayer
      storybookId="en-b1-r1"
      difficulty="easy"
      gameData={data}
      lang="en"
      onComplete={onComplete}
      onBack={vi.fn()}
      onFinished={done}
    />
  );
  await match();
  expect(audio.done).toBeDefined();
  expect(done).not.toHaveBeenCalled();
  act(() => audio.done?.());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(done).toHaveBeenCalledExactlyOnceWith(1, 1);
  expect(onComplete).not.toHaveBeenCalled();
  expect(screen.queryByText('old result')).toBeNull();
  expect(audio.log).toHaveBeenCalledTimes(1);
});
it('keeps the original result and exit callback in free play', async () => {
  const onComplete = vi.fn(),
    back = vi.fn();
  render(
    <LineMatchingPlayer
      storybookId="book"
      difficulty="easy"
      gameData={data}
      lang="en"
      onComplete={onComplete}
      onBack={back}
    />
  );
  await match();
  act(() => audio.done?.());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(onComplete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'old result' }));
  expect(onComplete).toHaveBeenCalledExactlyOnceWith(1, 1);
  expect(back).toHaveBeenCalledTimes(1);
});

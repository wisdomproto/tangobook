import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AlphabetLetterWriteActivity } from './AlphabetLetterWriteActivity';
import { LetterWriteModal } from './LetterWriteModal';
import type { Storybook } from '@tangobook/shared';
const audio = vi.hoisted(() => ({
  ends: [] as Array<() => void>,
  errors: [] as Array<() => void>,
  play: vi.fn(),
  praise: vi.fn(),
}));
vi.mock('@/features/games/hooks/useGamePrefetch', () => ({
  warmAudioUrl: () => Promise.resolve(),
}));
vi.mock('@/features/phonics/components/StrokeTraceCanvas', () => ({
  StrokeTraceCanvas: ({
    letter,
    onResult,
  }: {
    letter: string;
    onResult: (ok: boolean, coverage: number) => void;
  }) => <button onClick={() => onResult(true, 1)}>{`획 ${letter}`}</button>,
}));
const book = {
  phonicsLesson: {
    wordFamilies: [
      {
        words: [
          { word: 'ice', ttsUrl: 'ice.mp3' },
          { word: 'igloo', ttsUrl: 'igloo.mp3' },
        ],
      },
    ],
  },
} as unknown as Storybook;
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybook: () => ({
    data: {
      phonicsLesson: {
        wordFamilies: [
          {
            words: [
              { word: 'ice', ttsUrl: 'ice.mp3' },
              { word: 'igloo', ttsUrl: 'igloo.mp3' },
            ],
          },
        ],
      },
    },
  }),
}));
vi.mock('../lib/phonics-game-adapter', () => ({
  findImageData: (_book: unknown, word: string) => ({ imageUrl: `/${word}.webp` }),
}));
vi.mock('../hooks/useEntryGuide', () => ({
  useEntryGuide: vi.fn(),
  ENTRY_GUIDE: { writeTrace: '' },
  praiseLang: () => 'ko',
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (url: string, ended: () => void, failed: () => void) => {
      audio.play(url);
      if (ended) audio.ends.push(ended);
      if (failed) audio.errors.push(failed);
    },
    playCorrectSequence: ({ onDone }: { onDone: () => void }) => {
      audio.praise();
      onDone();
    },
    scheduleTimer: (fn: () => void, ms: number) => setTimeout(fn, ms),
    praiseVisible: false,
  }),
}));
afterEach(() => {
  vi.clearAllMocks();
  audio.ends = [];
  audio.errors = [];
  vi.useRealTimers();
});
it('완성 글자를 먼저 유지하며 두 칸을 빠르게 완성해도 낱말 음원 두 개가 순서대로 끝난 뒤에만 이동한다', () => {
  vi.useFakeTimers();
  const complete = vi.fn(),
    finish = vi.fn();
  render(
    <AlphabetLetterWriteActivity
      unitId="en-b1-test"
      letters={['I']}
      onMarkComplete={complete}
      onFinish={finish}
      onBack={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '획 I' }));
  fireEvent.click(screen.getByRole('button', { name: '획 i' }));
  expect(screen.getByRole('button', { name: '획 I' })).toBeVisible();
  expect(screen.getByRole('button', { name: '획 i' })).toBeVisible();
  expect(screen.queryByRole('img', { name: 'ice' })).toBeNull();
  act(() => vi.advanceTimersByTime(1399));
  expect(audio.play).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('img', { name: 'ice' })).toBeVisible();
  expect(audio.play).toHaveBeenLastCalledWith('ice.mp3');
  expect(audio.play).toHaveBeenCalledTimes(1);
  act(() => audio.ends.shift()?.());
  expect(complete).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(2400));
  expect(audio.play).toHaveBeenLastCalledWith('igloo.mp3');
  expect(complete).not.toHaveBeenCalled();
  act(() => audio.ends.shift()?.());
  expect(complete).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1000));
  expect(complete).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenCalledTimes(1);
});
it('음성 오류는 완료로 건너뛰지 않고 다시 듣기 재생 성공 후 이어진다', () => {
  vi.useFakeTimers();
  const complete = vi.fn();
  render(
    <AlphabetLetterWriteActivity
      unitId="en-b1-test"
      letters={['I']}
      onMarkComplete={complete}
      onBack={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '획 I' }));
  act(() => vi.advanceTimersByTime(1400));
  act(() => audio.errors.shift()?.());
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '다시 듣기' }));
  expect(audio.play).toHaveBeenCalledTimes(2);
  expect(audio.play).toHaveBeenLastCalledWith('ice.mp3');
  act(() => audio.ends.at(-1)?.());
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole('button', { name: '다시 듣기' })).toBeNull();
  expect(complete).not.toHaveBeenCalled();
});
it('써보기 모달도 대소문자 획 완료 후 한번만 닫히며 상태 변경으로 타이머가 취소되지 않는다', () => {
  vi.useFakeTimers();
  const close = vi.fn();
  render(<LetterWriteModal storybook={book} letterIndex={0} activeLetter="I" onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: '획 I' }));
  fireEvent.click(screen.getByRole('button', { name: '획 i' }));
  expect(close).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1250));
  expect(close).toHaveBeenCalledTimes(1);
});

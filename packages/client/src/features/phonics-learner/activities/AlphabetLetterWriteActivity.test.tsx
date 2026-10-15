import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AlphabetLetterWriteActivity } from './AlphabetLetterWriteActivity';
import { LetterWriteModal } from './LetterWriteModal';
import type { Storybook } from '@tangobook/shared';
const audio = vi.hoisted(() => ({ ends: [] as Array<() => void>, play: vi.fn(), praise: vi.fn() }));
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
    playAudio: (url: string, ended: () => void) => {
      audio.play(url);
      if (ended) audio.ends.push(ended);
    },
    playCorrectSequence: ({ onDone }: { onDone: () => void }) => {
      audio.praise();
      onDone();
    },
    scheduleTimer: (fn: () => void) => fn(),
    praiseVisible: false,
  }),
}));
afterEach(() => {
  vi.clearAllMocks();
  audio.ends = [];
  vi.useRealTimers();
});
it('대소문자 실제 획 완료가 각각 그림을 열고 마지막 낱말 음원 뒤에만 이동한다', () => {
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
  expect(screen.queryByRole('button', { name: '획 I' })).toBeNull();
  expect(screen.getByRole('button', { name: '획 i' })).toBeVisible();
  expect(audio.play).toHaveBeenLastCalledWith('ice.mp3');
  act(() => audio.ends.shift()?.());
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '획 i' }));
  expect(audio.play).toHaveBeenLastCalledWith('igloo.mp3');
  expect(complete).not.toHaveBeenCalled();
  act(() => audio.ends.shift()?.());
  expect(complete).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenCalledTimes(1);
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

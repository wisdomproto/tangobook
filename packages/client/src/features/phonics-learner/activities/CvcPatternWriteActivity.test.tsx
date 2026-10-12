import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CvcPatternWriteActivity } from './CvcPatternWriteActivity';

const mocks = vi.hoisted(() => ({
  tts: vi.fn(async () => 'blob:word'),
  audio: vi.fn((_url?: string, _ended?: () => void) => {}),
  timer: (fn: () => void, ms: number) => setTimeout(fn, ms),
  stop: vi.fn(),
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: mocks.tts }));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybook: () => ({
    data: {
      flashcards: [
        { word: 'can', phonicPattern: '_an' },
        { word: 'fan', phonicPattern: '_an' },
      ],
    },
  }),
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: mocks.audio,
    scheduleTimer: mocks.timer,
    stopAll: mocks.stop,
    playCorrectSequence: (o: { onDone?: () => void }) => o.onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/useEntryGuide', () => ({
  useEntryGuide: vi.fn(),
  ENTRY_GUIDE: { write: '' },
  praiseLang: () => 'en',
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('@/features/phonics/components/LetterFillCanvas', () => ({
  LetterFillCanvas: ({
    letter,
    onResult,
  }: {
    letter: string;
    onResult: (passed: boolean) => void;
  }) => <button onClick={() => onResult(true)}>{letter} 완료</button>,
}));
const props = {
  unitId: 'en-b2-u01',
  pattern: { vowel: 'a', consonant: 'n', vc: 'an' },
  onMarkComplete: vi.fn(),
  onBack: vi.fn(),
};
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('영어 CVC 쓰기 반응', () => {
  it('음원 응답 대기 중에도 다음 캔버스를 즉시 열고, 확인음 ended 후 완성 낱말을 읽는다', async () => {
    vi.useFakeTimers();
    mocks.tts.mockImplementationOnce(() => new Promise(() => {}));
    render(<CvcPatternWriteActivity {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'c 완료' }));
    expect(screen.getByRole('button', { name: 'a 완료' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'a 완료' }));
    fireEvent.click(screen.getByRole('button', { name: 'n 완료' }));
    const ended = mocks.audio.mock.calls.at(-1)?.[1];
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mocks.audio.mock.calls.some(([url]) => url === 'blob:word')).toBe(false);
    await act(async () => ended?.());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });
    expect(mocks.audio.mock.calls.at(-1)?.[0]).toBe('blob:word');
    expect(screen.queryByRole('button', { name: 'f 완료' })).toBeNull();
    await act(async () => mocks.audio.mock.calls.at(-1)?.[1]?.());
    expect(screen.getByRole('button', { name: 'f 완료' })).toBeEnabled();
  });

  it('다른 낱말 선택 후 옛 URL 응답과 ended는 재생을 되살리지 않는다', async () => {
    vi.useFakeTimers();
    let resolve!: (url: string) => void;
    mocks.tts.mockImplementationOnce(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        })
    );
    render(<CvcPatternWriteActivity {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'c 완료' }));
    const ended = mocks.audio.mock.calls.at(-1)?.[1];
    fireEvent.click(screen.getByRole('button', { name: 'fan' }));
    await act(async () => {
      ended?.();
      resolve('blob:stale');
      await vi.advanceTimersByTimeAsync(430);
    });
    expect(screen.getByRole('button', { name: 'f 완료' })).toBeEnabled();
    expect(mocks.audio.mock.calls.some(([url]) => url === 'blob:stale')).toBe(false);
  });
});

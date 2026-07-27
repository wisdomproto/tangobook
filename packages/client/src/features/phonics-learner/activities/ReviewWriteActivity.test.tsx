import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ReviewWriteActivity } from './ReviewWriteActivity';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn(async () => 'blob:tts') }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_u: string, e?: () => void) => e?.(),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => o?.onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));

const SOURCES: ReviewCardSource[] = [
  {
    unitId: 'u1',
    letter: 'ㄱ',
    syllable: '가',
    sound: 'ㄱ',
    matchPosition: 'cho',
    word: '고기',
    imageUrl: 'https://example.test/고기.webp',
  },
];

afterEach(() => vi.useRealTimers());

describe('ReviewWriteActivity 힌트', () => {
  it('한동안 못 쓰면 힌트가 뜬다', () => {
    // 🔴 예전엔 "3회 실패 시" 였는데 LetterFillCanvas 가 실패를 알리지 않아 영영 안 떴다.
    vi.useFakeTimers();
    render(
      <ReviewWriteActivity unitId="u1" sources={SOURCES} onComplete={vi.fn()} onBack={vi.fn()} />
    );

    expect(screen.queryByText('힌트')).toBeNull();
    act(() => void vi.advanceTimersByTime(12_000));
    expect(screen.getByText(/힌트/)).toBeTruthy();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('ReviewWriteActivity', () => {
  // 🔴 음소 한 글자(ㄱ)가 아니라 **낱말 전체**(고기)를 쓴다 — 그림은 고기인데 손은 ㄱ 하나만
  //    쓰던 시절엔 그림과 과제가 따로 놀았다. 캔버스가 글자 수만큼 칸을 만든다.
  it('낱말 전체를 글자 수만큼 쓴다', () => {
    render(
      <ReviewWriteActivity unitId="u1" sources={SOURCES} onComplete={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText(/0\/2/)).toBeTruthy(); // 고기 = 2글자
    expect(screen.getByAltText('고기')).toBeTruthy();
  });
});

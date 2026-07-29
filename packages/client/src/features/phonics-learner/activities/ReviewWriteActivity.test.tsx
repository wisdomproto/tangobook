import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewWriteActivity } from './ReviewWriteActivity';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

const resolveTtsUrl = vi.fn(async () => 'blob:tts');
const playAudio = vi.fn((_u?: string, e?: () => void) => e?.());

vi.mock('@/features/tts', () => ({ resolveTtsUrl: (o: unknown) => resolveTtsUrl(o as never) }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (u?: string, e?: () => void) => playAudio(u, e),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => o?.onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
/** 캔버스는 실제로 칠할 수 없으니 콜백만 노출한다 — 이 활동이 무엇을 넘겼는지가 검사 대상이다. */
vi.mock('@/features/phonics/components/WordFillCanvas', () => ({
  WordFillCanvas: ({
    syllables,
    onSyllableDone,
  }: {
    syllables: string[];
    onSyllableDone?: (s: string, i: number) => void;
  }) => (
    <div>
      <span>{`0/${syllables.length}`}</span>
      <button onClick={() => onSyllableDone?.(syllables[0], 0)}>첫 글자 완성</button>
    </div>
  ),
}));

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

  /**
   * 🔴 한 글자를 다 써도 **아무 소리가 안 났다**(2026-07-29). `onSyllableDone` 을 안 넘겨서
   *    낱말쓰기 게임에는 있는 배선이 이 활동에만 빠져 있었고, 화면만 봐선 안 보이는 구멍이었다.
   */
  it('한 글자를 다 쓰면 거기까지 이어읽는다', async () => {
    resolveTtsUrl.mockClear();
    playAudio.mockClear();
    render(
      <ReviewWriteActivity unitId="u1" sources={SOURCES} onComplete={vi.fn()} onBack={vi.fn()} />
    );
    fireEvent.click(screen.getByText('첫 글자 완성'));
    await waitFor(() =>
      expect(resolveTtsUrl).toHaveBeenCalledWith(expect.objectContaining({ text: '고' }))
    );
    // 띵동 먼저, 그 다음 읽기 — 한 채널이라 순서가 곧 들리는 결과다.
    await waitFor(() => expect(playAudio.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(playAudio.mock.calls[0][0]).toContain('correct.mp3');
    expect(playAudio.mock.calls[1][0]).toBe('blob:tts');
  });
});

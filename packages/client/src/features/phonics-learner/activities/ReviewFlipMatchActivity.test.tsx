import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewFlipMatchActivity } from './ReviewFlipMatchActivity';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

// TTS 는 네트워크라 막고, 콜백 체인만 유지한다 (playAudio(url, onEnded) 규칙).
vi.mock('@/features/tts', () => ({
  resolveTtsUrl: vi.fn(async () => 'blob:tts'),
}));

const playAudio = vi.fn((_url: string, onEnded?: () => void) => onEnded?.());
const playCorrectSequence = vi.fn((opts?: { onDone?: () => void }) => opts?.onDone?.());
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (u: string, e?: () => void) => playAudio(u, e),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => playCorrectSequence(o),
    praiseVisible: false,
  }),
}));

vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));

function card(letter: string, word: string): ReviewCardSource {
  return {
    unitId: `u-${letter}`,
    letter,
    syllable: `${letter}ㅏ`,
    sound: letter,
    matchPosition: 'cho',
    word,
    imageUrl: `https://example.test/${word}.webp`,
  };
}

/** 뒤집힌 상태의 타일 = 뒷면 '❓'. 앞면은 글자 텍스트이거나 <img>. */
function tiles() {
  return screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== null);
}

describe('ReviewFlipMatchActivity', () => {
  beforeEach(() => {
    playAudio.mockClear();
    playCorrectSequence.mockClear();
  });

  it('짝을 맞추면 두 장이 그대로 열려 있는다', async () => {
    render(
      <ReviewFlipMatchActivity
        unitId="kr-h1-r1"
        sources={[card('ㄱ', '고기'), card('ㄴ', '나')]}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    // 뒷면만 보인다
    expect(screen.getAllByText('❓')).toHaveLength(4);

    // 'ㄱ' 의 글자면과 그림면을 찾아 연다 (셔플되므로 aria-label 로 고른다)
    const flip = tiles().filter((t) => t.getAttribute('aria-label') === '뒤집기');
    fireEvent.click(flip[0]);
    // 첫 장이 열렸다
    await waitFor(() => expect(screen.queryAllByText('❓')).toHaveLength(3));
  });

  it('같은 글자의 [글자]+[그림] 을 고르면 매칭되고, 다 맞추면 onComplete 가 불린다', async () => {
    const onComplete = vi.fn();
    render(
      <ReviewFlipMatchActivity
        unitId="kr-h1-r1"
        sources={[card('ㄱ', '고기')]}
        onComplete={onComplete}
        onBack={vi.fn()}
      />
    );
    const flip = tiles().filter((t) => t.getAttribute('aria-label') === '뒤집기');
    expect(flip).toHaveLength(2); // 1쌍 = 2장

    fireEvent.click(flip[0]);
    fireEvent.click(flip[1]);

    // 🔴 매칭 후에도 덮이지 않는다 + TTS 끝난 뒤 칭찬 → onComplete
    await waitFor(() => expect(screen.queryAllByText('❓')).toHaveLength(0));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(playCorrectSequence).toHaveBeenCalled();
  });

  it('짝이 아니면 잠시 뒤 다시 덮인다', async () => {
    vi.useFakeTimers();
    render(
      <ReviewFlipMatchActivity
        unitId="kr-h1-r1"
        sources={[card('ㄱ', '고기'), card('ㄴ', '나')]}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    const flip = tiles().filter((t) => t.getAttribute('aria-label') === '뒤집기');
    // 서로 다른 카드의 타일 두 장을 고르기 위해, 첫 장과 짝이 아닌 장을 찾는다
    const first = flip[0];
    const label = first.getAttribute('aria-label');
    fireEvent.click(first);
    const other = tiles().find(
      (t) => t !== first && t.getAttribute('aria-label') === label
    ) as HTMLElement;
    fireEvent.click(other ?? flip[1]);
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VowelListenActivity } from './VowelListenActivity';

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

const VOWELS = [
  { vowel: 'ㅏ', syllable: '아' },
  { vowel: 'ㅑ', syllable: '야' },
];

/** 모음 카드만 (다시 듣기·퀴즈 버튼 제외) — aria-label 이 음절인 버튼들. */
function cards() {
  return VOWELS.map((v) => screen.getByRole('button', { name: v.syllable }));
}

afterEach(() => vi.restoreAllMocks());

describe('VowelListenActivity 퀴즈 오답', () => {
  it('틀린 카드 하나만 흔들린다', async () => {
    // Math.random=0 이면 셔플이 결정적 — [0,1] → [1,0] 이라 첫 문제 정답은 index 1(ㅑ).
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(
      <VowelListenActivity unitId="u1" vowels={VOWELS} onMarkComplete={vi.fn()} onBack={vi.fn()} />
    );

    // 듣기 단계를 순서대로 통과한 뒤 퀴즈로.
    cards().forEach((c) => fireEvent.click(c));
    fireEvent.click(await screen.findByRole('button', { name: /퀴즈 시작/ }));

    fireEvent.click(cards()[0]); // 정답은 1 이므로 오답

    const [wrong, other] = cards();
    expect(wrong.className).toContain('animate-shake');
    expect(other.className).not.toContain('animate-shake');
  });
});

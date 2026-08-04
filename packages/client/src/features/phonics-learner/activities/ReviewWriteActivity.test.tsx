import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewWriteActivity } from './ReviewWriteActivity';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

const resolveTtsUrl = vi.fn(async (_o?: unknown) => 'blob:tts');
const playAudio = vi.fn((_u?: string, e?: () => void) => e?.());

vi.mock('@/features/tts', () => ({ resolveTtsUrl: (o: unknown) => resolveTtsUrl(o) }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (u?: string, e?: () => void) => playAudio(u, e),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => o?.onDone?.(),
    praiseVisible: false,
    // 소리 사이 쉼 — 테스트에선 기다리지 않고 바로 잇는다(재는 건 순서다).
    scheduleTimer: (fn: () => void) => {
      fn();
      return 0;
    },
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
/** 캔버스는 실제로 칠할 수 없으니 콜백만 노출한다 — 이 활동이 무엇을 넘겼는지가 검사 대상이다. */
vi.mock('@/features/phonics/components/WordFillCanvas', () => ({
  WordFillCanvas: ({
    syllables,
    onSyllableDone,
    onComplete,
  }: {
    syllables: string[];
    onSyllableDone?: (s: string, i: number) => void;
    onComplete?: () => void;
  }) => (
    <div>
      <span>{`0/${syllables.length}`}</span>
      <button onClick={() => onSyllableDone?.(syllables[0], 0)}>첫 글자 완성</button>
      <button onClick={() => onComplete?.()}>낱말 완성</button>
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
    // 🔴 진입 안내(`/sounds/voice/*`)는 빼고 본다 — 인덱스로 세면 안내가 생길 때마다 깨진다.
    const chain = () =>
      playAudio.mock.calls.map((c) => String(c[0])).filter((u) => !u.includes('/sounds/voice/'));
    await waitFor(() => expect(chain().length).toBeGreaterThanOrEqual(2));
    expect(chain()[0]).toContain('correct.mp3');
    expect(chain()[1]).toBe('blob:tts');
  });

  /**
   * 🔴 진입 안내 **없음**(2026-08-02 사용자: "글자 쓰기에서 멘트 없애"). 예전엔 `write-start-ko`
   *    ("반짝이는 칸에 써 봐!")를 냈는데, 이 화면엔 반짝이는 칸이 없어 멘트가 어긋났다. 캔버스에 뜬
   *    글자가 곧 문제라 안내가 필요 없다. → 진입 시 `/sounds/voice/` 안내를 하나도 내지 않는다.
   */
  it('들어오면 안내 음성을 내지 않는다', () => {
    playAudio.mockClear();
    render(
      <ReviewWriteActivity unitId="u1" sources={SOURCES} onComplete={vi.fn()} onBack={vi.fn()} />
    );
    const guides = playAudio.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes('/sounds/voice/'));
    expect(guides).toHaveLength(0);
  });

  /**
   * 🔴 낱말을 다 쓰면 **즉시 잠긴다** — 캔버스가 완성 글자로 바뀌어 소리 나는 동안 다시 못 쓴다
   *    (사용자: "멘트 읽어주는 동안 그 글자 다시 쓰게 돼있어. 그냥 정답처리 해야지").
   */
  it('낱말을 완성하면 캔버스가 잠긴다(다시 못 씀)', () => {
    render(
      <ReviewWriteActivity unitId="u1" sources={SOURCES} onComplete={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('낱말 완성')).toBeTruthy();
    fireEvent.click(screen.getByText('낱말 완성'));
    // 캔버스(그리고 그 버튼들)가 사라지고 완성 글자 + ✓ 만 남는다.
    expect(screen.queryByText('낱말 완성')).toBeNull();
    expect(screen.queryByText('첫 글자 완성')).toBeNull();
    expect(screen.getByText('✓')).toBeTruthy();
  });
});

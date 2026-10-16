import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { VowelListenActivity } from './VowelListenActivity';

const spies = vi.hoisted(() => ({
  tts: vi.fn(async (): Promise<string | undefined> => 'blob:tts'),
  praise: vi.fn(),
  log: vi.fn(),
  holdSound: false,
  soundEnded: undefined as (() => void) | undefined,
  holdPraise: false,
  praiseEnded: undefined as (() => void) | undefined,
}));

vi.mock('@/features/tts', () => ({ resolveTtsUrl: spies.tts }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (u: string, e?: () => void) => {
      if (spies.holdSound && u === 'blob:tts') spies.soundEnded = e;
      else e?.();
    },
    playFeedbackSound: vi.fn(),
    playCorrectSequence: (o?: { onDone?: () => void }) => {
      spies.praise();
      if (spies.holdPraise) spies.praiseEnded = o?.onDone;
      else o?.onDone?.();
    },
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
// 모음 퀴즈 판정을 학습 이벤트로 남기므로 로거를 세운다(AuthProvider 없이 렌더하기 위해).
vi.mock('@/features/learning/hooks/useLogEvent', () => ({ useLogEvent: () => spies.log }));

const VOWELS = [
  { vowel: 'ㅏ', syllable: '아' },
  { vowel: 'ㅑ', syllable: '야' },
];

/** 모음 카드만 (다시 듣기·퀴즈 버튼 제외) — aria-label 이 음절인 버튼들. */
function cards() {
  return VOWELS.map((v) => screen.getByRole('button', { name: v.syllable }));
}

afterEach(() => {
  vi.restoreAllMocks();
  spies.praise.mockClear();
  spies.tts.mockClear();
  spies.log.mockClear();
  spies.holdSound = false;
  spies.soundEnded = undefined;
  spies.holdPraise = false;
  spies.praiseEnded = undefined;
});

describe('단일 모음 팝잇', () => {
  it('팝잇은 듣고 고르기 퀴즈/정오답을 만들지 않고, 마지막 소리와 칭찬 뒤 쓰기를 연다', async () => {
    spies.holdSound = true;
    spies.holdPraise = true;
    const done = vi.fn(),
      next = vi.fn();
    render(
      <VowelListenActivity
        unitId="kr-v1-u02"
        vowels={[VOWELS[1]]}
        onMarkComplete={done}
        onNext={next}
        onBack={vi.fn()}
      />
    );
    screen.getAllByRole('button', { name: /ㅑ 방울/ }).forEach((b) => fireEvent.click(b));
    await waitFor(() => expect(spies.tts).toHaveBeenCalledTimes(1));
    act(() => spies.soundEnded?.());
    await waitFor(() => expect(spies.tts).toHaveBeenCalledTimes(2));
    act(() => spies.soundEnded?.());
    await waitFor(() => expect(spies.praise).toHaveBeenCalledTimes(1));
    expect(done).not.toHaveBeenCalled();
    act(() => spies.praiseEnded?.());
    expect(done).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /퀴즈/ })).toBeNull();
    expect(spies.log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '써보기 →' }));
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('VowelListenActivity 듣기 단계', () => {
  it('한 바퀴 돌면 아무 카드나 소리가 나고, 칭찬은 다시 안 울린다', async () => {
    render(
      <VowelListenActivity unitId="u1" vowels={VOWELS} onMarkComplete={vi.fn()} onBack={vi.fn()} />
    );

    cards().forEach((c) => fireEvent.click(c)); // 순서대로 한 바퀴
    await screen.findByText(/이제 퀴즈를/);
    expect(spies.praise).toHaveBeenCalledTimes(1);

    // 🔴 예전엔 `nextIdx` 가 마지막에 멈춰 있어서 다른 카드는 무음이고 마지막 카드만
    //    완료 분기로 다시 들어가 칭찬이 또 울렸다.
    spies.tts.mockClear();
    fireEvent.click(cards()[0]);
    await waitFor(() =>
      expect(spies.tts).toHaveBeenCalledWith(expect.objectContaining({ text: 'ㅏ' }))
    );

    fireEvent.click(cards()[VOWELS.length - 1]); // 마지막 카드 = 예전 재정답 지점
    await waitFor(() =>
      expect(spies.tts).toHaveBeenCalledWith(expect.objectContaining({ text: 'ㅑ' }))
    );
    expect(spies.praise).toHaveBeenCalledTimes(1);
  });
});

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

    // 🔴 첫 문제는 안내 음성("잘 듣고 맞춰봐!")이 끝난 뒤에 나온다 — 그동안은 탭도 안 받는다.
    expect(screen.getByText(/잘 듣고 맞춰봐/)).toBeTruthy();
    await screen.findByText(/들리는 소리를 골라봐/);

    fireEvent.click(cards()[0]); // 정답은 1 이므로 오답

    const [wrong, other] = cards();
    expect(wrong.className).toContain('animate-shake');
    expect(other.className).not.toContain('animate-shake');
  });
});

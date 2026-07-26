import { useCallback, useMemo, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

interface Props {
  unitId: string;
  consonant: string; // 'ㄱ'
  /**
   * 발음할 텍스트. 미지정이면 `consonant` 를 그대로 읽는다.
   * 🔴 받침 단원은 화면 글자와 소리가 다르다 — 글자는 'ㅇ' 이지만 홀로 소리 낼 수 없어 예시 음절 '앙' 을 읽는다.
   */
  soundText?: string;
  /**
   * 단원의 타겟 단어(그림 있는 것). 카드마다 하나씩 **무작위로** 붙고, 세 번째 탭에서 그 단어를 읽는다.
   * 없으면 글자만 있는 예전 화면 그대로.
   */
  words?: ReadonlyArray<{ word: string; imageUrl: string; ttsUrl?: string }>;
  onComplete: () => void;
  onBack: () => void;
}

const TAPS_PER_CARD = 3;
const CARDS = 3;

/**
 * 자음 누르기 액티비티 (unit 2 활동 1).
 *
 * 3개의 자음 버튼 (ㄱ). 각 버튼을 3번 누르면 그 카드 완료.
 *   - 매 탭 → "ㄱ" 발음
 *   - 각 카드 3 탭 완료 → ㄱ TTS 끝난 후 띵동 효과음 (per-card 완료 피드백)
 *   - 3 카드 모두 9 탭 완료 → 띵동 끝난 후 칭찬 시퀀스 chain
 */
export function ConsonantTapActivity({
  unitId,
  consonant,
  soundText,
  words = [],
  onComplete,
  onBack,
}: Props) {
  const [tapCounts, setTapCounts] = useState<number[]>(Array(CARDS).fill(0));
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [completed, setCompleted] = useState(false);
  const say = soundText ?? consonant;

  // 카드별 단어 — 마운트 때 한 번만 뽑는다(리렌더마다 섞이면 그림이 춤춘다).
  // 단어가 3개보다 적으면 돌려 쓴다.
  const cardWords = useMemo(() => {
    if (!words.length) return [];
    const pool = [...words];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return Array.from({ length: CARDS }, (_, i) => pool[i % pool.length]);
  }, [words]);

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => [say, ...cardWords.map((w) => w.word)], [say, cardWords]),
    'consonant-tap'
  );

  const handleTap = useCallback(
    async (idx: number) => {
      if (completed) return;
      const cur = tapCounts[idx] ?? 0;
      if (cur >= TAPS_PER_CARD) return;
      const next = cur + 1;
      const nextTaps = tapCounts.map((c, i) => (i === idx ? next : c));
      setTapCounts(nextTaps);

      const isCardComplete = next === TAPS_PER_CARD;
      // 🔴 세 번째 탭은 **그 카드의 단어**를 읽는다 — 기존 "ㄱ ㄱ 고기" 규칙과 같은 리듬.
      const card = cardWords[idx];
      const text = isCardComplete && card ? card.word : say;
      const url =
        (isCardComplete && card?.ttsUrl) ||
        (await resolveTtsUrl({
          text,
          language: 'korean',
          storybookId: unitId,
          identifierPrefix: 'consonant-tap',
        }));

      const isAllDone = nextTaps.every((c) => c >= TAPS_PER_CARD);

      if (isCardComplete) {
        // 카드 3 탭 완료: ㄱ TTS → 띵동 (per-card). 마지막 카드면 추가로 띵동 끝나면 칭찬.
        if (isAllDone) setCompleted(true);
        const afterChime = isAllDone
          ? () => playCorrectSequence({ language: 'ko', onDone: onComplete })
          : undefined;
        const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
        if (url) {
          playAudio(url, playChime);
        } else {
          playChime();
        }
        return;
      }

      if (url) playAudio(url);
    },
    [completed, tapCounts, say, cardWords, unitId, playAudio, playCorrectSequence, onComplete]
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 overflow-hidden"
      style={{
        backgroundImage: "url('/images/phonics/study-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-ink-900 text-center break-keep">
          <span className="text-coral-600">{consonant}</span> 을 세 번씩 눌러봐!
        </h2>

        <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
          {Array.from({ length: CARDS }).map((_, i) => {
            const taps = tapCounts[i] ?? 0;
            const done = taps >= TAPS_PER_CARD;
            const word = cardWords[i];
            return (
              <button
                key={i}
                onClick={() => handleTap(i)}
                disabled={done}
                className={[
                  'relative rounded-3xl border-[5px] aspect-square overflow-hidden flex flex-col items-center justify-center shadow-soft transition',
                  done
                    ? 'bg-success/15 border-success'
                    : 'bg-white border-coral-300 hover:shadow-pop active:scale-[0.96]',
                ].join(' ')}
                aria-label={done && word ? word.word : `${consonant} ${i + 1}번 카드`}
              >
                {/* 🔴 글자와 그림을 **한 카드에 같이 두지 않는다** — 셋(글자·그림·낱말)을 욱여넣으면
                    카드가 지저분하고 375px 에선 그림이 눌려 사라진다. 세 번 다 누르면
                    글자가 빠지고 **그림이 카드를 꽉 채운다** — 보상처럼 열리는 화면. */}
                {done && word ? (
                  <img
                    src={word.imageUrl}
                    alt={word.word}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="text-6xl sm:text-7xl md:text-8xl font-black text-coral-600 leading-none">
                      {consonant}
                    </div>
                    {/* 진행 dots */}
                    <div className="absolute bottom-3 flex gap-1.5">
                      {Array.from({ length: TAPS_PER_CARD }).map((_, k) => (
                        <span
                          key={k}
                          className={`w-2.5 h-2.5 rounded-full ${k < taps ? 'bg-coral-500' : 'bg-cream-200'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {done && (
                  <span className="absolute top-2 right-2 w-9 h-9 rounded-full bg-success text-white ring-4 ring-white flex items-center justify-center text-xl font-black">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

import { useCallback, useState } from 'react';
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
export function ConsonantTapActivity({ unitId, consonant, soundText, onComplete, onBack }: Props) {
  const [tapCounts, setTapCounts] = useState<number[]>(Array(CARDS).fill(0));
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [completed, setCompleted] = useState(false);
  const say = soundText ?? consonant;

  usePhonicsTtsWarm(unitId, [say], 'consonant-tap');

  const handleTap = useCallback(
    async (idx: number) => {
      if (completed) return;
      const cur = tapCounts[idx] ?? 0;
      if (cur >= TAPS_PER_CARD) return;
      const next = cur + 1;
      const nextTaps = tapCounts.map((c, i) => (i === idx ? next : c));
      setTapCounts(nextTaps);

      const url = await resolveTtsUrl({
        text: say,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-tap',
      });

      const isCardComplete = next === TAPS_PER_CARD;
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
    [completed, tapCounts, say, unitId, playAudio, playCorrectSequence, onComplete]
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
            return (
              <button
                key={i}
                onClick={() => handleTap(i)}
                disabled={done}
                className={[
                  'relative rounded-3xl border-[5px] aspect-square flex flex-col items-center justify-center shadow-soft transition',
                  done
                    ? 'bg-success/15 border-success'
                    : 'bg-white border-coral-300 hover:shadow-pop active:scale-[0.96]',
                ].join(' ')}
                aria-label={`${consonant} ${i + 1}번 카드`}
              >
                <div className="text-6xl sm:text-7xl md:text-8xl font-black text-coral-600">
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
                {done && (
                  <span className="absolute top-2 right-2 text-success-700 text-2xl">✓</span>
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

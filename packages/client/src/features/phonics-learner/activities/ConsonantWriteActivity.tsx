import { useCallback, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';

interface Props {
  unitId: string;
  consonant: string;
  onComplete: () => void;
  onBack: () => void;
}

const TIMES = 3;

/**
 * 자음 쓰기 액티비티 (unit 2 활동 4).
 *
 * 단순화 (2026-05-20): 단어 없이 ㄱ 만 N번 따라쓰기.
 *   - 매 통과 → ㄱ TTS → 띵동 (per-write 피드백) → 다음 슬롯 (캔버스 리셋)
 *   - N 회 통과 → ㄱ TTS → 띵동 → 칭찬 시퀀스
 *
 * 이전: storybook 단어 카드 3개 기반 → 단어 의존성 + UI 복잡. 사용자 단순화 요청.
 */
export function ConsonantWriteActivity({ unitId, consonant, onComplete, onBack }: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [completedCount, setCompletedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (!passed || completed) return;
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);

      const url = await resolveTtsUrl({
        text: consonant,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-write',
      });

      const isAllDone = nextCount >= TIMES;
      if (isAllDone) setCompleted(true);

      // TTS → 띵동 → (전체 완료면 칭찬)
      const afterChime = isAllDone
        ? () => playCorrectSequence({ language: 'ko', onDone: onComplete })
        : undefined;
      const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
      if (url) {
        playAudio(url, playChime);
      } else {
        playChime();
      }
    },
    [completed, completedCount, consonant, unitId, playAudio, playCorrectSequence, onComplete]
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

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-ink-900 text-center break-keep">
          ✏️ <span className="text-coral-600">{consonant}</span> 을 세 번 따라써봐!
        </h2>

        {/* 진행 dots — 3 슬롯 */}
        <div className="flex gap-2 sm:gap-3">
          {Array.from({ length: TIMES }).map((_, i) => {
            const done = i < completedCount;
            return (
              <span
                key={i}
                className={[
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm sm:text-base shadow-soft transition',
                  done
                    ? 'bg-success text-white'
                    : i === completedCount
                      ? 'bg-coral-500 text-white ring-4 ring-coral-200 animate-pulse'
                      : 'bg-white text-ink-400',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </span>
            );
          })}
        </div>

        <LetterFillCanvas
          key={`write-${completedCount}`}
          letter={consonant}
          onResult={handleResult}
          autoCheck
          threshold={0.95}
        />
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

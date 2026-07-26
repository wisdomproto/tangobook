import { useCallback, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

interface Props {
  unitId: string;
  sources: ReadonlyArray<ReviewCardSource>;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 복습 — 그림을 보고 첫 글자 쓰기.
 *
 * 카드 하나당 [그림] + [쓰기 캔버스]. 통과 → 그 글자 소리 → 띵동 → 다음 그림.
 * 마지막까지 쓰면 칭찬 + onComplete.
 *
 * 🔴 4~7세라 화면에 글자를 미리 보여주지 않는다 — 그림이 곧 문제다.
 *    대신 세 번 실패하면 힌트(회색 글자)를 띄워 막히지 않게 한다.
 */
const HINT_AFTER_FAILS = 3;

export function ReviewWriteActivity({ unitId, sources, onComplete, onBack }: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [idx, setIdx] = useState(0);
  const [fails, setFails] = useState(0);
  const [done, setDone] = useState(false);

  usePhonicsTtsWarm(
    unitId,
    sources.map((s) => s.sound),
    'review-write'
  );

  const current = sources[idx];

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (done || !current) return;
      if (!passed) {
        setFails((f) => f + 1);
        return;
      }
      const isLast = idx + 1 >= sources.length;
      if (isLast) setDone(true);

      const url = await resolveTtsUrl({
        text: current.sound,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'review-write',
      });

      const afterChime = () => {
        if (isLast) playCorrectSequence({ language: 'ko', onDone: onComplete });
        else {
          setIdx((i) => i + 1);
          setFails(0);
        }
      };
      const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
      if (url) playAudio(url, playChime);
      else playChime();
    },
    [done, current, idx, sources.length, unitId, playAudio, playCorrectSequence, onComplete]
  );

  if (!current) return null;

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
        {/* 진행 dots — 몇 장 남았는지 그림으로 */}
        <div className="flex gap-2 sm:gap-3">
          {sources.map((s, i) => (
            <span
              key={s.unitId}
              className={[
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm sm:text-base shadow-soft transition',
                i < idx
                  ? 'bg-mint-500 text-white'
                  : i === idx
                    ? 'bg-coral-500 text-white ring-4 ring-coral-200 animate-pulse'
                    : 'bg-white text-ink-400',
              ].join(' ')}
            >
              {i < idx ? '✓' : i + 1}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {/* 그림 = 문제 */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-3xl bg-white border-[6px] border-white shadow-pop overflow-hidden shrink-0">
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.word}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🖼️</div>
            )}
          </div>

          <LetterFillCanvas
            key={`review-write-${idx}`}
            letter={current.letter}
            onResult={handleResult}
            autoCheck
            threshold={0.95}
          />
        </div>

        {fails >= HINT_AFTER_FAILS && (
          <p className="text-2xl sm:text-3xl font-black text-ink-400">
            힌트 <span className="text-coral-400">{current.letter}</span>
          </p>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

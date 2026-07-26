import { useCallback, useEffect, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

interface Props {
  unitId: string;
  sources: ReadonlyArray<ReviewCardSource>;
  language?: 'korean' | 'english';
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

export function ReviewWriteActivity({
  unitId,
  sources,
  language = 'korean',
  onComplete,
  onBack,
}: Props) {
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

  const say = useCallback(
    async (card: ReviewCardSource) => {
      const url = await resolveTtsUrl({
        text: card.sound,
        language,
        storybookId: unitId,
        identifierPrefix: 'review-write',
      });
      if (url) playAudio(url);
    },
    [language, unitId, playAudio]
  );

  // 그림이 없는 복습(영어)은 소리가 곧 문제다 — 카드가 바뀌면 자동으로 한 번 들려준다.
  useEffect(() => {
    if (done || !current || current.imageUrl) return;
    say(current);
  }, [idx, done, current, say]);

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
        language,
        storybookId: unitId,
        identifierPrefix: 'review-write',
      });

      const afterChime = () => {
        if (isLast)
          playCorrectSequence({
            language: language === 'english' ? 'en' : 'ko',
            onDone: onComplete,
          });
        else {
          setIdx((i) => i + 1);
          setFails(0);
        }
      };
      const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
      if (url) playAudio(url, playChime);
      else playChime();
    },
    [
      done,
      current,
      idx,
      sources.length,
      unitId,
      language,
      playAudio,
      playCorrectSequence,
      onComplete,
    ]
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
            // 🔴 key 는 unitId 만으로 부족하다 — 영어는 한 단원이 글자를 3~4개 내서 같은 unitId 가 반복된다.
            <span
              key={`${s.unitId}-${s.letter}`}
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
          {/* 문제 — 그림이 있으면 그림, 없으면 소리.
              🔴 영어 단원은 아직 단어 그림이 0장이라 소리로 낸다. 자산 때문에 택한 형태지만
                 "소리를 듣고 글자를 쓴다"는 파닉스로는 오히려 정공법이라 그대로 둔다. */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-3xl bg-white border-[6px] border-white shadow-pop overflow-hidden shrink-0">
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.word}
                className="w-full h-full object-cover"
              />
            ) : (
              <button
                onClick={() => say(current)}
                aria-label="다시 듣기"
                className="w-full h-full flex items-center justify-center bg-coral-500 text-white text-6xl sm:text-7xl active:scale-[0.97] transition"
              >
                🔊
              </button>
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

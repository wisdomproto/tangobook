import { useCallback, useEffect, useState } from 'react';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
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
 * 복습 — 그림을 보고 **낱말 전체** 쓰기.
 *
 * 카드 하나당 [그림] + [낱말 쓰기 캔버스]. 한 글자씩 순서대로 칠하고, 낱말을 다 쓰면
 * 그 낱말 소리 → 띵동 → 다음 그림. 마지막까지 쓰면 칭찬 + onComplete.
 *
 * 🔴 **음소 한 글자(ㄱ)가 아니라 낱말(고기)** 을 쓴다(2026-07-27). 그림은 `고기` 인데 쓰는 건 `ㄱ`
 *    하나라 그림과 손이 따로 놀았다. 낱말쓰기와 같은 `WordFillCanvas` 를 쓰므로 **한 번에 한 글자만**
 *    밝고, 끝낸 글자는 칠한 색이 남는다.
 */

export function ReviewWriteActivity({
  unitId,
  sources,
  language = 'korean',
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  usePhonicsTtsWarm(
    unitId,
    sources.map((s) => s.word),
    'review-write',
    language
  );

  const current = sources[idx];

  const say = useCallback(
    async (card: ReviewCardSource) => {
      const url = await resolveTtsUrl({
        text: card.word,
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

  /** 낱말을 다 쓰면 — 그 낱말을 읽어주고 띵동, 다음 그림으로. */
  const handleWordDone = useCallback(async () => {
    if (done || !current) return;
    const isLast = idx + 1 >= sources.length;
    if (isLast) setDone(true);

    const url = await resolveTtsUrl({
      text: current.word,
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
      else setIdx((i) => i + 1);
    };
    const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
    if (url) playAudio(url, playChime);
    else playChime();
  }, [
    done,
    current,
    idx,
    sources.length,
    unitId,
    language,
    playAudio,
    playCorrectSequence,
    onComplete,
  ]);

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

          <div className="w-full max-w-2xl">
            <WordFillCanvas
              key={`review-write-${idx}`}
              word={current.word}
              syllables={[...current.word]}
              onComplete={handleWordDone}
            />
          </div>
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
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

const COLS = 5;
const ROWS = 5;

/**
 * 🌀 복습 — 길 따라가며 글자 모으기 (이퓨처 Review 의 Play & Do).
 *
 * 🔴 복습이 심심했던 이유는 세 활동이 전부 "카드 그리드 + 탭" 이라 학습 단원과 그림이 똑같았던 것이다.
 *    이 활동만 **형식이 다르다** — 격자 위 길을 순서대로 밟아 나가며 만나는 사물의 글자를 줍는다.
 *
 * 🔴 4~7세라 진짜 미로(막다른 길·되돌아가기)는 만들지 않는다. 길은 하나로 이어져 있고,
 *    **다음 칸만 반짝인다**. "어디로 가지?" 가 아니라 "다음 칸을 밟는다" 가 과제다.
 *    틀린 칸을 눌러도 벌은 없다(반응만 없음) — 복습에서 실패 경험을 만들 이유가 없다.
 */
function buildPath(): Array<{ r: number; c: number }> {
  // 뱀처럼 접히는 길 — 격자를 왼→오, 아래로, 오→왼 순으로 훑는다.
  const path: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = r % 2 === 0 ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
    for (const c of cols) path.push({ r, c });
  }
  return path;
}

export function ReviewMazeActivity({
  unitId,
  sources,
  language = 'korean',
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const [step, setStep] = useState(0); // 다음에 밟을 칸 index
  const [done, setDone] = useState(false);

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => sources.map((s) => s.sound), [sources]),
    'review-maze'
  );

  const path = useMemo(buildPath, []);

  // 길 위에 사물을 고르게 흩어놓는다 — 시작 칸은 비우고 마지막 칸이 도착점이다.
  const stops = useMemo(() => {
    const map = new Map<number, ReviewCardSource>();
    const gap = Math.floor((path.length - 2) / sources.length);
    sources.forEach((s, i) => map.set(1 + i * gap, s));
    return map;
  }, [path.length, sources]);

  const collected = useMemo(
    () => [...stops.entries()].filter(([i]) => i < step).map(([, s]) => s),
    [stops, step]
  );

  const say = useCallback(
    async (card: ReviewCardSource) => {
      const url = await resolveTtsUrl({
        text: card.sound,
        language,
        storybookId: unitId,
        identifierPrefix: 'review-maze',
      });
      if (url) playAudio(url);
    },
    [language, unitId, playAudio]
  );

  const handleTap = useCallback(
    (idx: number) => {
      if (done || idx !== step) return; // 다음 칸만 받는다 (틀린 칸은 무반응)
      const next = idx + 1;
      setStep(next);
      const stop = stops.get(idx);
      if (stop) say(stop);
      else playFeedbackSound(true);
      if (next >= path.length) {
        setDone(true);
        playCorrectSequence({ language: language === 'english' ? 'en' : 'ko', onDone: onComplete });
      }
    },
    [
      done,
      step,
      stops,
      say,
      playFeedbackSound,
      path.length,
      playCorrectSequence,
      language,
      onComplete,
    ]
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
        <h2 className="text-2xl sm:text-4xl font-black text-ink-900 text-center break-keep">
          {done ? '다 모았어!' : '길을 따라가며 글자를 모아봐!'}
        </h2>

        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {path.map((cell, idx) => {
            const stop = stops.get(idx);
            const walked = idx < step;
            const isNext = idx === step && !done;
            return (
              <button
                key={`${cell.r}-${cell.c}`}
                onClick={() => handleTap(idx)}
                aria-label={stop ? stop.word : `${idx + 1}번 칸`}
                style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1 }}
                className={[
                  'relative w-[16vw] h-[16vw] max-w-20 max-h-20 sm:w-24 sm:h-24 sm:max-w-none sm:max-h-none rounded-2xl border-[4px] overflow-hidden transition flex items-center justify-center',
                  walked
                    ? 'bg-mint-100 border-mint-500'
                    : isNext
                      ? 'bg-white border-coral-500 ring-4 ring-coral-200 animate-pulse'
                      : 'bg-white/70 border-white',
                ].join(' ')}
              >
                {stop?.imageUrl ? (
                  <img src={stop.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : stop ? (
                  <span className="text-2xl sm:text-3xl font-black text-coral-600">
                    {stop.letter}
                  </span>
                ) : walked ? (
                  <span className="text-xl">·</span>
                ) : null}
                {idx === path.length - 1 && !walked && (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl">
                    🏁
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 모은 글자 — 지나온 만큼 채워진다 */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {sources.map((s) => {
            const got = collected.includes(s);
            return (
              <span
                key={`${s.unitId}-${s.letter}`}
                className={[
                  'w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-4xl font-black shadow-soft transition',
                  got ? 'bg-mint-500 text-white' : 'bg-white/70 text-ink-300',
                ].join(' ')}
              >
                {got ? s.letter : '?'}
              </span>
            );
          })}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

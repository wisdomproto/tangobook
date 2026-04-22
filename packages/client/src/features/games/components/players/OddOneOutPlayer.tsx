import { useState, useCallback } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { OddOneOutData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function OddOneOutPlayer({ gameData, onComplete, onBack, systemSounds }: GamePlayerProps) {
  const { rounds } = gameData as OddOneOutData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const current = rounds[currentIdx];
  const isLast = currentIdx === rounds.length - 1;
  const { playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const handleSelect = useCallback(
    (optIdx: number) => {
      if (selectedIdx !== null) return;
      setSelectedIdx(optIdx);
      const correct = current.options[optIdx]?.isOddOneOut ?? false;
      if (correct) setScore((s) => s + 1);

      if (correct) {
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            if (isLast) {
              onComplete(score + 1, rounds.length);
            } else {
              setCurrentIdx((i) => i + 1);
              setSelectedIdx(null);
            }
          },
        });
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          if (isLast) {
            onComplete(score, rounds.length);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelectedIdx(null);
          }
        }, 1000);
      }
    },
    [
      selectedIdx,
      current,
      isLast,
      score,
      rounds.length,
      onComplete,
      playFeedbackSound,
      playCorrectSequence,
      systemSounds,
    ]
  );

  if (!current) {
    return (
      <GamePlayerLayout maxWidth="lg" onBack={onBack}>
        <p className="text-ink-900 text-center py-16 text-xl">라운드 데이터가 없습니다.</p>
      </GamePlayerLayout>
    );
  }

  return (
    <GamePlayerLayout maxWidth="3xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        {/* 진행률 */}
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        {/* 질문 */}
        <div className="text-center">
          <p className="text-lg sm:text-xl text-ink-900 dark:text-peach-200 mb-2 font-bold">
            카테고리: <span className="text-coral-500">{current.category}</span>
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-ink-900 dark:text-peach-200">
            다른 것을 찾아보세요!
          </h3>
        </div>

        {/* 보기 — 2×2 그리드, 카드 크게 */}
        <div className="grid grid-cols-2 gap-5 sm:gap-8 w-full max-w-3xl mx-auto">
          {current.options.map((opt, oi) => {
            let borderStyle =
              'border-ink-100 dark:border-slate-700 hover:border-coral-400 cursor-pointer';
            if (selectedIdx !== null) {
              if (opt.isOddOneOut) {
                borderStyle = 'border-success dark:border-success ring-4 ring-success';
              } else if (oi === selectedIdx && !opt.isOddOneOut) {
                borderStyle = 'border-danger dark:border-danger animate-shake';
              } else {
                borderStyle = 'border-ink-100 dark:border-slate-700 opacity-40';
              }
            }

            return (
              <button
                key={oi}
                onClick={() => handleSelect(oi)}
                disabled={selectedIdx !== null}
                className={`w-full rounded-2xl border-4 overflow-hidden transition-all bg-white shadow-card hover:scale-[1.03] hover:shadow-pop ${borderStyle}`}
              >
                {opt.imageUrl ? (
                  <img
                    src={opt.imageUrl}
                    alt={opt.word}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-ink-100 dark:bg-slate-800 flex items-center justify-center text-6xl">
                    ?
                  </div>
                )}
                <p className="text-xl sm:text-2xl font-black py-3 text-ink-900 dark:text-ink-900 bg-white">
                  {opt.korean || opt.word}
                </p>
              </button>
            );
          })}
        </div>

        {/* 설명 */}
        {selectedIdx !== null && current.explanation && (
          <div className="text-center px-4">
            <p className="text-xl sm:text-xl text-ink-900 dark:text-peach-200 bg-white/90 dark:bg-darkbg rounded-lg px-5 py-3 inline-block shadow-soft font-bold">
              {current.explanation}
            </p>
          </div>
        )}
      </div>
    </GamePlayerLayout>
  );
}

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
        <p className="text-slate-500 text-center py-16">라운드 데이터가 없습니다.</p>
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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
            카테고리: {current.category}
          </p>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">
            다른 것을 찾아보세요!
          </h3>
        </div>

        {/* 보기 */}
        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
          {current.options.map((opt, oi) => {
            let borderStyle =
              'border-slate-200 dark:border-slate-700 hover:border-coral-400 cursor-pointer';
            if (selectedIdx !== null) {
              if (opt.isOddOneOut) {
                borderStyle = 'border-success dark:border-success ring-2 ring-success';
              } else if (oi === selectedIdx && !opt.isOddOneOut) {
                borderStyle = 'border-red-400 dark:border-red-600';
              } else {
                borderStyle = 'border-slate-200 dark:border-slate-700 opacity-50';
              }
            }

            return (
              <button
                key={oi}
                onClick={() => handleSelect(oi)}
                disabled={selectedIdx !== null}
                className={`w-28 sm:w-32 lg:w-36 rounded-xl border-2 overflow-hidden transition-all ${borderStyle}`}
              >
                {opt.imageUrl ? (
                  <img
                    src={opt.imageUrl}
                    alt={opt.word}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">
                    ?
                  </div>
                )}
                <p className="text-xs sm:text-sm font-medium py-2 text-slate-800 dark:text-slate-100">
                  {opt.korean || opt.word}
                </p>
              </button>
            );
          })}
        </div>

        {/* 설명 */}
        {selectedIdx !== null && current.explanation && (
          <div className="text-center px-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 inline-block">
              {current.explanation}
            </p>
          </div>
        )}
      </div>
    </GamePlayerLayout>
  );
}

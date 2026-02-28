import { useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { OddOneOutData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';

export function OddOneOutPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const { rounds } = gameData as OddOneOutData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const current = rounds[currentIdx];
  const isLast = currentIdx === rounds.length - 1;

  const handleSelect = useCallback(
    (optIdx: number) => {
      if (selectedIdx !== null) return;
      setSelectedIdx(optIdx);
      const correct = current.options[optIdx]?.isOddOneOut ?? false;
      if (correct) setScore((s) => s + 1);

      setTimeout(() => {
        if (isLast) {
          onComplete(correct ? score + 1 : score, rounds.length);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedIdx(null);
        }
      }, 1500);
    },
    [selectedIdx, current, isLast, score, rounds.length, onComplete]
  );

  if (!current) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">라운드 데이터가 없습니다.</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">
          ← 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 돌아가기
        </Button>
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span>
            {currentIdx + 1} / {rounds.length}
          </span>
          <span>정답: {score}</span>
        </div>
      </div>

      {/* 진행률 */}
      <div className="mb-8">
        <GameProgressBar
          current={currentIdx}
          total={rounds.length}
          score={score}
          accentColor="violet"
        />
      </div>

      {/* 질문 */}
      <div className="text-center mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          카테고리: {current.category}
        </p>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          다른 것을 찾아보세요!
        </h3>
      </div>

      {/* 보기 */}
      <div className="flex gap-4 justify-center flex-wrap">
        {current.options.map((opt, oi) => {
          let borderStyle =
            'border-slate-200 dark:border-slate-700 hover:border-violet-300 cursor-pointer';
          if (selectedIdx !== null) {
            if (opt.isOddOneOut) {
              borderStyle = 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-300';
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
              className={`w-36 rounded-xl border-2 overflow-hidden transition-all ${borderStyle}`}
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
              <p className="text-sm font-medium py-2 text-slate-800 dark:text-slate-100">
                {opt.korean || opt.word}
              </p>
            </button>
          );
        })}
      </div>

      {/* 설명 */}
      {selectedIdx !== null && current.explanation && (
        <div className="text-center mt-6 px-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 inline-block">
            {current.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

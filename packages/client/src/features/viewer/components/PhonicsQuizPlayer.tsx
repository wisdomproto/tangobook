import { useState } from 'react';
import type { PhonicsQuizItem } from '@tangobook/shared';

export function PhonicsQuizPlayer({ items }: { items: PhonicsQuizItem[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = items[currentIdx];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= items.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">{score === items.length ? '🎉' : '👏'}</div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          {score} / {items.length} 점
        </p>
        <button
          onClick={handleRestart}
          className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
        >
          다시 하기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex justify-between mb-4">
        <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
          Q{currentIdx + 1}.
        </span>
        <span className="text-xs text-slate-400">
          {currentIdx + 1} / {items.length}
        </span>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
        {current.question}
      </p>
      <div className="space-y-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correctAnswer;
          const isChosen = i === selected;
          let cls = 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200';
          if (selected !== null) {
            if (isCorrect)
              cls =
                'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
            else if (isChosen)
              cls = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            else cls = 'border-slate-200 dark:border-slate-600 text-slate-400';
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
          >
            {currentIdx + 1 >= items.length ? '결과 보기' : '다음 →'}
          </button>
        </div>
      )}
    </div>
  );
}

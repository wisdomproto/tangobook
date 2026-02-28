import { useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordQuizData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';

export function WordQuizPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const { questions } = gameData as WordQuizData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult] = useState(false);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const handleSelect = useCallback(
    (answerIdx: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(answerIdx);
      const correct = answerIdx === current.correctAnswer;
      if (correct) setScore((s) => s + 1);

      setTimeout(() => {
        if (isLast) {
          const finalScore = correct ? score + 1 : score;
          onComplete(finalScore, questions.length);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedAnswer(null);
        }
      }, 1000);
    },
    [selectedAnswer, current, isLast, score, questions.length, onComplete]
  );

  if (!current) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">문제가 없습니다.</p>
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
            {currentIdx + 1} / {questions.length}
          </span>
          <span>정답: {score}</span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-8">
        <GameProgressBar
          current={currentIdx}
          total={questions.length}
          score={score}
          accentColor="violet"
        />
      </div>

      {/* 질문 */}
      <div className="text-center mb-8">
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt=""
            className="w-40 h-40 object-contain mx-auto mb-4 rounded-xl"
          />
        )}
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {current.question}
        </h3>
      </div>

      {/* 보기 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        {current.options.map((opt, oi) => {
          let style =
            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 cursor-pointer';
          if (selectedAnswer !== null) {
            if (oi === current.correctAnswer) {
              style =
                'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300';
            } else if (oi === selectedAnswer && oi !== current.correctAnswer) {
              style =
                'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300';
            } else {
              style =
                'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-50';
            }
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={selectedAnswer !== null}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="text-center mt-8">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {score} / {questions.length} 점
          </p>
        </div>
      )}
    </div>
  );
}

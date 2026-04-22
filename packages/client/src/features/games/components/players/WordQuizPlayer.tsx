import { useState, useCallback } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordQuizData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function WordQuizPlayer({ gameData, onComplete, onBack, systemSounds }: GamePlayerProps) {
  const { questions } = gameData as WordQuizData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const { playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const handleSelect = useCallback(
    (answerIdx: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(answerIdx);
      const correct = answerIdx === current.correctAnswer;
      if (correct) setScore((s) => s + 1);

      if (correct) {
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            if (isLast) {
              onComplete(score + 1, questions.length);
            } else {
              setCurrentIdx((i) => i + 1);
              setSelectedAnswer(null);
            }
          },
        });
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          if (isLast) {
            onComplete(score, questions.length);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelectedAnswer(null);
          }
        }, 1000);
      }
    },
    [
      selectedAnswer,
      current,
      isLast,
      score,
      questions.length,
      onComplete,
      playFeedbackSound,
      playCorrectSequence,
      systemSounds,
    ]
  );

  if (!current) {
    return (
      <GamePlayerLayout maxWidth="lg" onBack={onBack}>
        <p className="text-slate-500 text-center py-16">문제가 없습니다.</p>
      </GamePlayerLayout>
    );
  }

  return (
    <GamePlayerLayout maxWidth="lg" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        {/* 진행률 바 */}
        <GameProgressBar current={currentIdx} total={questions.length} score={score} />

        {/* 질문 */}
        <div className="text-center">
          {current.imageUrl && (
            <img
              src={current.imageUrl}
              alt=""
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain mx-auto mb-4 rounded-xl"
            />
          )}
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">
            {current.question}
          </h3>
        </div>

        {/* 보기 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
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
      </div>
    </GamePlayerLayout>
  );
}

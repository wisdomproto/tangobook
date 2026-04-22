import { useState, useCallback } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { StorybookQuizData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function StorybookQuizPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const { questions } = gameData as StorybookQuizData;
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
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-6 sm:gap-8">
        {/* 진행률 바 */}
        <div className="w-full">
          <GameProgressBar current={currentIdx} total={questions.length} score={score} />
        </div>

        {/* 질문 */}
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900 text-center">
          {current.question}
        </h3>

        {/* 보기 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
          {current.options.map((opt, oi) => {
            let style =
              'bg-white/80 border-white/50 text-emerald-900 hover:bg-white hover:border-violet-300 hover:shadow-lg cursor-pointer';
            if (selectedAnswer !== null) {
              if (oi === current.correctAnswer) {
                style = 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-md';
              } else if (oi === selectedAnswer && oi !== current.correctAnswer) {
                style = 'bg-red-100 border-red-400 text-red-800 shadow-md';
              } else {
                style = 'bg-white/40 border-white/20 text-slate-400';
              }
            }

            return (
              <button
                key={oi}
                onClick={() => handleSelect(oi)}
                disabled={selectedAnswer !== null}
                className={`px-4 py-3 sm:px-6 sm:py-5 rounded-2xl border-2 text-base sm:text-lg font-semibold transition-all ${style}`}
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

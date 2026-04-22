import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordQuizData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { cn } from '@/lib/cn';

export function WordQuizPlayer({ gameData, onComplete, onBack, systemSounds }: GamePlayerProps) {
  const { questions } = gameData as WordQuizData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

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
        <p className="text-ink-900 text-center py-16 text-xl">문제가 없습니다.</p>
      </GamePlayerLayout>
    );
  }

  return (
    <GamePlayerLayout maxWidth="3xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        {/* 진행률 바 */}
        <GameProgressBar current={currentIdx} total={questions.length} score={score} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.25, type: 'spring' }}
            className="w-full flex flex-col items-center gap-4 sm:gap-6"
          >
            {/* 질문 영역 */}
            <div className="bg-white/90 dark:bg-darkbg/60 backdrop-blur-sm rounded-lg px-6 py-4 shadow-soft text-center w-full max-w-2xl">
              {current.imageUrl && (
                <img
                  src={current.imageUrl}
                  alt=""
                  className="w-28 h-28 sm:w-36 sm:h-36 object-contain mx-auto mb-3 rounded-md"
                />
              )}
              <div className="text-xl sm:text-2xl font-black text-ink-900 dark:text-peach-100">
                {current.question}
              </div>
              {current.ttsUrl && (
                <button
                  type="button"
                  onClick={() => playAudio(current.ttsUrl)}
                  className="mt-3 w-12 h-12 rounded-full bg-coral-500 text-white flex items-center justify-center mx-auto shadow-pop hover:bg-coral-600 transition-colors"
                  aria-label="다시 듣기"
                >
                  <span className="text-xl">🔊</span>
                </button>
              )}
            </div>

            {/* 선택지 그리드 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl mx-auto">
              {current.options.map((opt, oi) => {
                const isSelected = selectedAnswer === oi;
                const isCorrect = selectedAnswer !== null && oi === current.correctAnswer;
                const isWrong = isSelected && oi !== current.correctAnswer;
                const isDimmed = selectedAnswer !== null && !isCorrect && !isWrong;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => handleSelect(oi)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      'aspect-square rounded-lg bg-white dark:bg-darkbg/80 shadow-card flex flex-col items-center justify-center p-4 transition-all',
                      'hover:scale-105 hover:shadow-pop',
                      isCorrect && 'bg-success/10 ring-4 ring-success scale-105',
                      isWrong && 'bg-coral-100 ring-4 ring-danger animate-shake',
                      isDimmed && 'opacity-50'
                    )}
                  >
                    <span className="text-2xl sm:text-3xl font-black text-ink-900 dark:text-peach-100 text-center break-words">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 정답 맞춘 후 큰 이미지 공개 — 아이가 "이 단어 = 이 그림" 연결 학습 */}
            {selectedAnswer !== null &&
              selectedAnswer === current.correctAnswer &&
              current.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, type: 'spring' }}
                  className="flex flex-col items-center gap-3 mt-2"
                >
                  <img
                    src={current.imageUrl}
                    alt=""
                    className="w-[min(40vmin,20rem)] aspect-square object-contain rounded-2xl shadow-card bg-white p-3"
                  />
                  <div className="text-3xl sm:text-4xl font-black text-success">
                    {current.options[current.correctAnswer]}
                  </div>
                </motion.div>
              )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GamePlayerLayout>
  );
}

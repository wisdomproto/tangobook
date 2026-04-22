import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordListeningData, WordListeningRound } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { cn } from '@/lib/cn';

export function WordListeningPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as WordListeningData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showReplayBanner, setShowReplayBanner] = useState(false);
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const current = rounds[currentIdx] as WordListeningRound | undefined;

  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(() => playAudio(current.targetTtsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  // 오답 배너 자동 숨김 (3초)
  useEffect(() => {
    if (!showReplayBanner) return;
    const timer = setTimeout(() => setShowReplayBanner(false), 3000);
    return () => clearTimeout(timer);
  }, [showReplayBanner]);

  const playCurrentAudio = useCallback(() => {
    if (current) playAudio(current.targetTtsUrl);
  }, [current, playAudio]);

  const handleSelect = useCallback(
    (word: string) => {
      if (feedback || !current) return;
      const isCorrect = word === current.targetWord;
      setSelectedWord(word);
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore((s) => s + 1);
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            if (currentIdx + 1 >= rounds.length) setFinished(true);
            else setCurrentIdx((i) => i + 1);
            setSelectedWord(null);
            setFeedback(null);
            setWrongAttempts(0);
            setShowReplayBanner(false);
          },
        });
      } else {
        playFeedbackSound(false);
        setWrongAttempts((w) => w + 1);
        setShowReplayBanner(true);
        setTimeout(() => {
          setSelectedWord(null);
          setFeedback(null);
        }, 800);
      }
    },
    [
      feedback,
      current,
      currentIdx,
      rounds.length,
      playFeedbackSound,
      playCorrectSequence,
      systemSounds,
    ]
  );

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedWord(null);
    setFeedback(null);
    setFinished(false);
    setWrongAttempts(0);
    setShowReplayBanner(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, rounds.length);
  }, [finished, score, rounds.length, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        score={score}
        total={rounds.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (word: string) => {
    const base =
      'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-soft';
    const isThisCorrect =
      feedback === 'correct' && (selectedWord === word || word === current.targetWord);
    const isThisWrong = feedback === 'wrong' && selectedWord === word;
    if (isThisCorrect)
      return cn(base, 'border-success ring-4 ring-success scale-105 animate-pulse');
    if (isThisWrong) return cn(base, 'border-danger ring-2 ring-danger animate-shake');
    return cn(base, 'border-peach-200 hover:scale-105 hover:shadow-pop hover:border-coral-300');
  };

  const cols =
    current.options.length <= 2
      ? 'grid-cols-2'
      : current.options.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        {/* 안내 + 듣기 버튼 */}
        <div className="text-center space-y-3">
          <p className="text-sm sm:text-base font-bold text-ink-700 dark:text-peach-200">
            소리를 듣고 알맞은 그림을 골라보세요!
          </p>
          <button
            onClick={playCurrentAudio}
            className="inline-flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 rounded-md bg-peach-100 border-2 border-peach-300 text-ink-900 font-bold hover:bg-peach-200 transition-all hover:scale-105"
          >
            <span className="text-2xl sm:text-3xl">🔊</span>
            <span className="text-base sm:text-lg">다시 듣기</span>
          </button>
        </div>

        {/* "다시 들어볼까?" 배너 (오답 시) */}
        <AnimatePresence>
          {showReplayBanner && wrongAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-coral-100 rounded-md p-3 flex items-center justify-center gap-3 shadow-soft"
            >
              <span className="text-ink-900 font-bold">다시 들어볼까?</span>
              <button
                onClick={playCurrentAudio}
                className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-pop hover:bg-coral-600 transition-colors"
                aria-label="다시 듣기"
              >
                🔊
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 그림 선택 그리드 */}
        <div className={`grid ${cols} gap-2 sm:gap-4 w-full`}>
          {current.options.map((opt) => {
            const isCorrectOpt =
              feedback === 'correct' &&
              (selectedWord === opt.word || opt.word === current.targetWord);
            return (
              <button
                key={opt.word}
                onClick={() => handleSelect(opt.word)}
                disabled={!!feedback}
                className={getOptionClass(opt.word)}
              >
                <div className="aspect-square bg-cream-50">
                  <img src={opt.imageUrl} alt={opt.word} className="w-full h-full object-cover" />
                </div>
                {isCorrectOpt && (
                  <>
                    <span className="absolute top-2 right-2 bg-success text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-xl shadow-pop">
                      ✓
                    </span>
                    <div className="absolute inset-x-0 bottom-0 bg-success/90 text-white text-center py-2 text-sm font-bold">
                      {opt.word}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GamePlayerLayout>
  );
}

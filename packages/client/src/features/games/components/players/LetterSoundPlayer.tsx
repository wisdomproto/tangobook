import { useState, useCallback, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { LetterSoundData, LetterSoundRound } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function LetterSoundPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as LetterSoundData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const current = rounds[currentIdx] as LetterSoundRound | undefined;

  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(() => playAudio(current.ttsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  const handleSelect = useCallback(
    (letter: string) => {
      if (feedback || !current) return;
      const isCorrect = letter === current.targetLetter;
      setSelected(letter);
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore((s) => s + 1);
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            if (currentIdx + 1 >= rounds.length) setFinished(true);
            else setCurrentIdx((i) => i + 1);
            setSelected(null);
            setFeedback(null);
          },
        });
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          setSelected(null);
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
    setSelected(null);
    setFeedback(null);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, rounds.length);
  }, [finished, score, rounds.length, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={rounds.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (letter: string) => {
    const base =
      'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl text-2xl sm:text-3xl lg:text-4xl font-black border-3 transition-all';
    if (selected === letter) {
      if (feedback === 'correct')
        return `${base} border-success bg-success/10 text-success dark:bg-success/20 dark:text-success scale-110`;
      if (feedback === 'wrong')
        return `${base} border-danger bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger animate-shake`;
    }
    if (feedback === 'correct' && letter === current.targetLetter)
      return `${base} border-success bg-success/10 text-success dark:bg-success/20 dark:text-success scale-110`;
    return `${base} border-ink-100 dark:border-slate-600 bg-white dark:bg-darkbg text-ink-900 dark:text-peach-200 hover:border-coral-400 hover:shadow-md cursor-pointer`;
  };

  return (
    <GamePlayerLayout maxWidth="lg" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        {/* 안내 + 듣기 버튼 */}
        <div className="text-center space-y-3">
          <p className="text-lg sm:text-xl font-bold text-ink-900 dark:text-peach-200">
            어떤 알파벳의 소리일까요?
          </p>
          <button
            onClick={() => playAudio(current.ttsUrl)}
            className="inline-flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all hover:scale-105"
          >
            <span className="text-2xl sm:text-3xl">🔊</span>
            <span className="text-base sm:text-lg">다시 듣기</span>
          </button>
        </div>

        {/* 글자 선택 */}
        <div className="flex justify-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
          {current.options.map((letter) => (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={!!feedback}
              className={getOptionClass(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </GamePlayerLayout>
  );
}

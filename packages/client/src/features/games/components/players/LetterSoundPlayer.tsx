import { useState, useCallback, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { LetterSoundData, LetterSoundRound } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';

export function LetterSoundPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as LetterSoundData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio, playFeedbackSound } = useGameAudio();

  const current = rounds[currentIdx] as LetterSoundRound | undefined;

  // 자동 TTS 재생
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
      playFeedbackSound(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) setFinished(true);
          else setCurrentIdx((i) => i + 1);
          setSelected(null);
          setFeedback(null);
        }, 1000);
      } else {
        setTimeout(() => {
          setSelected(null);
          setFeedback(null);
        }, 800);
      }
    },
    [feedback, current, currentIdx, rounds.length, playFeedbackSound]
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
        score={score}
        total={rounds.length}
        accentColor="violet"
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (letter: string) => {
    const base =
      'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl text-3xl sm:text-4xl font-black border-3 transition-all';
    if (selected === letter) {
      if (feedback === 'correct')
        return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 scale-110`;
      if (feedback === 'wrong')
        return `${base} border-red-400 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 animate-shake`;
    }
    if (feedback === 'correct' && letter === current.targetLetter)
      return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 scale-110`;
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 hover:border-violet-300 hover:shadow-md cursor-pointer`;
  };

  return (
    <div className="space-y-6">
      {/* 진행 바 */}
      <GameProgressBar
        current={currentIdx}
        total={rounds.length}
        score={score}
        accentColor="violet"
      />

      {/* 안내 + 듣기 버튼 */}
      <div className="text-center space-y-3">
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          어떤 알파벳의 소리일까요?
        </p>
        <button
          onClick={() => playAudio(current.ttsUrl)}
          className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all hover:scale-105"
        >
          <span className="text-3xl">🔊</span>
          <span className="text-lg">다시 듣기</span>
        </button>
      </div>

      {/* 글자 선택 (한 줄) */}
      <div className="flex justify-center gap-3 sm:gap-4">
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
  );
}

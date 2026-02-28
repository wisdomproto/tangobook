import { useState, useCallback, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordListeningData, WordListeningRound } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';

export function WordListeningPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as WordListeningData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio, playFeedbackSound } = useGameAudio();

  const current = rounds[currentIdx] as WordListeningRound | undefined;

  // 자동 TTS 재생
  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(() => playAudio(current.targetTtsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  const handleSelect = useCallback(
    (word: string) => {
      if (feedback || !current) return;
      const isCorrect = word === current.targetWord;
      setSelectedWord(word);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      playFeedbackSound(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) setFinished(true);
          else setCurrentIdx((i) => i + 1);
          setSelectedWord(null);
          setFeedback(null);
        }, 1200);
      } else {
        setTimeout(() => {
          setSelectedWord(null);
          setFeedback(null);
        }, 800);
      }
    },
    [feedback, current, currentIdx, rounds.length, playFeedbackSound]
  );

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedWord(null);
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
        accentColor="sky"
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (word: string) => {
    const base = 'relative rounded-2xl overflow-hidden border-3 transition-all cursor-pointer';
    if (selectedWord === word) {
      if (feedback === 'correct')
        return `${base} border-emerald-400 ring-4 ring-emerald-200 dark:ring-emerald-800 scale-105`;
      if (feedback === 'wrong')
        return `${base} border-red-400 ring-4 ring-red-200 dark:ring-red-800 animate-shake`;
    }
    if (feedback === 'correct' && word === current.targetWord)
      return `${base} border-emerald-400 ring-4 ring-emerald-200 dark:ring-emerald-800 scale-105`;
    return `${base} border-slate-200 dark:border-slate-600 hover:border-sky-300 hover:shadow-lg`;
  };

  const cols =
    current.options.length <= 2
      ? 'grid-cols-2'
      : current.options.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="space-y-6">
      {/* 진행 바 */}
      <GameProgressBar current={currentIdx} total={rounds.length} score={score} accentColor="sky" />

      {/* 안내 + 듣기 버튼 */}
      <div className="text-center space-y-3">
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          소리를 듣고 알맞은 그림을 골라보세요!
        </p>
        <button
          onClick={() => playAudio(current.targetTtsUrl)}
          className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all hover:scale-105"
        >
          <span className="text-3xl">🔊</span>
          <span className="text-lg">다시 듣기</span>
        </button>
      </div>

      {/* 그림 선택 그리드 */}
      <div className={`grid ${cols} gap-3 sm:gap-4 max-w-2xl mx-auto`}>
        {current.options.map((opt) => (
          <button
            key={opt.word}
            onClick={() => handleSelect(opt.word)}
            disabled={!!feedback}
            className={getOptionClass(opt.word)}
          >
            <div className="aspect-square bg-slate-50 dark:bg-slate-800">
              <img src={opt.imageUrl} alt={opt.word} className="w-full h-full object-cover" />
            </div>
            {/* 정답 시 단어 표시 */}
            {feedback === 'correct' && opt.word === current.targetWord && (
              <div className="absolute inset-x-0 bottom-0 bg-emerald-500/90 text-white text-center py-2 text-sm font-bold">
                {opt.word} ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

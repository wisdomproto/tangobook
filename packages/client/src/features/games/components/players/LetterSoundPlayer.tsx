import { useState, useRef, useCallback, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { LetterSoundData, LetterSoundRound } from '@tangobook/shared';

export function LetterSoundPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as LetterSoundData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as LetterSoundRound | undefined;

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const playDefaultSound = useCallback((correct: boolean) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      if (correct) {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
      playDefaultSound(isCorrect);

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
    [feedback, current, currentIdx, rounds.length, playDefaultSound]
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
    const total = rounds.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{score === total ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {score} / {total}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {score === total ? '완벽해요!' : '잘했어요!'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            다시 하기
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const progress = rounds.length > 0 ? (currentIdx / rounds.length) * 100 : 0;

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
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
          Q{currentIdx + 1}/{rounds.length}
        </span>
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{score}점</span>
      </div>

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

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { BlendingListeningData, BlendingListeningRound } from '@tangobook/shared';

export function BlendingListeningPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as BlendingListeningData;

  const rounds = useMemo(() => {
    // 좌우 랜덤화
    return data.rounds.map((r) => ({ ...r, targetLeft: Math.random() > 0.5 }));
  }, [data.rounds]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as
    | (BlendingListeningRound & { targetLeft: boolean })
    | undefined;

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
    const timer = setTimeout(() => playAudio(current.targetTtsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      if (feedback || !current) return;
      setSelected(side);
      const isTargetSide =
        (side === 'left' && current.targetLeft) || (side === 'right' && !current.targetLeft);
      setFeedback(isTargetSide ? 'correct' : 'wrong');
      playDefaultSound(isTargetSide);

      if (isTargetSide) {
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

  const leftWord = current.targetLeft ? current.targetWord : current.distractorWord;
  const leftImg = current.targetLeft ? current.targetImageUrl : current.distractorImageUrl;
  const rightWord = current.targetLeft ? current.distractorWord : current.targetWord;
  const rightImg = current.targetLeft ? current.distractorImageUrl : current.targetImageUrl;
  const progress = rounds.length > 0 ? (currentIdx / rounds.length) * 100 : 0;

  return (
    <div className="space-y-5">
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

      {/* 블렌딩 + 안내 */}
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-sm font-black text-amber-800 dark:text-amber-300">
          {current.blend}
        </span>
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          듣고 맞는 그림을 골라요!
        </p>
      </div>

      {/* 다시 듣기 */}
      <div className="flex justify-center">
        <button
          onClick={() => playAudio(current.targetTtsUrl)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
        >
          <span className="text-lg">🔊</span> 다시 듣기
        </button>
      </div>

      {/* 이미지 카드 */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <ImageCard
          word={leftWord}
          imageUrl={leftImg}
          side="left"
          isSelected={selected === 'left'}
          feedback={selected === 'left' ? feedback : null}
          isTarget={current.targetLeft}
          showAnswer={!!feedback}
          onClick={() => handleSelect('left')}
        />
        <ImageCard
          word={rightWord}
          imageUrl={rightImg}
          side="right"
          isSelected={selected === 'right'}
          feedback={selected === 'right' ? feedback : null}
          isTarget={!current.targetLeft}
          showAnswer={!!feedback}
          onClick={() => handleSelect('right')}
        />
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

function ImageCard({
  word,
  imageUrl,
  feedback,
  isTarget,
  showAnswer,
  onClick,
}: {
  word: string;
  imageUrl: string;
  side: 'left' | 'right';
  isSelected: boolean;
  feedback: 'correct' | 'wrong' | null;
  isTarget: boolean;
  showAnswer: boolean;
  onClick: () => void;
}) {
  let borderCls = 'border-slate-200 dark:border-slate-700';
  let extraCls = '';
  if (feedback === 'correct') {
    borderCls = 'border-emerald-400 dark:border-emerald-500';
    extraCls = 'scale-105';
  } else if (feedback === 'wrong') {
    borderCls = 'border-red-400 dark:border-red-500';
    extraCls = 'animate-shake';
  } else if (showAnswer && isTarget) borderCls = 'border-emerald-300 dark:border-emerald-600';

  return (
    <button
      onClick={onClick}
      disabled={!!feedback}
      className={`relative rounded-2xl overflow-hidden bg-white dark:bg-slate-800 transition-all duration-200 ${borderCls} ${extraCls}`}
      style={{ borderWidth: '3px' }}
    >
      <div className="aspect-square overflow-hidden">
        <img src={imageUrl} alt={word} className="w-full h-full object-cover" />
      </div>
      <div className="px-3 py-2 text-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{word}</span>
      </div>
      {feedback === 'correct' && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg shadow-md">
          ✓
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-lg shadow-md">
          ✗
        </div>
      )}
    </button>
  );
}

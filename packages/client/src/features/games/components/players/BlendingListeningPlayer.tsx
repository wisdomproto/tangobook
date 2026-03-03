import { useState, useCallback, useMemo, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { BlendingListeningData, BlendingListeningRound } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function BlendingListeningPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as BlendingListeningData;

  const rounds = useMemo(() => {
    return data.rounds.map((r) => ({ ...r, targetLeft: Math.random() > 0.5 }));
  }, [data.rounds]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const current = rounds[currentIdx] as
    | (BlendingListeningRound & { targetLeft: boolean })
    | undefined;

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

      if (isTargetSide) {
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
        score={score}
        total={rounds.length}
        accentColor="violet"
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const leftWord = current.targetLeft ? current.targetWord : current.distractorWord;
  const leftImg = current.targetLeft ? current.targetImageUrl : current.distractorImageUrl;
  const rightWord = current.targetLeft ? current.distractorWord : current.targetWord;
  const rightImg = current.targetLeft ? current.distractorImageUrl : current.targetImageUrl;

  return (
    <GamePlayerLayout maxWidth="lg" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-5 w-full">
        <GameProgressBar
          current={currentIdx}
          total={rounds.length}
          score={score}
          accentColor="violet"
        />

        {/* 블렌딩 + 안내 */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-sm font-black text-amber-800 dark:text-amber-300">
            {current.blend}
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
            듣고 맞는 그림을 골라요!
          </p>
        </div>

        {/* 다시 듣기 */}
        <button
          onClick={() => playAudio(current.targetTtsUrl)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
        >
          <span className="text-lg">🔊</span> 다시 듣기
        </button>

        {/* 이미지 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
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
      </div>
    </GamePlayerLayout>
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

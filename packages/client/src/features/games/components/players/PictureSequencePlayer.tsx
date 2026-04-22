import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { PictureSequenceData, PictureSequenceImage } from '@tangobook/shared';
import { shuffle } from '../../utils/shuffle';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

export function PictureSequencePlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const { images } = gameData as PictureSequenceData;
  const [order, setOrder] = useState<PictureSequenceImage[]>(() => shuffle([...images]));
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  // 탭-선택-스왑 (터치/클릭 모두 지원)
  const handleTap = useCallback(
    (idx: number) => {
      if (checked) return;
      if (selectedIdx === null) {
        setSelectedIdx(idx);
      } else if (selectedIdx === idx) {
        setSelectedIdx(null);
      } else {
        setOrder((prev) => {
          const next = [...prev];
          [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
          return next;
        });
        setSelectedIdx(null);
      }
    },
    [checked, selectedIdx]
  );

  // HTML5 드래그 (데스크톱 보조)
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setSelectedIdx(null);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    setOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragItem.current!, 1);
      next.splice(dragOverItem.current!, 0, removed);
      return next;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  const handleCheck = useCallback(() => {
    let correct = 0;
    order.forEach((img, idx) => {
      if (img.correctOrder === idx + 1) correct++;
    });
    setScore(correct);
    setChecked(true);
    setSelectedIdx(null);

    if (correct === images.length) {
      playCorrectSequence({
        systemSounds,
        onDone: () => onComplete(correct, images.length),
      });
    } else {
      playFeedbackSound(false);
    }
  }, [order, images.length, onComplete, playFeedbackSound, playCorrectSequence, systemSounds]);

  const handleRetry = useCallback(() => {
    setOrder(shuffle([...images]));
    setChecked(false);
    setScore(0);
    setSelectedIdx(null);
  }, [images]);

  return (
    <GamePlayerLayout maxWidth="3xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        {/* 헤더 */}
        <p className="text-sm text-slate-600 dark:text-slate-300">그림을 눌러 순서를 바꾸세요</p>

        {/* 이미지 순서 (2x2 그리드) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
          {order.map((img, idx) => (
            <div
              key={`${img.correctOrder}-${idx}`}
              draggable={!checked}
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => handleTap(idx)}
              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                !checked
                  ? selectedIdx === idx
                    ? 'ring-4 ring-coral-400 border-coral-500 shadow-xl scale-[1.02] cursor-pointer'
                    : 'cursor-pointer hover:shadow-lg border-slate-200 dark:border-slate-700'
                  : img.correctOrder === idx + 1
                    ? 'border-success dark:border-success'
                    : 'border-red-400 dark:border-red-600'
              }`}
            >
              {/* 순서 번호 */}
              <div
                className={`absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold z-10 ${
                  checked
                    ? img.correctOrder === idx + 1
                      ? 'bg-success text-white'
                      : 'bg-danger text-white'
                    : selectedIdx === idx
                      ? 'bg-coral-400 text-white'
                      : 'bg-coral-600 text-white'
                }`}
              >
                {idx + 1}
              </div>

              <img
                src={img.imageUrl}
                alt={img.caption ?? `이미지 ${idx + 1}`}
                className="w-full aspect-[4/3] object-cover"
                draggable={false}
              />

              {img.caption && (
                <p className="text-xs sm:text-sm text-center py-1.5 sm:py-2 px-2 sm:px-3 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-medium">
                  {img.caption}
                </p>
              )}

              {checked && img.correctOrder !== idx + 1 && (
                <div className="absolute bottom-8 right-2 bg-danger text-white text-xs px-2 py-1 rounded-full font-medium">
                  정답: {img.correctOrder}번
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-center gap-4">
          {checked ? (
            <>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {score === images.length ? '모두 정답!' : `${score}/${images.length} 맞았어요`}
              </p>
              {score < images.length && (
                <Button size="sm" onClick={handleRetry}>
                  다시 시도
                </Button>
              )}
            </>
          ) : (
            <Button onClick={handleCheck}>정답 확인</Button>
          )}
        </div>
      </div>
    </GamePlayerLayout>
  );
}

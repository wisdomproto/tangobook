import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { PictureSequenceData, PictureSequenceImage } from '@tangobook/shared';
import { shuffle } from '../../utils/shuffle';

export function PictureSequencePlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const { images } = gameData as PictureSequenceData;
  const [order, setOrder] = useState<PictureSequenceImage[]>(() => shuffle([...images]));
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
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

    if (correct === images.length) {
      setTimeout(() => onComplete(correct, images.length), 800);
    }
  }, [order, images.length, onComplete]);

  const handleRetry = useCallback(() => {
    setOrder(shuffle([...images]));
    setChecked(false);
    setScore(0);
  }, [images]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 돌아가기
        </Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          그림을 올바른 순서로 배열하세요
        </p>
      </div>

      {/* 이미지 순서 */}
      <div className="flex gap-4 flex-1 items-start justify-center flex-wrap">
        {order.map((img, idx) => (
          <div
            key={`${img.correctOrder}-${idx}`}
            draggable={!checked}
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`relative w-48 rounded-xl border-2 overflow-hidden transition-all ${
              !checked
                ? 'cursor-grab active:cursor-grabbing hover:shadow-lg border-slate-200 dark:border-slate-700'
                : img.correctOrder === idx + 1
                  ? 'border-emerald-400 dark:border-emerald-600'
                  : 'border-red-400 dark:border-red-600'
            }`}
          >
            {/* 순서 번호 */}
            <div
              className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                checked
                  ? img.correctOrder === idx + 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-violet-600 text-white'
              }`}
            >
              {idx + 1}
            </div>

            <img
              src={img.imageUrl}
              alt={img.caption ?? `이미지 ${idx + 1}`}
              className="w-full aspect-[4/3] object-cover"
            />

            {img.caption && (
              <p className="text-xs text-center py-1 px-2 text-slate-600 dark:text-slate-300 truncate">
                {img.caption}
              </p>
            )}

            {checked && img.correctOrder !== idx + 1 && (
              <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                정답: {img.correctOrder}번
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-center gap-4 mt-6">
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
  );
}

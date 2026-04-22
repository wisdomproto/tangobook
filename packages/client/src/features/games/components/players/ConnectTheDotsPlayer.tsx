import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { ConnectTheDotsData, ConnectTheDotsItem } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

const DOT_RADIUS_PX = 18;

export function ConnectTheDotsPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as ConnectTheDotsData;
  const items = data.items.filter((it) => it.keypoints.length >= 2);

  const [itemIdx, setItemIdx] = useState(0);
  const [nextOrder, setNextOrder] = useState(1);
  const [connectedUpTo, setConnectedUpTo] = useState(0);
  const [wrongTap, setWrongTap] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [completedItems, setCompletedItems] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const { playCorrectSequence, praiseVisible } = useGameAudio();

  const currentItem: ConnectTheDotsItem | undefined = items[itemIdx];

  if (items.length === 0) {
    return (
      <GamePlayerLayout maxWidth="lg" onBack={onBack}>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔢</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            점이 배치된 핵심단어가 없습니다. 핵심사물 탭에서 점을 먼저 등록해주세요.
          </p>
        </div>
      </GamePlayerLayout>
    );
  }

  const sortedKps = [...currentItem.keypoints].sort((a, b) => a.order - b.order);
  const totalDots = sortedKps.length;

  const handleDotClick = (order: number) => {
    if (completed) return;
    if (order === nextOrder) {
      const newConnected = connectedUpTo + 1;
      setConnectedUpTo(newConnected);
      setNextOrder(order + 1);
      setWrongTap(false);

      if (newConnected === totalDots) {
        setCompleted(true);
        setTimeout(() => setShowImage(true), 300);
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            const newCompletedItems = completedItems + 1;
            setCompletedItems(newCompletedItems);
            if (itemIdx + 1 >= items.length) {
              onComplete(newCompletedItems, items.length);
            } else {
              setItemIdx(itemIdx + 1);
              setNextOrder(1);
              setConnectedUpTo(0);
              setCompleted(false);
              setShowImage(false);
            }
          },
        });
      }
    } else {
      setWrongTap(true);
      setTimeout(() => setWrongTap(false), 500);
    }
  };

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        {/* 진행 */}
        <GameProgressBar current={itemIdx} total={items.length} score={completedItems} />

        {/* 안내 */}
        {!completed && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-violet-600">{nextOrder}번</span> 점을 찾아
            눌러주세요
          </p>
        )}
        {wrongTap && (
          <p className="text-xs text-red-500 animate-pulse">
            순서가 아니에요! {nextOrder}번을 찾아보세요
          </p>
        )}

        {/* 게임 영역 */}
        <div className="relative inline-block select-none rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 w-full">
          <img
            src={currentItem.originalImageUrl}
            alt={currentItem.objectName ?? `Page ${currentItem.pageNumber}`}
            className="w-full transition-opacity duration-700"
            style={{ opacity: showImage ? 1 : 0.08 }}
            draggable={false}
          />

          <div ref={overlayRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              {sortedKps.map(
                (kp, i) =>
                  i > 0 &&
                  i < connectedUpTo && (
                    <line
                      key={i}
                      x1={sortedKps[i - 1].x}
                      y1={sortedKps[i - 1].y}
                      x2={kp.x}
                      y2={kp.y}
                      stroke="#7c3aed"
                      strokeWidth="0.004"
                      strokeLinecap="round"
                    />
                  )
              )}
            </svg>

            {sortedKps.map((kp, i) => {
              const isConnected = kp.order <= connectedUpTo;
              const isNext = kp.order === nextOrder;
              return (
                <button
                  key={i}
                  onClick={() => handleDotClick(kp.order)}
                  className={`absolute rounded-full flex items-center justify-center text-xs font-bold shadow transition-all ${
                    isConnected
                      ? 'bg-violet-600 text-white'
                      : isNext
                        ? 'bg-amber-400 text-amber-900 animate-pulse ring-2 ring-amber-300'
                        : 'bg-white text-slate-600 border-2 border-slate-300 hover:border-violet-400'
                  }`}
                  style={{
                    left: `${kp.x * 100}%`,
                    top: `${kp.y * 100}%`,
                    width: DOT_RADIUS_PX * 2,
                    height: DOT_RADIUS_PX * 2,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {kp.order}
                </button>
              );
            })}
          </div>
        </div>

        {/* 완성 메시지 */}
        {completed && (
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1">🎉</div>
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              완성!
            </p>
          </div>
        )}
      </div>
    </GamePlayerLayout>
  );
}

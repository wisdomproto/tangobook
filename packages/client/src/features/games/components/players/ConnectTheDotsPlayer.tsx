import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { ConnectTheDotsData, ConnectTheDotsItem } from '@tangobook/shared';

const DOT_RADIUS_PX = 18;

export function ConnectTheDotsPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as ConnectTheDotsData;
  const items = data.items.filter((it) => it.keypoints.length >= 2);

  const [itemIdx, setItemIdx] = useState(0);
  const [nextOrder, setNextOrder] = useState(1);
  const [connectedUpTo, setConnectedUpTo] = useState(0); // 마지막으로 연결된 점 개수
  const [wrongTap, setWrongTap] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [completedItems, setCompletedItems] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);

  const currentItem: ConnectTheDotsItem | undefined = items[itemIdx];

  // 점이 없는 아이템만 있으면 안내
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-5xl mb-4">🔢</div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          점이 배치된 삽화가 없습니다. 저작도구에서 점을 먼저 찍어주세요.
        </p>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 돌아가기
        </Button>
      </div>
    );
  }

  const sortedKps = [...currentItem.keypoints].sort((a, b) => a.order - b.order);
  const totalDots = sortedKps.length;

  // 점 클릭
  const handleDotClick = (order: number) => {
    if (completed) return;
    if (order === nextOrder) {
      const newConnected = connectedUpTo + 1;
      setConnectedUpTo(newConnected);
      setNextOrder(order + 1);
      setWrongTap(false);

      // 모든 점 연결 완료
      if (newConnected === totalDots) {
        setCompleted(true);
        setTimeout(() => setShowImage(true), 300);
      }
    } else {
      setWrongTap(true);
      setTimeout(() => setWrongTap(false), 500);
    }
  };

  // 다음 아이템
  const handleNext = useCallback(() => {
    const newCompleted = completedItems + 1;
    setCompletedItems(newCompleted);

    if (itemIdx + 1 >= items.length) {
      onComplete(newCompleted, items.length);
    } else {
      setItemIdx(itemIdx + 1);
      setNextOrder(1);
      setConnectedUpTo(0);
      setCompleted(false);
      setShowImage(false);
    }
  }, [completedItems, itemIdx, items.length, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 진행 */}
      <div className="w-full flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          {itemIdx + 1} / {items.length}
        </span>
        <button onClick={onBack} className="hover:text-slate-700 dark:hover:text-slate-200">
          ✕
        </button>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all"
          style={{ width: `${(itemIdx / items.length) * 100}%` }}
        />
      </div>

      {/* 안내 */}
      {!completed && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-violet-600">{nextOrder}번</span> 점을 찾아 눌러주세요
        </p>
      )}
      {wrongTap && (
        <p className="text-xs text-red-500 animate-pulse">
          순서가 아니에요! {nextOrder}번을 찾아보세요
        </p>
      )}

      {/* 게임 영역 */}
      <div className="relative inline-block select-none rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {/* 삽화 (완성 시 페이드인) */}
        <img
          src={currentItem.originalImageUrl}
          alt={`Page ${currentItem.pageNumber}`}
          className="max-w-full transition-opacity duration-700"
          style={{ opacity: showImage ? 1 : 0.08 }}
          draggable={false}
        />

        {/* 점 + 선 오버레이 */}
        <div ref={overlayRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
          {/* 연결선 (SVG) */}
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

          {/* 점 */}
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

      {/* 완성 메시지 + 다음 */}
      {completed && (
        <div className="text-center">
          <div className="text-4xl mb-1">🎉</div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">완성!</p>
          <Button size="sm" className="mt-3" onClick={handleNext}>
            {itemIdx + 1 >= items.length ? '결과 보기' : '다음 그림'}
          </Button>
        </div>
      )}
    </div>
  );
}

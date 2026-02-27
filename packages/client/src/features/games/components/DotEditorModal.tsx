import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/Button';
import type {
  GameInstance,
  ConnectTheDotsData,
  ConnectTheDotsItem,
  DotKeypoint,
} from '@tangobook/shared';

interface DotEditorModalProps {
  game: GameInstance;
  onSave: (updatedData: ConnectTheDotsData) => void;
  onClose: () => void;
}

export function DotEditorModal({ game, onSave, onClose }: DotEditorModalProps) {
  const data = game.data as ConnectTheDotsData;
  const [items, setItems] = useState<ConnectTheDotsItem[]>(
    data.items.map((it) => ({ ...it, keypoints: [...it.keypoints] }))
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const activeItem = items[activeIdx];

  const updateKeypoints = useCallback(
    (newKps: DotKeypoint[]) => {
      setItems((prev) =>
        prev.map((it, i) => (i === activeIdx ? { ...it, keypoints: newKps } : it))
      );
    },
    [activeIdx]
  );

  // 클릭 → 점 추가 (드래그 중이면 무시)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragIdx !== null) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // 기존 점 근처 클릭이면 무시 (드래그/삭제 처리)
    const hitRadius = 20 / rect.width;
    if (activeItem.keypoints.some((kp) => Math.hypot(kp.x - nx, kp.y - ny) < hitRadius)) return;

    const newKp: DotKeypoint = { x: nx, y: ny, order: activeItem.keypoints.length + 1 };
    updateKeypoints([...activeItem.keypoints, newKp]);
  };

  // 점 드래그 시작
  const handleDotPointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragIdx(idx);
  };

  // 점 드래그 이동
  const handleDotPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragIdx === null) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const updated = activeItem.keypoints.map((kp, i) =>
      i === dragIdx ? { ...kp, x: nx, y: ny } : kp
    );
    updateKeypoints(updated);
  };

  // 점 드래그 종료
  const handleDotPointerUp = () => {
    setDragIdx(null);
  };

  // 점 더블클릭 → 삭제 (재넘버링)
  const handleDotDoubleClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const newKps = activeItem.keypoints
      .filter((_, i) => i !== idx)
      .map((kp, i) => ({ ...kp, order: i + 1 }));
    updateKeypoints(newKps);
  };

  // 전체 삭제
  const handleClearAll = () => {
    updateKeypoints([]);
  };

  // 저장
  const handleSave = () => {
    onSave({ type: 'connect-the-dots', items });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            점잇기 편집 — {activeItem.keypoints.length}개
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              전체 삭제
            </Button>
            <Button size="sm" onClick={handleSave}>
              저장
            </Button>
            <button
              onClick={onClose}
              className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 페이지 탭 */}
        {items.length > 1 && (
          <div className="flex gap-2 px-4 pt-3">
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  i === activeIdx
                    ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                p.{it.pageNumber} ({it.keypoints.length})
              </button>
            ))}
          </div>
        )}

        {/* 에디터 본문 */}
        <div className="p-4">
          <div className="relative inline-block select-none" style={{ lineHeight: 0 }}>
            {/* 삽화 */}
            <img
              src={activeItem.originalImageUrl}
              alt={`Page ${activeItem.pageNumber}`}
              className="max-w-full rounded-lg"
              draggable={false}
            />

            {/* 점 오버레이 */}
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-crosshair"
              onClick={handleOverlayClick}
              onPointerMove={handleDotPointerMove}
              onPointerUp={handleDotPointerUp}
              style={{ touchAction: 'none' }}
            >
              {/* 연결선 */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                {activeItem.keypoints.map(
                  (kp, i) =>
                    i > 0 && (
                      <line
                        key={i}
                        x1={activeItem.keypoints[i - 1].x}
                        y1={activeItem.keypoints[i - 1].y}
                        x2={kp.x}
                        y2={kp.y}
                        stroke="rgba(124,58,237,0.5)"
                        strokeWidth="0.003"
                      />
                    )
                )}
              </svg>

              {/* 점 마커 */}
              {activeItem.keypoints.map((kp, i) => (
                <div
                  key={i}
                  className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg select-none ${
                    dragIdx === i
                      ? 'bg-violet-400 text-white scale-110'
                      : 'bg-violet-600 text-white hover:bg-violet-500'
                  } transition-transform cursor-move`}
                  style={{ left: `${kp.x * 100}%`, top: `${kp.y * 100}%` }}
                  onPointerDown={(e) => handleDotPointerDown(e, i)}
                  onDoubleClick={(e) => handleDotDoubleClick(e, i)}
                >
                  {kp.order}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            클릭: 점 추가 · 드래그: 이동 · 더블클릭: 삭제
          </p>
        </div>
      </div>
    </div>
  );
}

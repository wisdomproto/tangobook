import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/Button';
import type { DotKeypoint } from '@tangobook/shared';

interface KeyObjectDotEditorModalProps {
  objectName: string;
  imageUrl: string;
  initialKeypoints: DotKeypoint[];
  onSave: (keypoints: DotKeypoint[]) => void;
  onClose: () => void;
}

export function KeyObjectDotEditorModal({
  objectName,
  imageUrl,
  initialKeypoints,
  onSave,
  onClose,
}: KeyObjectDotEditorModalProps) {
  const [keypoints, setKeypoints] = useState<DotKeypoint[]>(
    initialKeypoints.map((kp) => ({ ...kp }))
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragIdx !== null) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const hitRadius = 20 / rect.width;
    if (keypoints.some((kp) => Math.hypot(kp.x - nx, kp.y - ny) < hitRadius)) return;

    setKeypoints((prev) => [...prev, { x: nx, y: ny, order: prev.length + 1 }]);
  };

  const handleDotPointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragIdx(idx);
  };

  const handleDotPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragIdx === null) return;
      const rect = overlayRef.current!.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setKeypoints((prev) => prev.map((kp, i) => (i === dragIdx ? { ...kp, x: nx, y: ny } : kp)));
    },
    [dragIdx]
  );

  const handleDotPointerUp = () => setDragIdx(null);

  const handleDotDoubleClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setKeypoints((prev) =>
      prev.filter((_, i) => i !== idx).map((kp, i) => ({ ...kp, order: i + 1 }))
    );
  };

  const handleClearAll = () => setKeypoints([]);
  const handleSave = () => onSave(keypoints);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            점잇기 편집 — {objectName} ({keypoints.length}개)
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

        {/* 에디터 본문 */}
        <div className="p-4">
          <div className="relative inline-block select-none" style={{ lineHeight: 0 }}>
            <img
              src={imageUrl}
              alt={objectName}
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
                {keypoints.map(
                  (kp, i) =>
                    i > 0 && (
                      <line
                        key={i}
                        x1={keypoints[i - 1].x}
                        y1={keypoints[i - 1].y}
                        x2={kp.x}
                        y2={kp.y}
                        stroke="rgba(124,58,237,0.5)"
                        strokeWidth="0.003"
                      />
                    )
                )}
              </svg>

              {/* 점 마커 */}
              {keypoints.map((kp, i) => (
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

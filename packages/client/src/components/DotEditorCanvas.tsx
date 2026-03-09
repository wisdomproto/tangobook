import React, { useState, useRef, useCallback } from 'react';
import type { DotKeypoint } from '@tangobook/shared';

interface DotEditorCanvasProps {
  imageUrl: string;
  imageAlt: string;
  keypoints: DotKeypoint[];
  onKeypointsChange: (keypoints: DotKeypoint[]) => void;
}

/**
 * 점잇기 편집 캔버스 (이미지 위에 점 추가/드래그/삭제).
 * DotEditorModal, KeyObjectDotEditorModal에서 공통 사용.
 */
export function DotEditorCanvas({
  imageUrl,
  imageAlt,
  keypoints,
  onKeypointsChange,
}: DotEditorCanvasProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragIdx !== null) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const hitRadius = 20 / rect.width;
    if (keypoints.some((kp) => Math.hypot(kp.x - nx, kp.y - ny) < hitRadius)) return;

    onKeypointsChange([...keypoints, { x: nx, y: ny, order: keypoints.length + 1 }]);
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
      onKeypointsChange(keypoints.map((kp, i) => (i === dragIdx ? { ...kp, x: nx, y: ny } : kp)));
    },
    [dragIdx, keypoints, onKeypointsChange]
  );

  const handleDotPointerUp = () => setDragIdx(null);

  const handleDotDoubleClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onKeypointsChange(
      keypoints.filter((_, i) => i !== idx).map((kp, i) => ({ ...kp, order: i + 1 }))
    );
  };

  return (
    <div>
      <div className="relative inline-block select-none" style={{ lineHeight: 0 }}>
        <img src={imageUrl} alt={imageAlt} className="max-w-full rounded-lg" draggable={false} />

        <div
          ref={overlayRef}
          className="absolute inset-0 cursor-crosshair"
          onClick={handleOverlayClick}
          onPointerMove={handleDotPointerMove}
          onPointerUp={handleDotPointerUp}
          style={{ touchAction: 'none' }}
        >
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
  );
}

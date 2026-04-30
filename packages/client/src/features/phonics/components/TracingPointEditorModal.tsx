import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/design-system';
import type { TracingPoint } from '@tangobook/shared';

const POINT_COLOR = '#10b981';
const POINT_COLOR_DRAG = '#3b82f6';
const LINE_COLOR = '#10b981';
const HIT_RADIUS = 0.03; // 정규화 좌표 기준 클릭 감지 반경

interface TracingPointEditorModalProps {
  imageUrl: string;
  word: string;
  initialPoints?: TracingPoint[];
  aspectRatio?: string;
  onSave: (points: TracingPoint[]) => void;
  onClose: () => void;
}

export function TracingPointEditorModal({
  imageUrl,
  word,
  initialPoints,
  aspectRatio,
  onSave,
  onClose,
}: TracingPointEditorModalProps) {
  const [points, setPoints] = useState<TracingPoint[]>(
    initialPoints ? initialPoints.map((p) => ({ ...p })) : []
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const didDragRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const toNorm = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const hitTest = useCallback(
    (nx: number, ny: number): number | null => {
      for (let i = points.length - 1; i >= 0; i--) {
        const dx = nx - points[i].x;
        const dy = ny - points[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < HIT_RADIUS) return i;
      }
      return null;
    },
    [points]
  );

  // --- 포인터 이벤트 ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const n = toNorm(e);
      const hit = hitTest(n.x, n.y);
      if (hit !== null) {
        setDragIdx(hit);
        didDragRef.current = false;
      }
    },
    [toNorm, hitTest]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragIdx === null) return;
      e.preventDefault();
      didDragRef.current = true;
      const n = toNorm(e);
      setPoints((prev) => {
        const next = [...prev];
        next[dragIdx] = { x: n.x, y: n.y };
        return next;
      });
    },
    [dragIdx, toNorm]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragIdx !== null) {
        // 드래그 없이 클릭만 했으면 → 아무것도 안 함 (포인트 선택만)
        setDragIdx(null);
        return;
      }
      // 빈 공간 클릭 → 포인트 추가
      const n = toNorm(e);
      const hit = hitTest(n.x, n.y);
      if (hit === null) {
        setPoints((prev) => [...prev, { x: n.x, y: n.y }]);
      }
    },
    [dragIdx, toNorm, hitTest]
  );

  // 더블클릭 → 포인트 삭제
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const n = toNorm(e);
      const hit = hitTest(n.x, n.y);
      if (hit !== null) {
        setPoints((prev) => prev.filter((_, i) => i !== hit));
      }
    },
    [toNorm, hitTest]
  );

  const handleSave = () => {
    onSave(points);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              점선 따라그리기 편집
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {word} &middot; {points.length}개 포인트
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleSave}>
              저장
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* 에디터 */}
        <div className="p-5">
          {/* 도움말 */}
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              클릭: 포인트 추가 &middot; 드래그: 이동 &middot; 더블클릭: 삭제
            </p>
          </div>

          {/* 이미지 + 오버레이 */}
          <div
            ref={overlayRef}
            className="relative select-none"
            style={{
              aspectRatio: aspectRatio || 'auto',
              cursor: dragIdx !== null ? 'grabbing' : 'crosshair',
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={imageUrl}
              alt={word}
              className="w-full h-full object-contain rounded-lg pointer-events-none"
              draggable={false}
            />
            {/* SVG 오버레이 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              {/* 점선 연결 */}
              {points.length >= 2 && (
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth={0.004}
                  strokeDasharray="0.012 0.006"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* 포인트 마커 */}
              {points.map((p, i) => {
                const isDragging = i === dragIdx;
                const r = isDragging ? 0.025 : 0.018;
                const fill = isDragging ? POINT_COLOR_DRAG : POINT_COLOR;
                return (
                  <g key={i}>
                    {/* 흰색 테두리 (가독성) */}
                    <circle cx={p.x} cy={p.y} r={r + 0.004} fill="white" opacity={0.8} />
                    <circle cx={p.x} cy={p.y} r={r} fill={fill} />
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={isDragging ? '0.022' : '0.016'}
                      fontWeight="bold"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPoints([])}
              disabled={points.length === 0}
            >
              전체 삭제
            </Button>
            {points.length > 0 && points.length < 2 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                최소 2개 포인트가 필요합니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

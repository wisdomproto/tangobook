import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/design-system';
import type { WordHotspot } from '@tangobook/shared';

const WORD_COLORS = [
  { bg: 'rgba(16,185,129,0.25)', border: '#10b981', text: '#065f46' },
  { bg: 'rgba(59,130,246,0.25)', border: '#3b82f6', text: '#1e3a8a' },
  { bg: 'rgba(245,158,11,0.25)', border: '#f59e0b', text: '#78350f' },
  { bg: 'rgba(168,85,247,0.25)', border: '#a855f7', text: '#581c87' },
];

const HANDLE_SIZE = 8; // 모서리 핸들 크기 (px)
const MIN_RECT = 0.03; // 최소 사각형 크기 (정규화)

interface HotspotEditorModalProps {
  imageUrl: string;
  words: { word: string; korean?: string; hotspot?: WordHotspot }[];
  /** CSS aspect-ratio (e.g. '16/9'). 지정 시 이미지를 해당 비율로 crop하여 편집 */
  aspectRatio?: string;
  onSave: (hotspots: (WordHotspot | undefined)[], order: number[]) => void;
  onClose: () => void;
}

type DragMode = 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export function HotspotEditorModal({
  imageUrl,
  words,
  aspectRatio,
  onSave,
  onClose,
}: HotspotEditorModalProps) {
  const [hotspots, setHotspots] = useState<(WordHotspot | undefined)[]>(
    words.map((w) => (w.hotspot ? { ...w.hotspot } : undefined))
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const dragOriginRef = useRef<{ mx: number; my: number; rect: WordHotspot } | null>(null);

  // 레이어 순서: displayOrder[0] = 가장 앞(위), displayOrder[N-1] = 가장 뒤
  const [displayOrder, setDisplayOrder] = useState<number[]>(words.map((_, i) => i));
  const [dragFromPos, setDragFromPos] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  const toNorm = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const color = (idx: number) => WORD_COLORS[idx % WORD_COLORS.length];

  // 클릭한 위치에 기존 핫스팟이 있는지 확인 (레이어 순서 우선)
  const hitTest = useCallback(
    (nx: number, ny: number): number | null => {
      for (const origIdx of displayOrder) {
        const h = hotspots[origIdx];
        if (!h) continue;
        if (nx >= h.x && nx <= h.x + h.w && ny >= h.y && ny <= h.y + h.h) return origIdx;
      }
      return null;
    },
    [hotspots, displayOrder]
  );

  // 모서리 히트 테스트 (px 기반)
  const cornerHitTest = useCallback((nx: number, ny: number, h: WordHotspot): DragMode => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const hpx = (HANDLE_SIZE + 4) / rect.width;
    const hpy = (HANDLE_SIZE + 4) / rect.height;

    if (Math.abs(nx - h.x) < hpx && Math.abs(ny - h.y) < hpy) return 'nw';
    if (Math.abs(nx - (h.x + h.w)) < hpx && Math.abs(ny - h.y) < hpy) return 'ne';
    if (Math.abs(nx - h.x) < hpx && Math.abs(ny - (h.y + h.h)) < hpy) return 'sw';
    if (Math.abs(nx - (h.x + h.w)) < hpx && Math.abs(ny - (h.y + h.h)) < hpy) return 'se';
    return null;
  }, []);

  // --- 포인터 이벤트 ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pt = toNorm(e);

    // 레이어 순서대로 모서리/본체 드래그 확인
    for (const origIdx of displayOrder) {
      const h = hotspots[origIdx];
      if (!h) continue;
      const corner = cornerHitTest(pt.x, pt.y, h);
      if (corner) {
        setSelectedIdx(origIdx);
        setDragMode(corner);
        dragOriginRef.current = { mx: pt.x, my: pt.y, rect: { ...h } };
        return;
      }
    }

    const hitIdx = hitTest(pt.x, pt.y);
    if (hitIdx !== null) {
      setSelectedIdx(hitIdx);
      setDragMode('move');
      dragOriginRef.current = { mx: pt.x, my: pt.y, rect: { ...hotspots[hitIdx]! } };
      return;
    }

    // 새 사각형 그리기 시작
    setDragMode('draw');
    setDrawStart(pt);
    setDrawCurrent(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragMode) return;
    e.preventDefault();
    const pt = toNorm(e);

    if (dragMode === 'draw') {
      setDrawCurrent(pt);
      return;
    }

    const origin = dragOriginRef.current!;
    const dx = pt.x - origin.mx;
    const dy = pt.y - origin.my;
    const r = origin.rect;

    setHotspots((prev) => {
      const next = [...prev];
      let updated: WordHotspot;

      if (dragMode === 'move') {
        updated = {
          x: Math.max(0, Math.min(1 - r.w, r.x + dx)),
          y: Math.max(0, Math.min(1 - r.h, r.y + dy)),
          w: r.w,
          h: r.h,
        };
      } else {
        // 리사이즈
        let nx = r.x,
          ny = r.y,
          nw = r.w,
          nh = r.h;
        if (dragMode === 'nw') {
          nx = r.x + dx;
          ny = r.y + dy;
          nw = r.w - dx;
          nh = r.h - dy;
        }
        if (dragMode === 'ne') {
          ny = r.y + dy;
          nw = r.w + dx;
          nh = r.h - dy;
        }
        if (dragMode === 'sw') {
          nx = r.x + dx;
          nw = r.w - dx;
          nh = r.h + dy;
        }
        if (dragMode === 'se') {
          nw = r.w + dx;
          nh = r.h + dy;
        }

        // 최소 크기 보장 + 범위 클램핑
        if (nw < MIN_RECT) {
          if (dragMode === 'nw' || dragMode === 'sw') nx = r.x + r.w - MIN_RECT;
          nw = MIN_RECT;
        }
        if (nh < MIN_RECT) {
          if (dragMode === 'nw' || dragMode === 'ne') ny = r.y + r.h - MIN_RECT;
          nh = MIN_RECT;
        }
        nx = Math.max(0, nx);
        ny = Math.max(0, ny);
        if (nx + nw > 1) nw = 1 - nx;
        if (ny + nh > 1) nh = 1 - ny;

        updated = { x: nx, y: ny, w: nw, h: nh };
      }

      next[selectedIdx] = updated;
      return next;
    });
  };

  const handlePointerUp = () => {
    if (dragMode === 'draw' && drawStart && drawCurrent) {
      const x1 = Math.min(drawStart.x, drawCurrent.x);
      const y1 = Math.min(drawStart.y, drawCurrent.y);
      const x2 = Math.max(drawStart.x, drawCurrent.x);
      const y2 = Math.max(drawStart.y, drawCurrent.y);
      const w = x2 - x1;
      const h = y2 - y1;

      if (w >= MIN_RECT && h >= MIN_RECT) {
        setHotspots((prev) => {
          const next = [...prev];
          next[selectedIdx] = { x: x1, y: y1, w, h };
          return next;
        });
      }
    }

    setDragMode(null);
    setDrawStart(null);
    setDrawCurrent(null);
    dragOriginRef.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = toNorm(e);
    const hitIdx = hitTest(pt.x, pt.y);
    if (hitIdx !== null) {
      setHotspots((prev) => {
        const next = [...prev];
        next[hitIdx] = undefined;
        return next;
      });
    }
  };

  const handleSave = () => onSave(hotspots, displayOrder);

  // 단어 버튼 드래그앤드롭 (레이어 순서 변경)
  const handleWordDragStart = (displayPos: number) => {
    setDragFromPos(displayPos);
  };

  const handleWordDragOver = (e: React.DragEvent, displayPos: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPos(displayPos);
  };

  const handleWordDrop = (displayPos: number) => {
    if (dragFromPos !== null && dragFromPos !== displayPos) {
      setDisplayOrder((prev) => {
        const next = [...prev];
        const [removed] = next.splice(dragFromPos, 1);
        next.splice(displayPos, 0, removed);
        return next;
      });
    }
    setDragFromPos(null);
    setDragOverPos(null);
  };

  const handleWordDragEnd = () => {
    setDragFromPos(null);
    setDragOverPos(null);
  };

  // 그리기 중인 임시 사각형
  const drawingRect =
    dragMode === 'draw' && drawStart && drawCurrent
      ? {
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          w: Math.abs(drawCurrent.x - drawStart.x),
          h: Math.abs(drawCurrent.y - drawStart.y),
        }
      : null;

  // SVG 렌더링 순서: 뒤쪽부터 → 앞쪽(레이어 상위)이 마지막에 그려져 위에 보임
  const svgRenderOrder = [...displayOrder].reverse();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">핫스팟 편집</h2>
          <div className="flex items-center gap-2">
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

        {/* 단어 선택 (드래그앤드롭으로 레이어 순서 변경) */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              레이어 순서
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              (드래그하여 변경 · 왼쪽 = 앞)
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {displayOrder.map((origIdx, displayPos) => {
              const w = words[origIdx];
              const c = color(origIdx);
              const hasHotspot = !!hotspots[origIdx];
              const isDragOver =
                dragOverPos === displayPos && dragFromPos !== null && dragFromPos !== displayPos;
              return (
                <button
                  key={origIdx}
                  draggable
                  onDragStart={() => handleWordDragStart(displayPos)}
                  onDragOver={(e) => handleWordDragOver(e, displayPos)}
                  onDragLeave={() => setDragOverPos(null)}
                  onDrop={() => handleWordDrop(displayPos)}
                  onDragEnd={handleWordDragEnd}
                  onClick={() => setSelectedIdx(origIdx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all cursor-grab active:cursor-grabbing ${
                    origIdx === selectedIdx ? 'ring-2 ring-offset-1 shadow-md' : ''
                  } ${isDragOver ? 'scale-105 shadow-lg' : ''}`}
                  style={{
                    borderColor: isDragOver ? '#6366f1' : c.border,
                    backgroundColor: origIdx === selectedIdx ? c.bg : 'transparent',
                    color: c.text,
                    ...(origIdx === selectedIdx
                      ? ({ '--tw-ring-color': c.border } as React.CSSProperties)
                      : {}),
                  }}
                >
                  <span className="text-[10px] text-slate-400 mr-0.5">{displayPos + 1}</span>
                  {hasHotspot ? '\u2705 ' : '\u2B1C '}
                  {w.word}
                  {w.korean ? ` (${w.korean})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 에디터 */}
        <div className="p-4">
          <div
            className="relative select-none overflow-hidden rounded-lg"
            style={
              aspectRatio
                ? { aspectRatio, lineHeight: 0 }
                : { display: 'inline-block', lineHeight: 0 }
            }
          >
            <img
              src={imageUrl}
              alt="illustration"
              className={aspectRatio ? 'w-full h-full object-cover' : 'max-w-full rounded-lg'}
              draggable={false}
            />

            {/* 오버레이 */}
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-crosshair"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                {/* 뒤쪽부터 렌더하여 앞쪽 레이어가 위에 표시 */}
                {svgRenderOrder.map((origIdx) => {
                  const h = hotspots[origIdx];
                  if (!h) return null;
                  const c = color(origIdx);
                  const isSelected = origIdx === selectedIdx;
                  const layerNum = displayOrder.indexOf(origIdx) + 1;
                  return (
                    <g key={origIdx}>
                      <rect
                        x={h.x}
                        y={h.y}
                        width={h.w}
                        height={h.h}
                        fill={c.bg}
                        stroke={c.border}
                        strokeWidth={isSelected ? 0.004 : 0.002}
                        strokeDasharray={isSelected ? 'none' : '0.008 0.004'}
                      />
                      <text
                        x={h.x + h.w / 2}
                        y={h.y + h.h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={c.text}
                        fontSize="0.03"
                        fontWeight="bold"
                      >
                        {words[origIdx].word}
                      </text>
                      {/* 레이어 번호 뱃지 */}
                      <circle
                        cx={h.x + h.w - 0.015}
                        cy={h.y + 0.015}
                        r={0.018}
                        fill={c.border}
                        opacity={0.9}
                      />
                      <text
                        x={h.x + h.w - 0.015}
                        y={h.y + 0.015}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="0.02"
                        fontWeight="bold"
                      >
                        {layerNum}
                      </text>
                      {/* 리사이즈 핸들 (선택 시) */}
                      {isSelected && (
                        <>
                          <rect
                            x={h.x - 0.008}
                            y={h.y - 0.008}
                            width={0.016}
                            height={0.016}
                            fill={c.border}
                            rx={0.003}
                          />
                          <rect
                            x={h.x + h.w - 0.008}
                            y={h.y - 0.008}
                            width={0.016}
                            height={0.016}
                            fill={c.border}
                            rx={0.003}
                          />
                          <rect
                            x={h.x - 0.008}
                            y={h.y + h.h - 0.008}
                            width={0.016}
                            height={0.016}
                            fill={c.border}
                            rx={0.003}
                          />
                          <rect
                            x={h.x + h.w - 0.008}
                            y={h.y + h.h - 0.008}
                            width={0.016}
                            height={0.016}
                            fill={c.border}
                            rx={0.003}
                          />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* 그리기 중인 임시 사각형 */}
                {drawingRect && (
                  <rect
                    x={drawingRect.x}
                    y={drawingRect.y}
                    width={drawingRect.w}
                    height={drawingRect.h}
                    fill={color(selectedIdx).bg}
                    stroke={color(selectedIdx).border}
                    strokeWidth={0.003}
                    strokeDasharray="0.008 0.004"
                  />
                )}
              </svg>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            단어 선택 후 드래그: 사각형 그리기 · 사각형 드래그: 이동 · 모서리 드래그: 크기 조정 ·
            더블클릭: 삭제 · 단어 버튼 드래그: 레이어 순서 변경
          </p>
        </div>
      </div>
    </div>
  );
}

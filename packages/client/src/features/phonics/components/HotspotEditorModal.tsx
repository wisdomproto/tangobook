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
  /** 단어 정보 + 그 단어의 기존 hotspots 목록 (multi). 단어 인덱스 = 외부 배열과 1:1. */
  words: { word: string; korean?: string; hotspots?: WordHotspot[] }[];
  /** CSS aspect-ratio (e.g. '16/9'). 지정 시 이미지를 해당 비율로 crop 하여 편집 */
  aspectRatio?: string;
  /** 저장: 각 단어의 새 hotspots[]. 단어 인덱스는 `order` 에 따라 재정렬됨. */
  onSave: (hotspotsByWord: WordHotspot[][], order: number[]) => void;
  onClose: () => void;
}

type DragMode = 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

/** 사각형 식별자 = (단어 idx, 그 단어 안 hotspot idx) */
interface RectId {
  w: number;
  i: number;
}

export function HotspotEditorModal({
  imageUrl,
  words,
  aspectRatio,
  onSave,
  onClose,
}: HotspotEditorModalProps) {
  // 단어별 hotspot 배열. words 배열과 1:1 인덱스 매칭.
  const [hotspotsByWord, setHotspotsByWord] = useState<WordHotspot[][]>(
    words.map((w) => (w.hotspots ? w.hotspots.map((h) => ({ ...h })) : []))
  );
  const [selectedWordIdx, setSelectedWordIdx] = useState(0);
  // 선택된 개별 사각형 (단어 idx, 사각형 idx). 없으면 null — drawing 모드.
  const [selectedRect, setSelectedRect] = useState<RectId | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const dragOriginRef = useRef<{ mx: number; my: number; rect: WordHotspot } | null>(null);

  // 레이어 순서 (단어 단위): displayOrder[0] = 가장 앞(위). 같은 단어의 hotspot 들은 같은 레이어.
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

  // 클릭한 위치에 어떤 단어의 어떤 사각형이 있는지 — 레이어 순서 우선
  const hitTest = useCallback(
    (nx: number, ny: number): RectId | null => {
      for (const wIdx of displayOrder) {
        const list = hotspotsByWord[wIdx] ?? [];
        // 같은 단어 안에선 뒤쪽 인덱스가 위 (push 순). 역순 검색.
        for (let i = list.length - 1; i >= 0; i--) {
          const h = list[i];
          if (nx >= h.x && nx <= h.x + h.w && ny >= h.y && ny <= h.y + h.h) {
            return { w: wIdx, i };
          }
        }
      }
      return null;
    },
    [hotspotsByWord, displayOrder]
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

    // 1) 선택된 사각형의 모서리 우선 (드래그 중 보이는 핸들만)
    if (selectedRect) {
      const h = hotspotsByWord[selectedRect.w]?.[selectedRect.i];
      if (h) {
        const corner = cornerHitTest(pt.x, pt.y, h);
        if (corner) {
          setDragMode(corner);
          dragOriginRef.current = { mx: pt.x, my: pt.y, rect: { ...h } };
          return;
        }
      }
    }

    // 2) 사각형 본체 hit-test
    const hit = hitTest(pt.x, pt.y);
    if (hit !== null) {
      setSelectedWordIdx(hit.w);
      setSelectedRect(hit);
      setDragMode('move');
      const h = hotspotsByWord[hit.w][hit.i];
      dragOriginRef.current = { mx: pt.x, my: pt.y, rect: { ...h } };
      return;
    }

    // 3) 빈 영역 → 선택된 단어에 새 사각형 추가
    setSelectedRect(null);
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

    if (!selectedRect) return;
    const origin = dragOriginRef.current!;
    const dx = pt.x - origin.mx;
    const dy = pt.y - origin.my;
    const r = origin.rect;

    setHotspotsByWord((prev) => {
      const next = prev.map((arr) => arr.slice());
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

      next[selectedRect.w][selectedRect.i] = updated;
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
        setHotspotsByWord((prev) => {
          const next = prev.map((arr) => arr.slice());
          next[selectedWordIdx] = [...next[selectedWordIdx], { x: x1, y: y1, w, h }];
          return next;
        });
        // 방금 그린 사각형을 자동 선택
        setSelectedRect({ w: selectedWordIdx, i: hotspotsByWord[selectedWordIdx]?.length ?? 0 });
      }
    }

    setDragMode(null);
    setDrawStart(null);
    setDrawCurrent(null);
    dragOriginRef.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = toNorm(e);
    const hit = hitTest(pt.x, pt.y);
    if (hit !== null) {
      setHotspotsByWord((prev) => {
        const next = prev.map((arr) => arr.slice());
        next[hit.w].splice(hit.i, 1);
        return next;
      });
      setSelectedRect(null);
    }
  };

  const handleSave = () => onSave(hotspotsByWord, displayOrder);

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

  // SVG 렌더링 순서: 뒤쪽부터 → 앞쪽이 마지막 (위에 표시)
  const svgRenderOrder = [...displayOrder].reverse();

  // 선택된 단어의 hotspot 모두 삭제
  const clearSelectedWordHotspots = () => {
    setHotspotsByWord((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[selectedWordIdx] = [];
      return next;
    });
    setSelectedRect(null);
  };

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
          <div className="flex gap-2 flex-wrap items-center">
            {displayOrder.map((origIdx, displayPos) => {
              const w = words[origIdx];
              const c = color(origIdx);
              const count = hotspotsByWord[origIdx]?.length ?? 0;
              const isDragOver =
                dragOverPos === displayPos && dragFromPos !== null && dragFromPos !== displayPos;
              const isSelected = origIdx === selectedWordIdx;
              return (
                <button
                  key={origIdx}
                  draggable
                  onDragStart={() => handleWordDragStart(displayPos)}
                  onDragOver={(e) => handleWordDragOver(e, displayPos)}
                  onDragLeave={() => setDragOverPos(null)}
                  onDrop={() => handleWordDrop(displayPos)}
                  onDragEnd={handleWordDragEnd}
                  onClick={() => {
                    setSelectedWordIdx(origIdx);
                    setSelectedRect(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all cursor-grab active:cursor-grabbing ${
                    isSelected ? 'ring-2 ring-offset-1 shadow-md' : ''
                  } ${isDragOver ? 'scale-105 shadow-lg' : ''}`}
                  style={{
                    borderColor: isDragOver ? '#6366f1' : c.border,
                    backgroundColor: isSelected ? c.bg : 'transparent',
                    color: c.text,
                    ...(isSelected ? ({ '--tw-ring-color': c.border } as React.CSSProperties) : {}),
                  }}
                >
                  <span className="text-[10px] text-slate-400 mr-0.5">{displayPos + 1}</span>
                  <span className="font-mono text-[10px] mr-1 opacity-70">×{count}</span>
                  {w.word}
                  {w.korean ? ` (${w.korean})` : ''}
                </button>
              );
            })}
            {/* 선택된 단어의 hotspot 전체 비우기 */}
            {(hotspotsByWord[selectedWordIdx]?.length ?? 0) > 0 && (
              <button
                onClick={clearSelectedWordHotspots}
                className="ml-auto text-xs px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                title={`"${words[selectedWordIdx]?.word}" 의 모든 핫스팟 삭제`}
              >
                선택 단어 비우기
              </button>
            )}
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
                  const list = hotspotsByWord[origIdx] ?? [];
                  if (list.length === 0) return null;
                  const c = color(origIdx);
                  const layerNum = displayOrder.indexOf(origIdx) + 1;
                  return (
                    <g key={origIdx}>
                      {list.map((h, hIdx) => {
                        const isSelected = selectedRect?.w === origIdx && selectedRect?.i === hIdx;
                        const isWordSelected = origIdx === selectedWordIdx;
                        return (
                          <g key={hIdx}>
                            <rect
                              x={h.x}
                              y={h.y}
                              width={h.w}
                              height={h.h}
                              fill={c.bg}
                              stroke={c.border}
                              strokeWidth={isSelected ? 0.005 : isWordSelected ? 0.003 : 0.0018}
                              strokeDasharray={
                                isSelected ? 'none' : isWordSelected ? 'none' : '0.008 0.004'
                              }
                              opacity={isWordSelected ? 1 : 0.55}
                            />
                            {/* 단어 라벨 (한 단어 첫 사각형에만 — 시각적 혼잡 줄임) */}
                            {hIdx === 0 && (
                              <text
                                x={h.x + h.w / 2}
                                y={h.y + h.h / 2}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={c.text}
                                fontSize="0.03"
                                fontWeight="bold"
                                opacity={isWordSelected ? 1 : 0.5}
                              >
                                {words[origIdx].word}
                              </text>
                            )}
                            {/* 레이어/카운트 뱃지 (한 단어의 모든 사각형에 표기) */}
                            <circle
                              cx={h.x + h.w - 0.015}
                              cy={h.y + 0.015}
                              r={0.018}
                              fill={c.border}
                              opacity={isWordSelected ? 0.95 : 0.5}
                            />
                            <text
                              x={h.x + h.w - 0.015}
                              y={h.y + 0.015}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize="0.018"
                              fontWeight="bold"
                            >
                              {layerNum}
                              {list.length > 1 ? `.${hIdx + 1}` : ''}
                            </text>
                            {/* 리사이즈 핸들 (선택된 개별 사각형에만) */}
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
                    fill={color(selectedWordIdx).bg}
                    stroke={color(selectedWordIdx).border}
                    strokeWidth={0.003}
                    strokeDasharray="0.008 0.004"
                  />
                )}
              </svg>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            단어 선택 후 빈 영역 드래그: <b>새 사각형 추가 (여러 개 가능)</b> · 사각형 드래그: 이동
            · 모서리 드래그: 크기 조정 · 더블클릭: 해당 사각형 삭제 · 단어 버튼 드래그: 레이어 순서
            변경
          </p>
        </div>
      </div>
    </div>
  );
}

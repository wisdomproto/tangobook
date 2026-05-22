import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import type { TracingStroke } from '@tangobook/shared';

const LETTER_FILL = '#d4d4d8'; // zinc-300 — 가이드 글자
const PEN_COLOR = '#10b981'; // 사용자 stroke 선 (emerald)
const PEN_INVALID_COLOR = '#cbd5e1'; // 무효 stroke (slate-300) — pointer-up 후 페이드
const DOT_FILL = '#f59e0b'; // amber — 아직 안 통과한 stroke 의 점
const DOT_TAPPED_FILL = '#10b981'; // emerald — 통과한 stroke 의 점
const FONT_FAMILY = 'system-ui, sans-serif';

// 점 hit 반경 (정규화 좌표). 손가락 두께 + 글자 stroke 두께 보상.
const HIT_RADIUS = 0.13;

interface Props {
  letter: string;
  strokes: readonly TracingStroke[];
  /** true 면 strokes[0]→[1]→... 순서대로만 통과 + 한 번에 한 stroke 점만 노출. false 면 자유 순서. 기본 true. */
  enforceOrder?: boolean;
  onComplete: () => void;
}

interface DrawnStroke {
  pts: { x: number; y: number }[];
  /**
   * 'drawing' = pointer-down ~ up 중. emerald 선명.
   * 'invalid' = pointer-up 후 매칭 실패. 회색 페이드 (500ms 후 사라짐).
   * 'matched' = 통과 (matchedStrokeIdx 세팅). completedStrokes 로 옮겨짐.
   */
  status: 'drawing' | 'invalid' | 'matched';
  matchedStrokeIdx: number | null;
}

/**
 * 알파벳 글자 따라쓰기 — stroke 단위 채점.
 *
 * 채점 단순화 (2026-05-22):
 * - pointer-down→up 한 번 = 한 stroke 시도.
 * - 그 안에서 어떤 stroke 의 "모든 점" 을 path 가 통과하면 그 stroke 통과.
 * - 시작점이 시작에서 hit 될 필요 X / 끝점이 끝에서 hit 될 필요 X. 그냥 점 통과 only.
 *
 * 모드:
 * - `enforceOrder = false` (기본): 어느 stroke 부터든 그려도 OK. 모든 stroke 통과 → 완성.
 * - `enforceOrder = true`: 현재 currentIdx 의 stroke 만 시도. 통과 → 다음.
 */
export function LetterTracingCanvas({ letter, strokes, enforceOrder = true, onComplete }: Props) {
  const [completedStrokes, setCompletedStrokes] = useState<DrawnStroke[]>([]);
  const [currentDraw, setCurrentDraw] = useState<DrawnStroke | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0); // enforceOrder 모드에서만 의미
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  // pointer move/up 콜백의 stale closure 방지용 ref.
  // setCurrentDraw state 만으로는 down→move 사이 시차에 move 가 무시될 수 있어 ref 추적 필요.
  const drawingRef = useRef(false);
  const currentDrawRef = useRef<DrawnStroke | null>(null);
  const completedIdxSetRef = useRef<Set<number>>(new Set());
  const currentIdxRef = useRef(0);

  // letter / strokes / enforceOrder 변경 시 reset
  useEffect(() => {
    setCompletedStrokes([]);
    setCurrentDraw(null);
    setCurrentIdx(0);
    completedRef.current = false;
    drawingRef.current = false;
    currentDrawRef.current = null;
    completedIdxSetRef.current = new Set();
    currentIdxRef.current = 0;
  }, [letter, strokes, enforceOrder]);

  // 통과한 stroke 인덱스 set (점 색 변화용)
  const completedIdxSet = useMemo(() => {
    const s = new Set<number>();
    completedStrokes.forEach((d) => {
      if (d.matchedStrokeIdx !== null) s.add(d.matchedStrokeIdx);
    });
    return s;
  }, [completedStrokes]);
  // ref 동기화 — pointer up 콜백에서 stale 없이 읽기 위함
  completedIdxSetRef.current = completedIdxSet;
  currentIdxRef.current = currentIdx;

  // 현재 stroke 의 가이드 점 idx — 다음 그릴 점.
  // drawing 중 통과한 점 중 가장 큰 idx + 1 = 다음 점. drawing 안 함 → 0 (첫 점).
  // enforceOrder 모드에서만 의미 (자유 모드는 가이드 X).
  const currentGuidePi = useMemo(() => {
    if (!enforceOrder) return -1;
    if (currentIdx >= strokes.length) return -1;
    const stroke = strokes[currentIdx];
    if (!stroke) return -1;
    if (!currentDraw || currentDraw.status !== 'drawing') return 0;
    let lastHit = -1;
    for (let i = 0; i < stroke.points.length; i++) {
      if (pathPassesNear(currentDraw.pts, stroke.points[i], HIT_RADIUS)) {
        lastHit = i;
      }
    }
    const next = lastHit + 1;
    return next < stroke.points.length ? next : -1;
  }, [enforceOrder, currentIdx, strokes, currentDraw]);

  const toNorm = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  // drawnPath 가 stroke 의 모든 점을 통과했는가?
  const pathCoversAllPoints = useCallback(
    (drawnPath: { x: number; y: number }[], stroke: TracingStroke): boolean => {
      if (drawnPath.length < 2) return false;
      // loop: 첫 점 = 끝 점 → unique 점만 검사 (둘 다 같은 좌표라 한 번 통과해도 됨)
      for (const p of stroke.points) {
        if (!pathPassesNear(drawnPath, p, HIT_RADIUS)) return false;
      }
      return true;
    },
    []
  );

  const updateCurrentDraw = useCallback(
    (updater: DrawnStroke | null | ((prev: DrawnStroke | null) => DrawnStroke | null)) => {
      setCurrentDraw((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        currentDrawRef.current = next;
        return next;
      });
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (completedRef.current || strokes.length === 0) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const n = toNorm(e);
      drawingRef.current = true;
      updateCurrentDraw({ pts: [n], status: 'drawing', matchedStrokeIdx: null });
    },
    [strokes, toNorm, updateCurrentDraw]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drawingRef.current || completedRef.current) return;
      e.preventDefault();
      const n = toNorm(e);
      updateCurrentDraw((prev) => (prev ? { ...prev, pts: [...prev.pts, n] } : prev));
    },
    [toNorm, updateCurrentDraw]
  );

  const handlePointerUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const draw = currentDrawRef.current;
    if (!draw) return;

    // 매칭 대상 stroke idx 찾기
    let matchedIdx: number | null = null;
    if (enforceOrder) {
      const target = strokes[currentIdxRef.current];
      if (target && pathCoversAllPoints(draw.pts, target)) {
        matchedIdx = currentIdxRef.current;
      }
    } else {
      for (let i = 0; i < strokes.length; i++) {
        if (completedIdxSetRef.current.has(i)) continue;
        if (pathCoversAllPoints(draw.pts, strokes[i])) {
          matchedIdx = i;
          break;
        }
      }
    }

    if (matchedIdx !== null) {
      const finalized: DrawnStroke = { ...draw, status: 'matched', matchedStrokeIdx: matchedIdx };
      setCompletedStrokes((prev) => [...prev, finalized]);
      updateCurrentDraw(null);
      if (enforceOrder) setCurrentIdx((idx) => idx + 1);

      const newSize = completedIdxSetRef.current.size + 1;
      if (newSize >= strokes.length) {
        completedRef.current = true;
        onComplete();
      }
    } else {
      // 무효 — 회색 페이드 후 사라짐
      const invalid: DrawnStroke = { ...draw, status: 'invalid', matchedStrokeIdx: null };
      updateCurrentDraw(invalid);
      setTimeout(() => {
        if (currentDrawRef.current === invalid) updateCurrentDraw(null);
      }, 500);
    }
  }, [enforceOrder, strokes, pathCoversAllPoints, onComplete, updateCurrentDraw]);

  // SVG path 로 변환
  const strokeToPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none bg-white rounded-2xl border-2 border-slate-200 mx-auto w-full"
      style={{
        aspectRatio: '1 / 1',
        cursor: completedRef.current || strokes.length === 0 ? 'default' : 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        {/* 큰 글자 배경 */}
        <text
          x="0.5"
          y="0.55"
          textAnchor="middle"
          dominantBaseline="central"
          fill={LETTER_FILL}
          fontSize="0.85"
          fontWeight="900"
          fontFamily={FONT_FAMILY}
        >
          {letter}
        </text>

        {/* 통과한 stroke (emerald 영구) */}
        {completedStrokes.map((s, i) => (
          <path
            key={i}
            d={strokeToPath(s.pts)}
            fill="none"
            stroke={PEN_COLOR}
            strokeWidth={0.03}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* 현재 그리는 중 (emerald 선명) / 방금 무효 처리된 stroke (회색 페이드) */}
        {currentDraw && (
          <path
            d={strokeToPath(currentDraw.pts)}
            fill="none"
            stroke={currentDraw.status === 'invalid' ? PEN_INVALID_COLOR : PEN_COLOR}
            strokeWidth={0.03}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={currentDraw.status === 'invalid' ? 0.6 : 1}
          />
        )}

        {/* stroke 점들 렌더 분기:
            - 순서 강제 모드 → 현재 차례 stroke 의 점만 표시 (통과 stroke 의 점도 숨김 — 그어진 emerald 선이 이미 시각 피드백).
              현재 stroke 의 시작점(pi=0) 은 큰 amber + ring 으로 pulse 강조.
            - 자유 모드 → 통과 stroke 점은 emerald, 미통과 stroke 점은 모두 amber. 시작점 강조 X. */}
        {strokes.map((stroke, si) => {
          const isCompleted = completedIdxSet.has(si);
          const isCurrent = enforceOrder && si === currentIdx;
          // 순서 강제 모드에서는 현재 차례 stroke 점만 노출
          if (enforceOrder && si !== currentIdx) return null;
          return stroke.points.map((p, pi) => {
            // drawing 중 path 가 이 점을 지나갔으면 즉시 emerald 로 변경 (실시간 시각 피드백)
            const isTappedNow =
              currentDraw !== null &&
              currentDraw.status === 'drawing' &&
              pathPassesNear(currentDraw.pts, p, HIT_RADIUS);
            const fill = isCompleted || isTappedNow ? DOT_TAPPED_FILL : DOT_FILL;
            // loop 의 마지막 점 = 첫 점 → 한 번만 그림
            if (
              stroke.type === 'loop' &&
              pi === stroke.points.length - 1 &&
              stroke.points.length >= 2 &&
              Math.hypot(stroke.points[0].x - p.x, stroke.points[0].y - p.y) < 0.001
            ) {
              return null;
            }
            // 가이드 점 (다음 그릴 점) 만 큰 사이즈 + pulse. drawing 진행되면서 자동 이동.
            const isGuidePoint = isCurrent && pi === currentGuidePi;
            return (
              <g key={`${si}-${pi}`}>
                <circle cx={p.x} cy={p.y} r={isGuidePoint ? 0.05 : 0.034} fill="white" />
                <circle cx={p.x} cy={p.y} r={isGuidePoint ? 0.04 : 0.028} fill={fill}>
                  {isGuidePoint && (
                    <animate
                      attributeName="r"
                      values="0.04;0.052;0.04"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                {isGuidePoint && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={0.07}
                    fill="none"
                    stroke={DOT_FILL}
                    strokeWidth={0.005}
                    opacity={0.5}
                  >
                    <animate
                      attributeName="r"
                      values="0.06;0.09;0.06"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.1;0.6"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          });
        })}
      </svg>

      {strokes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="text-3xl opacity-40">📍</div>
          <div className="text-xs font-bold text-slate-400 text-center px-3">
            저작도구에서 스트로크를 만들어주세요
          </div>
        </div>
      )}
    </div>
  );
}

// drawnPath (선분 chain) 의 어느 선분이 target 점에 radius 이내로 접근하는가
function pathPassesNear(
  drawnPath: { x: number; y: number }[],
  target: { x: number; y: number },
  radius: number
): boolean {
  for (let i = 1; i < drawnPath.length; i++) {
    const a = drawnPath[i - 1];
    const b = drawnPath[i];
    if (distToSegment(target, a, b) <= radius) return true;
  }
  return false;
}

function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const ex = p.x - cx;
  const ey = p.y - cy;
  return Math.sqrt(ex * ex + ey * ey);
}

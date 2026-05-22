import { useState, useRef, useCallback, useMemo } from 'react';
import type * as React from 'react';
import { Button } from '@/design-system';
import type { LetterTracingData, TracingStroke, TracingStrokeType } from '@tangobook/shared';
import { LetterTracingCanvas } from '@/features/phonics-learner/activities/LetterTracingCanvas';

// 점 hit-test 반경 (정규화 좌표)
const POINT_HIT_RADIUS = 0.03;
// loop 닫기 자동 trigger 반경 — 마지막 점이 첫 점에 이 정도 가까우면 자동 close
const LOOP_CLOSE_RADIUS = 0.05;
// snap-to-grid 간격 (정규화 좌표). 40×40 격자 → 점 좌표가 0.025 배수로 정렬.
const GRID_STEP = 0.025;

function snap(c: number): number {
  return Math.round(c / GRID_STEP) * GRID_STEP;
}
function snapPoint(p: { x: number; y: number }): { x: number; y: number } {
  return { x: snap(p.x), y: snap(p.y) };
}

const LETTER_FILL = '#d4d4d8'; // zinc-300 — 가이드
const LETTER_FONT_FAMILY = 'system-ui, sans-serif';

// 스트로크별 색 — 시각적 그룹핑
const STROKE_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];
const PENDING_COLOR = '#0ea5e9'; // sky — 작성 중

interface LetterTracingPointEditorModalProps {
  letter: string;
  pairLabel?: string;
  /** 기존 데이터 (편집 시작 시 불러옴). 없으면 빈 strokes + enforceOrder=false. */
  initialData?: LetterTracingData;
  onSave: (data: LetterTracingData) => void;
  onClose: () => void;
  /** 저장 버튼 라벨 override. 기본 "저장". bulk editor 에서는 "이 글자 저장" 같이 명확화. */
  saveLabel?: string;
}

interface PendingStroke {
  type: TracingStrokeType;
  points: { x: number; y: number }[];
}

/**
 * 알파벳 글자 따라쓰기 — 스트로크 단위 편집기 (2026-05-22 신모델).
 *
 * 작성 흐름:
 * 1. 우측 상단에서 stroke type 선택 (line/bend/loop)
 * 2. 캔버스 클릭으로 점 추가 — 현재 작성 중 stroke 에 들어감
 *    - line (2점): 2번째 클릭 → 자동 finalize → 다음 stroke 으로
 *    - bend (3점): 3번째 클릭 → 자동 finalize
 *    - loop (3+점): "🔚 닫기" 버튼으로 명시적 finalize (시작=끝 좌표 자동 추가)
 * 3. 기존 점 드래그 → 이동 / 더블클릭 → 그 stroke 전체 삭제
 *
 * 우측 패널: LetterTracingCanvas 미리보기 (학습자 view).
 */
export function LetterTracingPointEditorModal({
  letter,
  pairLabel,
  initialData,
  onSave,
  onClose,
  saveLabel = '저장',
}: LetterTracingPointEditorModalProps) {
  const [strokes, setStrokes] = useState<TracingStroke[]>(
    initialData?.strokes
      ? initialData.strokes.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p })) }))
      : []
  );
  const [enforceOrder, setEnforceOrder] = useState<boolean>(initialData?.enforceOrder ?? true);
  const [pending, setPending] = useState<PendingStroke>({ type: 'line', points: [] });
  // 드래그 대상: { strokeIdx | null (pending), pointIdx }. strokeIdx=null → pending stroke 의 점.
  const [drag, setDrag] = useState<{ strokeIdx: number | null; pointIdx: number } | null>(null);
  // 선택된 stroke 인덱스 — 겹친 점 잡기용. null = 전체. pending 작성 중에는 무시.
  const [selectedStrokeIdx, setSelectedStrokeIdx] = useState<number | null>(null);
  const didDragRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const maxPointsForType: Record<TracingStrokeType, number | null> = {
    line: 2,
    bend: 3,
    loop: null, // 무제한 (사용자가 명시적 닫기)
  };

  const toNorm = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  // 모든 점 (확정 stroke + pending) 을 평탄화해서 hit-test.
  // selectedStrokeIdx 있으면 그 stroke 점만 hit (겹친 점 잡기).
  const hitTest = useCallback(
    (nx: number, ny: number): { strokeIdx: number | null; pointIdx: number } | null => {
      // pending 먼저 검사 (위에 그려져 있어서) — pending 은 항상 hit 가능
      for (let i = pending.points.length - 1; i >= 0; i--) {
        const p = pending.points[i];
        if (Math.hypot(nx - p.x, ny - p.y) < POINT_HIT_RADIUS) {
          return { strokeIdx: null, pointIdx: i };
        }
      }
      // 확정 stroke 검사 — selectedStrokeIdx 있으면 그 stroke 만
      const strokeIdxs =
        selectedStrokeIdx !== null
          ? [selectedStrokeIdx]
          : Array.from({ length: strokes.length }, (_, i) => strokes.length - 1 - i);
      for (const si of strokeIdxs) {
        const stroke = strokes[si];
        if (!stroke) continue;
        const sp = stroke.points;
        for (let pi = sp.length - 1; pi >= 0; pi--) {
          // loop 마지막 점 = 첫 점이라 첫 점 hit 시 둘 다 같이 잡힘 — 첫 점만 반환
          if (
            stroke.type === 'loop' &&
            pi === sp.length - 1 &&
            sp.length >= 2 &&
            Math.hypot(sp[0].x - sp[pi].x, sp[0].y - sp[pi].y) < 0.001
          ) {
            continue;
          }
          const p = sp[pi];
          if (Math.hypot(nx - p.x, ny - p.y) < POINT_HIT_RADIUS) {
            return { strokeIdx: si, pointIdx: pi };
          }
        }
      }
      return null;
    },
    [strokes, pending, selectedStrokeIdx]
  );

  // pending 자동 finalize — line/bend 가 max 점 도달 시
  const finalizeIfMax = useCallback((next: PendingStroke) => {
    const max = maxPointsForType[next.type];
    if (max !== null && next.points.length >= max) {
      // commit
      setStrokes((prev) => [...prev, { type: next.type, points: next.points }]);
      setPending({ type: next.type, points: [] });
      return true;
    }
    return false;
  }, []);

  // 점 추가 — 빈 곳 클릭 / 기존 점 위 클릭 (드래그 없이) 둘 다 호출.
  // loop 자동 close 우선 검사 후 일반 점 추가.
  const addPointToPending = useCallback(
    (coord: { x: number; y: number }) => {
      if (pending.type === 'loop' && pending.points.length >= 3) {
        const first = pending.points[0];
        if (Math.hypot(coord.x - first.x, coord.y - first.y) < LOOP_CLOSE_RADIUS) {
          const closed = [...pending.points, { x: first.x, y: first.y }];
          setStrokes((prev) => [...prev, { type: 'loop', points: closed }]);
          setPending({ type: 'loop', points: [] });
          return;
        }
      }
      const nextPts = [...pending.points, coord];
      const next: PendingStroke = { type: pending.type, points: nextPts };
      if (!finalizeIfMax(next)) {
        setPending(next);
      }
    },
    [pending, finalizeIfMax]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const n = toNorm(e);
      const hit = hitTest(n.x, n.y);
      if (hit !== null) {
        setDrag(hit);
        didDragRef.current = false;
      }
    },
    [toNorm, hitTest]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drag === null) return;
      e.preventDefault();
      didDragRef.current = true;
      const n = snapPoint(toNorm(e));
      if (drag.strokeIdx === null) {
        setPending((prev) => {
          const pts = [...prev.points];
          pts[drag.pointIdx] = n;
          return { ...prev, points: pts };
        });
      } else {
        setStrokes((prev) => {
          const next = [...prev];
          const s = { ...next[drag.strokeIdx!] };
          const pts = [...s.points];
          pts[drag.pointIdx] = n;
          // loop 의 첫/마지막 점 동기화
          if (s.type === 'loop') {
            if (drag.pointIdx === 0) pts[pts.length - 1] = n;
            if (drag.pointIdx === pts.length - 1) pts[0] = n;
          }
          s.points = pts;
          next[drag.strokeIdx!] = s;
          return next;
        });
      }
    },
    [drag, toNorm]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const n = toNorm(e);
      if (drag !== null) {
        const wasDragging = didDragRef.current;
        const dragInfo = drag;
        setDrag(null);
        didDragRef.current = false;
        if (wasDragging) return;
        // 드래그 없이 그냥 누름 → 같은 자리에 pending 새 점 추가.
        // 기존 점의 정확한 좌표 사용 (pointer 좌표 살짝 다를 수 있어서).
        const targetPoint =
          dragInfo.strokeIdx === null
            ? pending.points[dragInfo.pointIdx]
            : strokes[dragInfo.strokeIdx]?.points[dragInfo.pointIdx];
        if (targetPoint) addPointToPending({ x: targetPoint.x, y: targetPoint.y });
        return;
      }
      addPointToPending(snapPoint(n));
    },
    [toNorm, drag, pending, strokes, addPointToPending]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const n = toNorm(e);
      const hit = hitTest(n.x, n.y);
      if (hit === null) return;
      if (hit.strokeIdx === null) {
        // pending 점 하나만 삭제
        setPending((prev) => ({
          ...prev,
          points: prev.points.filter((_, i) => i !== hit.pointIdx),
        }));
      } else {
        // 확정 stroke 전체 삭제 (점 하나만 빼면 type 위반)
        setStrokes((prev) => prev.filter((_, i) => i !== hit.strokeIdx!));
      }
    },
    [toNorm, hitTest]
  );

  const handleTypeChange = useCallback((newType: TracingStrokeType) => {
    setPending((prev) => {
      const max = maxPointsForType[newType];
      const pts =
        max !== null && prev.points.length > max ? prev.points.slice(0, max) : prev.points;
      return { type: newType, points: pts };
    });
  }, []);

  const handleClearPending = useCallback(() => {
    setPending((prev) => ({ ...prev, points: [] }));
  }, []);

  const handleCloseLoop = useCallback(() => {
    if (pending.type !== 'loop' || pending.points.length < 3) return;
    const first = pending.points[0];
    const closed = [...pending.points, { x: first.x, y: first.y }];
    setStrokes((prev) => [...prev, { type: 'loop', points: closed }]);
    setPending({ type: 'loop', points: [] });
  }, [pending]);

  // 미리보기에 사용할 strokes (작성 중 pending 은 제외 — 학습자 view 는 확정만)
  const previewStrokes = useMemo(() => strokes, [strokes]);

  const totalPoints = strokes.reduce((sum, s) => sum + s.points.length, 0) + pending.points.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl flex flex-col"
        style={{
          width: 'min(95vw, 1100px)',
          maxHeight: 'min(95vh, 900px)',
        }}
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              글자 스트로크 편집 — <span className="text-amber-600">{letter}</span>
              {pairLabel && (
                <span className="ml-2 text-sm font-normal text-slate-400">({pairLabel})</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {strokes.length}개 stroke / {totalPoints}개 점
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => onSave({ strokes, enforceOrder })}>
              {saveLabel}
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto min-h-0">
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              ① 위 toolbar 에서 stroke 종류 선택 → ② 캔버스 클릭으로 점 찍기. line=2점, bend=3점은
              자동 다음 stroke / loop 은 3점+ 후 첫 점 클릭 (또는 🔚 닫기) → ③ 드래그 이동 ·
              더블클릭 삭제 (stroke 전체)
            </p>
          </div>

          {/* toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs font-bold text-slate-500 mr-1">스트로크:</span>
            <TypePill
              active={pending.type === 'line'}
              label="ㅡ 직선 (2점)"
              onClick={() => handleTypeChange('line')}
            />
            <TypePill
              active={pending.type === 'bend'}
              label="⤵ 꺾임 (3점)"
              onClick={() => handleTypeChange('bend')}
            />
            <TypePill
              active={pending.type === 'loop'}
              label="⭕ 순환 (3+점)"
              onClick={() => handleTypeChange('loop')}
            />
            <div className="flex-1" />
            <span className="text-xs text-slate-400">
              현재 작성 중: {pending.points.length}점
              {pending.type !== 'loop' && ` / ${maxPointsForType[pending.type]}`}
            </span>
            {pending.type === 'loop' && pending.points.length >= 3 && (
              <button
                onClick={handleCloseLoop}
                className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              >
                🔚 닫기
              </button>
            )}
            {pending.points.length > 0 && (
              <button
                onClick={handleClearPending}
                className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                작성 취소
              </button>
            )}
          </div>

          {/* 옵션: 순서 강제 토글 */}
          <div className="mb-3 flex items-center gap-2 px-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceOrder}
                onChange={(e) => setEnforceOrder(e.target.checked)}
                className="w-4 h-4 accent-coral-500"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                순서 강제
              </span>
              <span className="text-xs text-slate-400">
                {enforceOrder
                  ? '학습자가 1→2→3 순서대로 그려야 통과'
                  : '학습자가 어떤 stroke 부터 그려도 OK'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* === 편집 영역 === */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  ✏️ 편집
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStrokes([]);
                    setPending({ type: pending.type, points: [] });
                  }}
                  disabled={strokes.length === 0 && pending.points.length === 0}
                  className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-30 disabled:hover:text-red-500"
                >
                  🗑️ 전체 삭제
                </button>
              </div>
              <div
                ref={overlayRef}
                className="relative select-none bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 mx-auto"
                style={{
                  aspectRatio: '1 / 1',
                  maxWidth: 'min(380px, 50vh)',
                  cursor: drag !== null ? 'grabbing' : 'crosshair',
                  touchAction: 'none',
                }}
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
                  {/* 글자 배경 */}
                  <text
                    x="0.5"
                    y="0.55"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={LETTER_FILL}
                    fontSize="0.85"
                    fontWeight="900"
                    fontFamily={LETTER_FONT_FAMILY}
                  >
                    {letter}
                  </text>

                  {/* snap 그리드 라인 — 40×40 (0.025 간격). 5칸마다 (0.125) 진하게 major, 중심선 (0.5) 가장 진하게. */}
                  <g opacity={0.35}>
                    {Array.from({ length: 41 }, (_, i) => {
                      const v = i * GRID_STEP;
                      const isCenter = Math.abs(v - 0.5) < 1e-6;
                      const isMajor = i % 5 === 0;
                      return (
                        <line
                          key={`v${i}`}
                          x1={v}
                          y1={0}
                          x2={v}
                          y2={1}
                          stroke={isCenter ? '#94a3b8' : isMajor ? '#a8b3c1' : '#d6dde6'}
                          strokeWidth={isCenter ? 0.003 : isMajor ? 0.0015 : 0.0008}
                        />
                      );
                    })}
                    {Array.from({ length: 41 }, (_, i) => {
                      const v = i * GRID_STEP;
                      const isCenter = Math.abs(v - 0.5) < 1e-6;
                      const isMajor = i % 5 === 0;
                      return (
                        <line
                          key={`h${i}`}
                          x1={0}
                          y1={v}
                          x2={1}
                          y2={v}
                          stroke={isCenter ? '#94a3b8' : isMajor ? '#a8b3c1' : '#d6dde6'}
                          strokeWidth={isCenter ? 0.003 : isMajor ? 0.0015 : 0.0008}
                        />
                      );
                    })}
                  </g>

                  {/* 확정 stroke 들 — 점 + 번호만 (점 사이 연결선 X). 선택된 stroke 만 진하게, 나머지 흐림. */}
                  {strokes.map((s, si) => {
                    const color = STROKE_COLORS[si % STROKE_COLORS.length];
                    const pts = s.points;
                    const isSelected = selectedStrokeIdx === null || selectedStrokeIdx === si;
                    return (
                      <g key={si} opacity={isSelected ? 1 : 0.25}>
                        {pts.map((p, pi) => {
                          // loop 마지막 점 = 첫 점 → 시각 중복 방지
                          if (
                            s.type === 'loop' &&
                            pi === pts.length - 1 &&
                            pts.length >= 2 &&
                            Math.hypot(pts[0].x - p.x, pts[0].y - p.y) < 0.001
                          ) {
                            return null;
                          }
                          return (
                            <g key={pi}>
                              {/* 학습자 화면과 동일 사이즈 (outer 0.034 / fill 0.028) — 실제 보일 크기 그대로 편집 */}
                              <circle cx={p.x} cy={p.y} r={0.034} fill="white" />
                              <circle cx={p.x} cy={p.y} r={0.028} fill={color} />
                              <text
                                x={p.x}
                                y={p.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize="0.02"
                                fontWeight="bold"
                              >
                                {si + 1}.{pi + 1}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* pending stroke — sky 색 점 + 번호만 (연결선 X) */}
                  {pending.points.length > 0 && (
                    <g>
                      {pending.points.map((p, pi) => (
                        <g key={pi}>
                          {/* 학습자 화면 사이즈와 동일 (outer 0.034 / fill 0.028) */}
                          <circle cx={p.x} cy={p.y} r={0.034} fill="white" />
                          <circle cx={p.x} cy={p.y} r={0.028} fill={PENDING_COLOR}>
                            {pi === 0 && pending.type === 'loop' && pending.points.length >= 3 && (
                              <animate
                                attributeName="r"
                                values="0.028;0.036;0.028"
                                dur="1s"
                                repeatCount="indefinite"
                              />
                            )}
                          </circle>
                          <text
                            x={p.x}
                            y={p.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="0.022"
                            fontWeight="bold"
                          >
                            {pi + 1}
                          </text>
                        </g>
                      ))}
                    </g>
                  )}
                </svg>
              </div>

              {/* stroke 리스트 — 클릭=선택(겹친 점 잡기) / 삭제 버튼. */}
              {strokes.length > 0 && (
                <div className="mt-3 space-y-1">
                  {selectedStrokeIdx !== null && (
                    <button
                      onClick={() => setSelectedStrokeIdx(null)}
                      className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 mb-1"
                    >
                      ✕ stroke 선택 해제 (전체 보기)
                    </button>
                  )}
                  {strokes.map((s, si) => {
                    const color = STROKE_COLORS[si % STROKE_COLORS.length];
                    const isSelected = selectedStrokeIdx === si;
                    return (
                      <div
                        key={si}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400'
                            : 'bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setSelectedStrokeIdx((prev) => (prev === si ? null : si))}
                        title="클릭 = 이 stroke 만 선택 (겹친 점 잡기)"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: color }}
                        />
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {si + 1}
                        </span>
                        <span className="text-slate-500">
                          {s.type === 'line' ? 'ㅡ 직선' : s.type === 'bend' ? '⤵ 꺾임' : '⭕ 순환'}{' '}
                          ({s.points.length}점)
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            ✓ 선택됨
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedStrokeIdx === si) setSelectedStrokeIdx(null);
                            setStrokes((prev) => prev.filter((_, i) => i !== si));
                          }}
                          className="ml-auto text-red-400 hover:text-red-600 font-bold"
                        >
                          삭제
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* === 학습자 view 미리보기 === */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  👀 학습자 view (연습)
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="text-xs font-bold text-coral-600 hover:text-coral-800 transition-colors"
                  disabled={previewStrokes.length === 0}
                >
                  🔄 다시 시도
                </button>
              </div>
              {previewStrokes.length === 0 ? (
                <div
                  className="bg-slate-50 dark:bg-slate-900/40 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 mx-auto"
                  style={{ aspectRatio: '1 / 1', maxWidth: 'min(380px, 50vh)' }}
                >
                  <div className="text-3xl opacity-30">📍</div>
                  <p className="text-xs text-slate-400 text-center px-3">
                    스트로크를 만들면
                    <br />
                    여기서 연습할 수 있어요
                  </p>
                </div>
              ) : (
                <div className="mx-auto" style={{ maxWidth: 'min(380px, 50vh)' }}>
                  <LetterTracingCanvas
                    key={`preview-${previewKey}-${strokes.length}-${enforceOrder}`}
                    letter={letter}
                    strokes={previewStrokes}
                    enforceOrder={enforceOrder}
                    onComplete={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'text-xs font-bold px-3 py-1.5 rounded-full bg-coral-500 text-white shadow-sm'
          : 'text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200'
      }
    >
      {label}
    </button>
  );
}

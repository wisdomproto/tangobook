import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import { Link } from 'react-router-dom';
import type { LetterStrokeLibrary, LetterTracingData, TracingPoint } from '@tangobook/shared';
import { Button } from '@/design-system';
import { LetterTracingPointEditorModal } from '@/features/phonics/components/LetterTracingPointEditorModal';

/**
 * 알파벳 stroke 일괄 편집기 — 글로벌 letter-stroke-library 한 페이지에서 편집.
 *
 * 기능:
 * - 52 글자 grid (대문자 A-Z + 소문자 a-z)
 * - 점 드래그 → snap-to-grid (0.025)
 * - 글자 헤더 더블클릭 → 확대 모달 (점 잡기 쉽게)
 * - Ctrl+Z → 직전 drag 되돌리기 (history stack)
 * - stroke 선택 (chip 클릭) → 그 stroke 의 점만 진하게, 다른 stroke 흐림 + hit-test 제한
 *   → 겹친 점 (예: B 의 stroke 1 끝 = stroke 2 시작) 도 정확히 잡힘
 */

const ALPHABET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

const GRID_STEP = 0.025;
const POINT_HIT_RADIUS = 0.045;
const LETTER_FILL = '#d4d4d8';
const FONT_FAMILY = 'system-ui, sans-serif';
const STROKE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const MAX_HISTORY = 50;

function snap(c: number): number {
  return Math.round(c / GRID_STEP) * GRID_STEP;
}

interface HistoryEntry {
  library: LetterStrokeLibrary;
  dirty: Set<string>;
}

export default function LetterStrokeBulkEditorPage() {
  const [library, setLibrary] = useState<LetterStrokeLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [zoomLetter, setZoomLetter] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // ref 동기화 — 콜백 stale closure 방지
  const libraryRef = useRef(library);
  const dirtyRef = useRef(dirty);
  libraryRef.current = library;
  dirtyRef.current = dirty;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/letter-stroke-library');
        const j = await r.json();
        const lib: LetterStrokeLibrary = j.data ?? j;
        setLibrary(lib);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message ?? 'fetch failed');
        setLoading(false);
      }
    })();
  }, []);

  // history push — drag 시작 직전 호출. 현재 (library, dirty) snapshot 저장.
  const pushHistory = useCallback(() => {
    if (!libraryRef.current) return;
    const snapshot: HistoryEntry = {
      library: JSON.parse(JSON.stringify(libraryRef.current)),
      dirty: new Set(dirtyRef.current),
    };
    setHistory((prev) => {
      const next = [...prev, snapshot];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  // undo
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setLibrary(last.library);
      setDirty(last.dirty);
      return prev.slice(0, -1);
    });
  }, []);

  // Ctrl+Z / Cmd+Z keyboard listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Escape' && zoomLetter) {
        setZoomLetter(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, zoomLetter]);

  // dirty 상태로 페이지 떠나면 경고 — 변경 사항 손실 방지
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.size > 0) {
        e.preventDefault();
        e.returnValue = '저장하지 않은 변경 사항이 있어요.';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty.size]);

  const updatePoint = useCallback(
    (letter: string, strokeIdx: number, pointIdx: number, np: TracingPoint) => {
      setLibrary((prev) => {
        if (!prev) return prev;
        const cur = prev.letters[letter];
        if (!cur) return prev;
        const strokes = cur.strokes.map((s, si) => {
          if (si !== strokeIdx) return s;
          const pts = s.points.map((p, pi) => (pi === pointIdx ? np : p));
          if (s.type === 'loop') {
            if (pointIdx === 0) pts[pts.length - 1] = np;
            if (pointIdx === pts.length - 1) pts[0] = np;
          }
          return { ...s, points: pts };
        });
        return {
          ...prev,
          letters: { ...prev.letters, [letter]: { ...cur, strokes } },
        };
      });
      setDirty((prev) => new Set(prev).add(letter));
    },
    []
  );

  // stroke 1개 삭제 (chip ✕ 클릭)
  const deleteStroke = useCallback(
    (letter: string, strokeIdx: number) => {
      pushHistory();
      setLibrary((prev) => {
        if (!prev) return prev;
        const cur = prev.letters[letter];
        if (!cur) return prev;
        const strokes = cur.strokes.filter((_, si) => si !== strokeIdx);
        return {
          ...prev,
          letters: { ...prev.letters, [letter]: { ...cur, strokes } },
        };
      });
      setDirty((prev) => new Set(prev).add(letter));
    },
    [pushHistory]
  );

  // 글자의 전체 LetterTracingData 교체 (모달 저장 시)
  const replaceLetterData = useCallback(
    (letter: string, data: LetterTracingData) => {
      pushHistory();
      setLibrary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          letters: { ...prev.letters, [letter]: data },
        };
      });
      setDirty((prev) => new Set(prev).add(letter));
    },
    [pushHistory]
  );

  const handleSave = useCallback(async () => {
    if (!library || dirty.size === 0) return;
    setSaving(true);
    try {
      const r = await fetch('/api/letter-stroke-library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(library),
      });
      if (!r.ok) throw new Error(`save failed: ${r.status}`);
      const j = await r.json();
      setLibrary(j.data ?? j);
      setDirty(new Set());
      setHistory([]); // 저장 후 history 초기화
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (e: any) {
      alert(`저장 실패: ${e?.message ?? e}`);
    } finally {
      setSaving(false);
    }
  }, [library, dirty]);

  const upperEntries = useMemo(() => {
    if (!library) return [];
    return ALPHABET_UPPER.map((l) => ({ letter: l, data: library.letters[l] })).filter(
      (e) => e.data
    );
  }, [library]);
  const lowerEntries = useMemo(() => {
    if (!library) return [];
    return ALPHABET_LOWER.map((l) => ({ letter: l, data: library.letters[l] })).filter(
      (e) => e.data
    );
  }, [library]);

  const zoomEntry = useMemo(() => {
    if (!zoomLetter || !library?.letters[zoomLetter]) return null;
    return { letter: zoomLetter, data: library.letters[zoomLetter] };
  }, [zoomLetter, library]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link to="/library" className="text-sm text-slate-400 hover:text-slate-200">
            ← 라이브러리
          </Link>
          <h1 className="text-lg font-bold text-amber-300">🔠 알파벳 stroke 일괄 편집</h1>
          <div className="ml-auto flex items-center gap-3">
            {justSaved && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse">✓ 저장됨</span>
            )}
            <span
              className={`text-xs ${dirty.size > 0 ? 'font-bold text-amber-300' : 'text-slate-400'}`}
            >
              {dirty.size > 0 ? `⚠ ${dirty.size}개 미저장` : '변경 없음'}
            </span>
            <Button size="sm" variant="ghost" onClick={undo} disabled={history.length === 0}>
              ↶ 되돌리기 ({history.length})
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              disabled={dirty.size === 0 || saving}
              loading={saving}
            >
              💾 저장
            </Button>
          </div>
        </div>
        <div className="px-6 pb-3 text-xs text-slate-300 bg-slate-800/50 border-t border-slate-700/50 py-2 leading-relaxed">
          🖱️ <span className="font-bold text-amber-300">점 드래그</span> = 위치 이동 (snap 0.025) ·
          🔢 <span className="font-bold text-amber-300">stroke chip</span> = 클릭=선택(겹친 점 잡기)
          / ✕=삭제 · ➕{' '}
          <span className="font-bold text-amber-300">+추가/편집 또는 헤더 더블클릭</span> = 확대
          모달 (stroke 추가/type 변경) · ↶ <span className="font-bold text-amber-300">Ctrl+Z</span>{' '}
          = 되돌리기 · 💾 저장 = 글로벌 라이브러리 update
        </div>
      </header>

      <main className="p-6">
        {loading && <div className="text-center py-12 text-slate-400">로딩 중...</div>}
        {error && <div className="text-center py-12 text-red-400">에러: {error}</div>}
        {!loading && !error && library && (
          <>
            <SectionLabel title="대문자 (A-Z)" count={upperEntries.length} />
            <Grid
              entries={upperEntries}
              dirty={dirty}
              onUpdate={updatePoint}
              onPushHistory={pushHistory}
              onZoom={setZoomLetter}
              onDeleteStroke={deleteStroke}
            />
            <SectionLabel title="소문자 (a-z)" count={lowerEntries.length} />
            <Grid
              entries={lowerEntries}
              dirty={dirty}
              onUpdate={updatePoint}
              onPushHistory={pushHistory}
              onZoom={setZoomLetter}
              onDeleteStroke={deleteStroke}
            />
          </>
        )}
      </main>

      {/* 확대 모달 — 기존 LetterTracingPointEditorModal 재사용. 저장 시 즉시 R2 PUT (한 글자만, server merge 모드라 안전). */}
      {zoomEntry && (
        <LetterTracingPointEditorModal
          letter={zoomEntry.letter}
          pairLabel={
            zoomEntry.letter === zoomEntry.letter.toUpperCase()
              ? `${zoomEntry.letter}${zoomEntry.letter.toLowerCase()}`
              : `${zoomEntry.letter.toUpperCase()}${zoomEntry.letter}`
          }
          initialData={zoomEntry.data}
          saveLabel={`💾 ${zoomEntry.letter} 저장 (즉시 R2)`}
          onSave={async (data) => {
            // 1) library state update (history push 포함)
            replaceLetterData(zoomEntry.letter, data);
            // 2) 즉시 R2 PUT — 이 글자만 보내도 server merge 모드라 다른 글자 안전
            try {
              const r = await fetch('/api/letter-stroke-library', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letters: { [zoomEntry.letter]: data } }),
              });
              if (!r.ok) throw new Error(`save failed: ${r.status}`);
              const j = await r.json();
              setLibrary(j.data ?? j);
              setDirty((prev) => {
                const next = new Set(prev);
                next.delete(zoomEntry.letter);
                return next;
              });
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 3000);
              setZoomLetter(null);
            } catch (e: any) {
              alert(`저장 실패: ${e?.message ?? e}`);
            }
          }}
          onClose={() => setZoomLetter(null)}
        />
      )}
    </div>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
      {title} <span className="text-slate-500">({count})</span>
    </div>
  );
}

interface CellEntry {
  letter: string;
  data: LetterTracingData;
}

function Grid({
  entries,
  dirty,
  onUpdate,
  onPushHistory,
  onZoom,
  onDeleteStroke,
}: {
  entries: CellEntry[];
  dirty: Set<string>;
  onUpdate: (letter: string, strokeIdx: number, pointIdx: number, np: TracingPoint) => void;
  onPushHistory: () => void;
  onZoom: (letter: string) => void;
  onDeleteStroke: (letter: string, strokeIdx: number) => void;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      }}
    >
      {entries.map((e) => (
        <LetterCell
          key={e.letter}
          entry={e}
          isDirty={dirty.has(e.letter)}
          onUpdate={onUpdate}
          onPushHistory={onPushHistory}
          onZoom={onZoom}
          onDeleteStroke={onDeleteStroke}
        />
      ))}
    </div>
  );
}

function LetterCell({
  entry,
  isDirty,
  onUpdate,
  onPushHistory,
  onZoom,
  onDeleteStroke,
  hideZoomHandle = false,
}: {
  entry: CellEntry;
  isDirty: boolean;
  onUpdate: (letter: string, strokeIdx: number, pointIdx: number, np: TracingPoint) => void;
  onPushHistory: () => void;
  onZoom: (letter: string) => void;
  onDeleteStroke: (letter: string, strokeIdx: number) => void;
  hideZoomHandle?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ strokeIdx: number; pointIdx: number } | null>(null);
  const [selectedStrokeIdx, setSelectedStrokeIdx] = useState<number | null>(null);

  const toNorm = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }, []);

  // hit-test — selectedStrokeIdx 있으면 그 stroke 점만, 없으면 모든 stroke
  const hitTest = useCallback(
    (nx: number, ny: number): { strokeIdx: number; pointIdx: number } | null => {
      const strokes = entry.data.strokes;
      const strokeIdxs =
        selectedStrokeIdx !== null
          ? [selectedStrokeIdx]
          : Array.from({ length: strokes.length }, (_, i) => strokes.length - 1 - i);
      for (const si of strokeIdxs) {
        const s = strokes[si];
        if (!s) continue;
        for (let pi = s.points.length - 1; pi >= 0; pi--) {
          if (
            s.type === 'loop' &&
            pi === s.points.length - 1 &&
            s.points.length > 1 &&
            Math.hypot(s.points[0].x - s.points[pi].x, s.points[0].y - s.points[pi].y) < 0.001
          ) {
            continue;
          }
          const p = s.points[pi];
          if (Math.hypot(nx - p.x, ny - p.y) < POINT_HIT_RADIUS) {
            return { strokeIdx: si, pointIdx: pi };
          }
        }
      }
      return null;
    },
    [entry.data.strokes, selectedStrokeIdx]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const n = toNorm(e.clientX, e.clientY);
      const hit = hitTest(n.x, n.y);
      if (hit) {
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        onPushHistory(); // 변경 전 snapshot
        setDrag(hit);
      }
    },
    [toNorm, hitTest, onPushHistory]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!drag) return;
      e.preventDefault();
      const n = toNorm(e.clientX, e.clientY);
      const np: TracingPoint = { x: snap(n.x), y: snap(n.y) };
      onUpdate(entry.letter, drag.strokeIdx, drag.pointIdx, np);
    },
    [drag, toNorm, onUpdate, entry.letter]
  );

  const handlePointerUp = useCallback(() => {
    setDrag(null);
  }, []);

  const handleHeaderDoubleClick = useCallback(() => {
    if (!hideZoomHandle) onZoom(entry.letter);
  }, [onZoom, entry.letter, hideZoomHandle]);

  return (
    <div
      className={`rounded-lg p-2 transition-colors ${
        isDirty ? 'bg-amber-900/30 ring-2 ring-amber-500/50' : 'bg-slate-800'
      }`}
    >
      <div
        className="flex items-center justify-between mb-1 px-1 cursor-pointer select-none"
        onDoubleClick={handleHeaderDoubleClick}
        title={hideZoomHandle ? '' : '더블클릭 = 확대'}
      >
        <span className="text-base font-bold text-slate-200">{entry.letter}</span>
        <span className="text-[10px] text-slate-500">
          {entry.data.strokes.length} stroke
          {isDirty && <span className="text-amber-400"> •</span>}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="w-full bg-slate-100 rounded touch-none"
        style={{ aspectRatio: '1 / 1', cursor: drag ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* 그리드 */}
        <g opacity={0.25}>
          {Array.from({ length: 41 }, (_, i) => {
            const v = i * GRID_STEP;
            const isCenter = Math.abs(v - 0.5) < 1e-6;
            const isMajor = i % 5 === 0;
            return (
              <g key={`g${i}`}>
                <line
                  x1={v}
                  y1={0}
                  x2={v}
                  y2={1}
                  stroke={isCenter ? '#94a3b8' : isMajor ? '#a8b3c1' : '#cbd5e1'}
                  strokeWidth={isCenter ? 0.003 : isMajor ? 0.0015 : 0.0008}
                />
                <line
                  x1={0}
                  y1={v}
                  x2={1}
                  y2={v}
                  stroke={isCenter ? '#94a3b8' : isMajor ? '#a8b3c1' : '#cbd5e1'}
                  strokeWidth={isCenter ? 0.003 : isMajor ? 0.0015 : 0.0008}
                />
              </g>
            );
          })}
        </g>
        {/* 글자 배경 */}
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
          {entry.letter}
        </text>
        {/* 점들 — selectedStrokeIdx 있으면 그 stroke 만 진하게, 나머지 흐림 */}
        {entry.data.strokes.map((s, si) => {
          const color = STROKE_COLORS[si % STROKE_COLORS.length];
          const isSelected = selectedStrokeIdx === null || selectedStrokeIdx === si;
          const opacity = isSelected ? 1 : 0.25;
          return s.points.map((p, pi) => {
            if (
              s.type === 'loop' &&
              pi === s.points.length - 1 &&
              s.points.length > 1 &&
              Math.hypot(s.points[0].x - p.x, s.points[0].y - p.y) < 0.001
            ) {
              return null;
            }
            const isDragging = drag?.strokeIdx === si && drag?.pointIdx === pi;
            return (
              <g key={`${si}-${pi}`} opacity={opacity}>
                <circle cx={p.x} cy={p.y} r={isDragging ? 0.055 : 0.04} fill="white" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isDragging ? 0.045 : 0.032}
                  fill={isDragging ? '#3b82f6' : color}
                />
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="0.024"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {si + 1}.{pi + 1}
                </text>
              </g>
            );
          });
        })}
      </svg>
      {/* stroke 선택/삭제 chip 들 */}
      {entry.data.strokes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 px-1">
          {entry.data.strokes.map((s, si) => {
            const color = STROKE_COLORS[si % STROKE_COLORS.length];
            const isSelected = selectedStrokeIdx === si;
            const typeLabel = s.type === 'line' ? '직선' : s.type === 'bend' ? '꺾임' : '순환';
            return (
              <div
                key={si}
                className={`inline-flex items-center rounded overflow-hidden text-[10px] font-bold transition-all ${
                  isSelected ? 'ring-2 ring-white shadow' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ background: color }}
                title={`${typeLabel} (${s.points.length}점)`}
              >
                <button
                  onClick={() => setSelectedStrokeIdx((prev) => (prev === si ? null : si))}
                  className="px-1.5 py-0.5 text-white"
                >
                  {si + 1}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedStrokeIdx === si) setSelectedStrokeIdx(null);
                    onDeleteStroke(entry.letter, si);
                  }}
                  className="px-1 py-0.5 text-white/80 hover:bg-black/30 hover:text-white border-l border-white/30"
                  title={`stroke ${si + 1} 삭제`}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {selectedStrokeIdx !== null && (
            <button
              onClick={() => setSelectedStrokeIdx(null)}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
              title="선택 해제 (전체 보기)"
            >
              전체
            </button>
          )}
          {!hideZoomHandle && (
            <button
              onClick={() => onZoom(entry.letter)}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-700/50 text-emerald-200 hover:bg-emerald-700 ml-auto"
              title="확대해서 stroke 추가/편집"
            >
              + 추가/편집
            </button>
          )}
        </div>
      )}
    </div>
  );
}

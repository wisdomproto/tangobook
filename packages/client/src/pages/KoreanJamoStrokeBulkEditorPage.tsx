import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  KoreanJamoEntry,
  KoreanJamoStrokeLibrary,
  KoreanJamoVariantKey,
  LetterTracingData,
} from '@tangobook/shared';
import {
  KOREAN_JAMO_GROUPS,
  variantsForJamo,
  VARIANT_LABELS,
  composeKoreanSyllable,
} from '@tangobook/shared';
import { Button } from '@/design-system';
import { LetterTracingPointEditorModal } from '@/features/phonics/components/LetterTracingPointEditorModal';

/**
 * 한글 자모 stroke 일괄 편집기 — `composeKoreanSyllable` variant 시스템.
 *
 * 자모마다 variant (자음 5 / 모음 2) 별로 stroke 정의. 한 자모 cell 에서
 * variant chip 5개 (가/각/고/국/종성) 또는 2개 (가/각) — 각 클릭 시 영어 LetterTracingPointEditorModal
 * 호출해서 그 variant 의 stroke 편집.
 *
 * 활성 variant (cell 미리보기에 보일 것) 는 자음/모음마다 default — 자음은 cho-horiz-noJong, 모음은 vowel-noJong.
 * 사용자가 chip 클릭하면 그 variant 가 미리보기 + 편집.
 */

const FONT_FAMILY_KO = "'NanumSquareRound', 'NanumSquare', system-ui, sans-serif";
const LETTER_FILL = '#d4d4d8';
const STROKE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const MAX_HISTORY = 50;

interface HistoryEntry {
  library: KoreanJamoStrokeLibrary;
  dirty: Set<string>;
}

function defaultVariantFor(jamo: string): KoreanJamoVariantKey {
  const keys = variantsForJamo(jamo);
  return keys[0];
}

export default function KoreanJamoStrokeBulkEditorPage() {
  const [library, setLibrary] = useState<KoreanJamoStrokeLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  // 모달 활성 — { jamo, variantKey } 일 때 그 variant 의 stroke 편집 모달 열림
  const [activeEdit, setActiveEdit] = useState<{
    jamo: string;
    variantKey: KoreanJamoVariantKey;
  } | null>(null);
  // cell 별 현재 보이는 variant (사용자가 chip 클릭으로 전환)
  const [activeVariantMap, setActiveVariantMap] = useState<Record<string, KoreanJamoVariantKey>>(
    {}
  );

  const libraryRef = useRef(library);
  const dirtyRef = useRef(dirty);
  libraryRef.current = library;
  dirtyRef.current = dirty;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/korean-jamo-stroke-library');
        const j = await r.json();
        const lib: KoreanJamoStrokeLibrary = j.data ?? j;
        setLibrary(lib);
        setLoading(false);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'fetch failed';
        setError(msg);
        setLoading(false);
      }
    })();
  }, []);

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

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setLibrary(last.library);
      setDirty(last.dirty);
      return prev.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Escape' && activeEdit) setActiveEdit(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, activeEdit]);

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

  const updateVariant = useCallback(
    (jamo: string, variantKey: KoreanJamoVariantKey, data: LetterTracingData) => {
      pushHistory();
      setLibrary((prev) => {
        if (!prev) return prev;
        const curEntry: KoreanJamoEntry = prev.jamo[jamo] ?? { variants: {} };
        const variants = { ...curEntry.variants, [variantKey]: data };
        return { ...prev, jamo: { ...prev.jamo, [jamo]: { variants } } };
      });
      setDirty((prev) => new Set(prev).add(jamo));
    },
    [pushHistory]
  );

  const handleSave = useCallback(async () => {
    if (!library || dirty.size === 0) return;
    setSaving(true);
    try {
      const r = await fetch('/api/korean-jamo-stroke-library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(library),
      });
      if (!r.ok) throw new Error(`save failed: ${r.status}`);
      const j = await r.json();
      setLibrary(j.data ?? j);
      setDirty(new Set());
      setHistory([]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`저장 실패: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [library, dirty]);

  const sections = useMemo(
    () => [
      { title: '단자음 (14)', jamo: KOREAN_JAMO_GROUPS.singleConsonants },
      { title: '쌍자음 (5)', jamo: KOREAN_JAMO_GROUPS.doubleConsonants },
      { title: '겹받침 (11)', jamo: KOREAN_JAMO_GROUPS.compoundFinals },
      { title: '단모음 (10)', jamo: KOREAN_JAMO_GROUPS.basicVowels },
      { title: '복모음 (11)', jamo: KOREAN_JAMO_GROUPS.compoundVowels },
    ],
    []
  );

  // 모달 활성 시 — 그 jamo + variantKey 의 현재 data (없으면 빈 strokes)
  const editInitialData = useMemo<LetterTracingData>(() => {
    if (!activeEdit || !library) return { strokes: [], enforceOrder: true };
    const entry = library.jamo[activeEdit.jamo];
    return entry?.variants[activeEdit.variantKey] ?? { strokes: [], enforceOrder: true };
  }, [activeEdit, library]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link to="/library" className="text-sm text-slate-400 hover:text-slate-200">
            ← 라이브러리
          </Link>
          <h1 className="text-lg font-bold text-amber-300">🇰🇷 한글 자모 stroke 일괄 편집</h1>
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
          🇰🇷 자모마다 variant (자음 5 / 모음 2) 별 stroke 입력 · 🔢{' '}
          <span className="font-bold text-amber-300">variant chip 클릭</span> = 그 variant 편집 모달
          · ↶ <span className="font-bold text-amber-300">Ctrl+Z</span> = 되돌리기 · 💾 저장 = 음절
          자동 합성에 즉시 반영 (composeKoreanSyllable)
        </div>
      </header>

      <main className="p-6">
        {loading && <div className="text-center py-12 text-slate-400">로딩 중...</div>}
        {error && <div className="text-center py-12 text-red-400">에러: {error}</div>}
        {!loading && !error && library && (
          <>
            {sections.map(({ title, jamo }) => (
              <div key={title}>
                <SectionLabel title={title} count={jamo.length} />
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
                >
                  {jamo.map((j) => (
                    <KoreanJamoCell
                      key={j}
                      jamo={j}
                      entry={library.jamo[j] ?? { variants: {} }}
                      library={library}
                      isDirty={dirty.has(j)}
                      activeVariant={activeVariantMap[j] ?? defaultVariantFor(j)}
                      onChangeActiveVariant={(vk) =>
                        setActiveVariantMap((prev) => ({ ...prev, [j]: vk }))
                      }
                      onEditVariant={(vk) => setActiveEdit({ jamo: j, variantKey: vk })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {/* variant 별 편집 모달 — 영어 LetterTracingPointEditorModal 재사용 */}
      {activeEdit && (
        <LetterTracingPointEditorModal
          letter={activeEdit.jamo}
          pairLabel={`${activeEdit.jamo} · ${VARIANT_LABELS[activeEdit.variantKey].short} (예: ${VARIANT_LABELS[activeEdit.variantKey].example})`}
          initialData={editInitialData}
          saveLabel={`💾 ${activeEdit.jamo} · ${VARIANT_LABELS[activeEdit.variantKey].short} 저장`}
          onSave={async (data) => {
            updateVariant(activeEdit.jamo, activeEdit.variantKey, data);
            // 즉시 R2 PUT (한 자모만 partial merge)
            try {
              // 현재 library 상태 + 이번 variant 적용한 entry
              const curEntry = libraryRef.current?.jamo[activeEdit.jamo] ?? { variants: {} };
              const newEntry: KoreanJamoEntry = {
                variants: { ...curEntry.variants, [activeEdit.variantKey]: data },
              };
              const r = await fetch('/api/korean-jamo-stroke-library', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jamo: { [activeEdit.jamo]: newEntry } }),
              });
              if (!r.ok) throw new Error(`save failed: ${r.status}`);
              const j = await r.json();
              setLibrary(j.data ?? j);
              setDirty((prev) => {
                const next = new Set(prev);
                next.delete(activeEdit.jamo);
                return next;
              });
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 3000);
              setActiveEdit(null);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              alert(`저장 실패: ${msg}`);
            }
          }}
          onClose={() => setActiveEdit(null)}
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

function KoreanJamoCell({
  jamo,
  entry,
  library,
  isDirty,
  activeVariant,
  onChangeActiveVariant,
  onEditVariant,
}: {
  jamo: string;
  entry: KoreanJamoEntry;
  library: KoreanJamoStrokeLibrary;
  isDirty: boolean;
  activeVariant: KoreanJamoVariantKey;
  onChangeActiveVariant: (vk: KoreanJamoVariantKey) => void;
  onEditVariant: (vk: KoreanJamoVariantKey) => void;
}) {
  const variantKeys = useMemo(() => variantsForJamo(jamo), [jamo]);
  const activeData = entry.variants[activeVariant];
  const filledCount = Object.keys(entry.variants).filter((k) =>
    variantKeys.includes(k as KoreanJamoVariantKey)
  ).length;

  // 활성 variant 의 예시 음절 (cho-horiz-noJong → 가, jong → 곡 등)
  // composeKoreanSyllable 로 stroke 자동 합성. 폰트 글자와 옆에 비교.
  const exampleSyllable = VARIANT_LABELS[activeVariant].example;
  const composedStrokes = useMemo(() => {
    const composed = composeKoreanSyllable(exampleSyllable, library.jamo);
    return composed?.strokes ?? [];
  }, [exampleSyllable, library]);

  return (
    <div
      className={`rounded-lg p-2 transition-colors ${
        isDirty ? 'bg-amber-900/30 ring-2 ring-amber-500/50' : 'bg-slate-800'
      }`}
    >
      {/* 헤더 — 더블클릭 시 활성 variant 편집 모달 */}
      <div
        className="flex items-center justify-between mb-1 px-1 cursor-pointer select-none"
        onDoubleClick={() => onEditVariant(activeVariant)}
        title="더블클릭 = 현재 variant 편집"
      >
        <span className="text-base font-bold text-slate-200">{jamo}</span>
        <span className="text-[10px] text-slate-500">
          {filledCount}/{variantKeys.length} variant
        </span>
      </div>
      {/* 활성 variant 시각화 (큰 SVG) — 자모 자체 박스 0~1 */}
      <button
        type="button"
        onDoubleClick={() => onEditVariant(activeVariant)}
        className="w-full bg-slate-100 rounded touch-none hover:ring-2 hover:ring-amber-400 transition"
        style={{ aspectRatio: '1 / 1', cursor: 'pointer' }}
        title="더블클릭 = 이 variant 편집"
      >
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="w-full h-full">
          <text
            x="0.5"
            y="0.55"
            textAnchor="middle"
            dominantBaseline="central"
            fill={LETTER_FILL}
            fontSize="0.85"
            fontWeight="900"
            fontFamily={FONT_FAMILY_KO}
          >
            {jamo}
          </text>
          {activeData?.strokes.map((s, si) => {
            const color = STROKE_COLORS[si % STROKE_COLORS.length];
            return s.points.map((p, pi) => {
              if (
                s.type === 'loop' &&
                pi === s.points.length - 1 &&
                s.points.length > 1 &&
                Math.hypot(s.points[0].x - p.x, s.points[0].y - p.y) < 0.001
              )
                return null;
              return (
                <g key={`${si}-${pi}`}>
                  <circle cx={p.x} cy={p.y} r={0.034} fill="white" />
                  <circle cx={p.x} cy={p.y} r={0.028} fill={color} />
                </g>
              );
            });
          })}
        </svg>
      </button>
      {/* 폰트 vs 합성 음절 비교 — NanumSquareRound 글자와 자동 합성 stroke 가 얼마나 일치하는지 */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        <SyllablePreview char={exampleSyllable} strokes={[]} label="폰트" />
        <SyllablePreview char={exampleSyllable} strokes={composedStrokes} label="합성" />
      </div>
      {/* variant chip — 클릭=활성 전환 / 더블클릭=편집 모달 */}
      <div className="flex flex-wrap gap-1 mt-2 px-1">
        {variantKeys.map((vk) => {
          const filled = !!entry.variants[vk];
          const isActive = activeVariant === vk;
          const label = VARIANT_LABELS[vk];
          return (
            <button
              key={vk}
              onClick={() => onChangeActiveVariant(vk)}
              onDoubleClick={() => onEditVariant(vk)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow ring-1 ring-amber-300'
                  : filled
                    ? 'bg-emerald-700/60 text-emerald-100 hover:bg-emerald-600'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title={`${label.example} — 클릭=미리보기, 더블클릭=편집`}
            >
              {label.example}
              {filled ? ' ✓' : ' ○'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 음절 한 글자 미리보기 — NanumSquareRound 폰트 글자 (회색) + 옵션 stroke 점.
 * 폰트만 보여줄 때 (label="폰트") strokes 빈, 합성 결과 보여줄 때 strokes 채움.
 */
function SyllablePreview({
  char,
  strokes,
  label,
}: {
  char: string;
  strokes: Array<{ type: string; points: Array<{ x: number; y: number }> }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 1 1.2"
        preserveAspectRatio="none"
        className="w-full bg-white rounded"
        style={{ aspectRatio: '5 / 6' }}
      >
        <text
          x="0.5"
          y="0.55"
          textAnchor="middle"
          dominantBaseline="central"
          fill={LETTER_FILL}
          fontSize="0.85"
          fontWeight="900"
          fontFamily={FONT_FAMILY_KO}
        >
          {char}
        </text>
        {strokes.map((s, si) => {
          const color = STROKE_COLORS[si % STROKE_COLORS.length];
          return s.points.map((p, pi) => {
            if (
              s.type === 'loop' &&
              pi === s.points.length - 1 &&
              s.points.length > 1 &&
              Math.hypot(s.points[0].x - p.x, s.points[0].y - p.y) < 0.001
            )
              return null;
            return (
              <g key={`${si}-${pi}`}>
                <circle cx={p.x} cy={p.y} r={0.025} fill="white" />
                <circle cx={p.x} cy={p.y} r={0.02} fill={color} />
              </g>
            );
          });
        })}
      </svg>
      <span className="text-[9px] font-bold text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

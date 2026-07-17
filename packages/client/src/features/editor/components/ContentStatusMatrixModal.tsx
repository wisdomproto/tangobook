import { useMemo, useState } from 'react';
import {
  SERIES_LABELS,
  type AuthoringRow,
  type LangDone,
  type SeriesKey,
} from '../api/content-pipeline.api';
import {
  useAuthoringPipeline,
  useRefreshAuthoringPipeline,
  useToggleApproval,
} from '../hooks/useContentPipeline';

/**
 * editor2 콘텐츠 현황 (저작 관제탑) — 전체 책의 언어별 저작 완성도 + 저작 승인 게이트.
 * 직원용 화면: 마케팅/발행 정보는 표시하지 않는다 (서버가 이미 strip — 여기서도 노출 금지).
 */

/** 표시 언어는 마케팅 타겟 5개 고정 (감사는 전 언어 산출) */
const DISPLAY_LANGS = ['ko', 'en', 'vi', 'zh', 'th'] as const;

/** 도트 순서: 삽화 · 자막 · TTS · 표지 */
const DOT_ITEMS: Array<{ key: keyof LangDone; label: string }> = [
  { key: 'illust', label: '삽화' },
  { key: 'text', label: '자막' },
  { key: 'tts', label: 'TTS' },
  { key: 'cover', label: '표지' },
];

function LangDots({ done }: { done?: LangDone }) {
  if (!done) return <span className="text-slate-300 dark:text-slate-600">–</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {DOT_ITEMS.map(({ key, label }) => (
        <span
          key={key}
          title={`${label}: ${done[key] ? '완료' : '미완'}`}
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            done[key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
      ))}
    </span>
  );
}

export function ContentStatusMatrixModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useAuthoringPipeline();
  const refreshMutation = useRefreshAuthoringPipeline();
  const toggleMutation = useToggleApproval();
  const [seriesFilter, setSeriesFilter] = useState<SeriesKey | 'all'>('all');
  const [onlyUnapproved, setOnlyUnapproved] = useState(false);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const approvedCount = useMemo(() => rows.filter((r) => r.approved).length, [rows]);

  // 시리즈 칩 — rows 의 series 값에서 도출 (SERIES_LABELS 선언 순서 유지) + 권수
  const seriesChips = useMemo(() => {
    const counts = new Map<SeriesKey, number>();
    for (const r of rows) counts.set(r.series, (counts.get(r.series) ?? 0) + 1);
    return (Object.keys(SERIES_LABELS) as SeriesKey[])
      .filter((key) => counts.has(key))
      .map((key) => ({ key, label: SERIES_LABELS[key], count: counts.get(key)! }));
  }, [rows]);

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (seriesFilter === 'all' || r.series === seriesFilter) && (!onlyUnapproved || !r.approved)
      ),
    [rows, seriesFilter, onlyUnapproved]
  );

  const handleToggle = (row: AuthoringRow) => {
    toggleMutation.mutate({ bookId: row.bookId, approved: !row.approved });
  };

  const fetchFailed = data?.fetchFailed ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              📋 콘텐츠 현황
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              전체 {rows.length}권 ·{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                승인 {approvedCount}권
              </span>
              {data?.generatedAt && (
                <span className="ml-2 text-slate-400 dark:text-slate-500">
                  기준 {new Date(data.generatedAt).toLocaleString('ko-KR')}
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              title="서버 캐시를 무시하고 전체 재감사"
            >
              {refreshMutation.isPending ? '감사 중…' : '🔄 새로고침'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        {/* fetchFailed 경고 배너 */}
        {fetchFailed.length > 0 && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            ⚠️ {fetchFailed.length}권 로드 실패 — 새로고침 해주세요.
          </div>
        )}

        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-2.5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSeriesFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              seriesFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            전체 ({rows.length})
          </button>
          {seriesChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSeriesFilter(chip.key)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                seriesFilter === chip.key
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyUnapproved}
              onChange={(e) => setOnlyUnapproved(e.target.checked)}
            />
            미승인만
          </label>
        </div>

        {/* body — table */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {isLoading && (
            <div className="py-10 text-center text-slate-400">저작 완성도 감사 중…</div>
          )}
          {!isLoading && visibleRows.length === 0 && (
            <div className="py-10 text-center text-slate-400">표시할 책이 없어요.</div>
          )}
          {!isLoading && visibleRows.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-white text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <th className="px-2 py-2 text-left font-bold">책</th>
                  <th className="px-2 py-2 text-center font-bold">공개</th>
                  {DISPLAY_LANGS.map((lang) => (
                    <th key={lang} className="px-2 py-2 text-center font-bold uppercase">
                      {lang}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-bold">✅ 승인</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.bookId}
                    className={`border-t border-slate-100 dark:border-slate-800 ${
                      row.approved ? 'bg-green-50 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="max-w-[16rem] px-2 py-1.5">
                      <div className="truncate font-bold text-slate-700 dark:text-slate-200">
                        {row.title}
                      </div>
                      {row.category && (
                        <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                          {row.category}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {row.authoring.public ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">–</span>
                      )}
                    </td>
                    {DISPLAY_LANGS.map((lang) => (
                      <td key={lang} className="px-2 py-1.5 text-center">
                        <LangDots done={row.authoring.langs[lang]} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.approved}
                        onChange={() => handleToggle(row)}
                        className="h-4 w-4 cursor-pointer accent-emerald-600"
                        title={row.approved ? '승인 해제' : '저작 승인'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

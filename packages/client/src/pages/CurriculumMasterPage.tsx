import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookIndex } from '@/features/book-v2';
import { useStorybooks } from '@/features/storybook';
import { StateScreen } from '@/design-system';
import { cn } from '@/lib/cn';
import type { BookIndexEntry, StorybookSummary } from '@tangobook/shared';

type CategoryKey = '명작' | '자연관찰' | '전래' | '생활' | '파닉스' | '기타';

const CATEGORY_TABS: {
  key: CategoryKey;
  icon: string;
  label: string;
  match: (b: BookIndexEntry) => boolean;
}[] = [
  {
    key: '명작',
    icon: '🏰',
    label: '세계명작',
    match: (b) => /명작|classic/i.test(b.category ?? '') || !!b.curriculumMeta?.author,
  },
  {
    key: '자연관찰',
    icon: '🌿',
    label: '자연관찰',
    match: (b) => /자연/i.test(b.category ?? ''),
  },
  {
    key: '전래',
    icon: '🏯',
    label: '전래동화',
    match: (b) => /전래/i.test(b.category ?? ''),
  },
  {
    key: '생활',
    icon: '🏠',
    label: '생활동화',
    match: (b) => /생활/i.test(b.category ?? ''),
  },
  {
    key: '파닉스',
    icon: '🔤',
    label: '파닉스',
    match: (b) => b.type === 'phonics',
  },
  {
    key: '기타',
    icon: '📚',
    label: '기타',
    match: () => true, // fallback
  },
];

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  done: { label: '✅ 완성', cls: 'bg-success/20 text-success' },
  wip: { label: '🟡 진행중', cls: 'bg-warn/20 text-warn' },
  todo: { label: '⬜ 미제작', cls: 'bg-ink-100 text-ink-500' },
};

/**
 * 한글 기본 완성도 기반 상태 판정.
 * 우선 v1 storybook summary 의 koCompletion 을 보고, 없으면 v2 manifest fallback.
 *
 * 완성 = 표지 + 모든 페이지 일러스트 + 모든 페이지 한글 TTS + 핵심단어 1+
 */
function deriveStatus(
  b: BookIndexEntry,
  v1Map: Map<string, StorybookSummary>
): 'done' | 'wip' | 'todo' {
  // base id 와 variants 모두 확인 — 어느 하나라도 한글 기본 완성이면 done
  const candidates: StorybookSummary[] = [];
  const base = v1Map.get(b.id);
  if (base) candidates.push(base);
  // sibling variants (`${bid}__L1` 등) 도 확인
  for (const [id, sb] of v1Map) {
    if (id !== b.id && id.startsWith(b.id + '__L')) candidates.push(sb);
  }

  if (candidates.length === 0) {
    // v1 데이터 매칭 실패 → v2 manifest fallback (예전 휴리스틱)
    const v = b.usedVariants;
    if (v.levels.length === 0 && v.styles.length === 0) return 'todo';
    if (v.levels.length > 0 && b.hasCover) return 'wip';
    return 'todo';
  }

  // 한글 기본 완성된 variant 가 1개라도 있으면 done
  if (candidates.some((sb) => sb.koCompletion?.complete)) return 'done';

  // 일부라도 콘텐츠 작업 시작했으면 wip (표지 OR 페이지 일부 OR 핵심단어 OR 페이지 0개 이상)
  const anyStart = candidates.some(
    (sb) =>
      sb.koCompletion?.cover ||
      sb.koCompletion?.pagesImage ||
      sb.koCompletion?.pagesTts ||
      sb.koCompletion?.vocabulary ||
      (sb.pageCount ?? 0) > 0
  );
  return anyStart ? 'wip' : 'todo';
}

export default function CurriculumMasterPage() {
  const { data: index, isLoading, isError } = useBookIndex();
  const { data: v1List } = useStorybooks();
  const all = index?.books;
  const [activeTab, setActiveTab] = useState<CategoryKey>('명작');
  const [search, setSearch] = useState('');

  // v1 storybook id → summary (koCompletion 포함)
  const v1Map = useMemo(() => {
    const m = new Map<string, StorybookSummary>();
    for (const sb of v1List ?? []) m.set(sb.id, sb);
    return m;
  }, [v1List]);

  const groups = useMemo(() => {
    if (!all) return null;
    // 각 책을 첫 매칭 카테고리에 배정 (순서대로)
    const buckets = new Map<CategoryKey, BookIndexEntry[]>();
    CATEGORY_TABS.forEach((c) => buckets.set(c.key, []));
    for (const b of all) {
      const tab = CATEGORY_TABS.find((c) => c.match(b)) ?? CATEGORY_TABS[CATEGORY_TABS.length - 1];
      buckets.get(tab.key)!.push(b);
    }
    return buckets;
  }, [all]);

  const visible = useMemo(() => {
    if (!groups) return [];
    const list = groups.get(activeTab) ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.curriculumMeta?.originalTitle?.toLowerCase().includes(q) ||
            b.curriculumMeta?.author?.toLowerCase().includes(q)
        )
      : list;
    // 명작은 curriculumMeta.no 정렬, 그 외는 title
    return [...filtered].sort((a, b) => {
      const an = a.curriculumMeta?.no ?? Infinity;
      const bn = b.curriculumMeta?.no ?? Infinity;
      if (an !== bn) return an - bn;
      return a.title.localeCompare(b.title, 'ko');
    });
  }, [groups, activeTab, search]);

  const tabCounts = useMemo(() => {
    if (!groups) return {} as Record<CategoryKey, number>;
    const out = {} as Record<CategoryKey, number>;
    CATEGORY_TABS.forEach((c) => (out[c.key] = groups.get(c.key)?.length ?? 0));
    return out;
  }, [groups]);

  if (isError) {
    return (
      <StateScreen
        mascotState="sad"
        title="불러올 수 없어"
        description="잠시 후 다시 시도해주세요"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1440px] mx-auto p-5 md:p-7">
        <header className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink-900 font-display">
              📚 커리큘럼 마스터
            </h1>
            <p className="text-sm text-ink-500 font-bold mt-1">
              총 {all?.length ?? 0}권 · 카테고리별 제작 현황
            </p>
          </div>
          <Link
            to="/library"
            className="px-4 py-2 rounded-md bg-white shadow-soft text-sm font-bold text-ink-700 hover:bg-peach-100"
          >
            ← 라이브러리
          </Link>
        </header>

        {/* 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {CATEGORY_TABS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={cn(
                'px-4 py-2 rounded-md font-black text-sm whitespace-nowrap flex items-center gap-2 transition-all',
                activeTab === c.key
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'bg-white text-ink-700 hover:bg-peach-100 shadow-soft'
              )}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-md',
                  activeTab === c.key ? 'bg-white/30' : 'bg-ink-100 text-ink-700'
                )}
              >
                {tabCounts[c.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-md px-5 py-3 shadow-soft mb-4 flex items-center gap-2">
          <span>🔍</span>
          <input
            type="text"
            placeholder="제목, 원제, 저자로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-base bg-transparent text-ink-900 placeholder:text-ink-500 font-semibold"
          />
        </div>

        {/* 테이블 */}
        {isLoading ? (
          <div className="bg-white rounded-md p-8 text-center text-ink-500">로딩 중...</div>
        ) : visible.length === 0 ? (
          <StateScreen mascotState="thinking" title="결과가 없어" />
        ) : (
          <div className="bg-white rounded-md shadow-soft overflow-hidden">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-sm">
                <thead className="bg-peach-50 sticky top-0 z-10">
                  <tr className="text-left text-xs font-black text-ink-700">
                    <th className="px-3 py-3 w-12">#</th>
                    <th className="px-3 py-3">제목</th>
                    <th className="px-3 py-3 hidden md:table-cell">원제</th>
                    <th className="px-3 py-3 hidden md:table-cell">저자</th>
                    <th className="px-3 py-3">레벨</th>
                    <th className="px-3 py-3">그림체</th>
                    <th className="px-3 py-3">언어</th>
                    <th className="px-3 py-3">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((b) => {
                    const status = deriveStatus(b, v1Map);
                    const pill = STATUS_PILL[status];
                    return (
                      <tr
                        key={b.id}
                        className="border-t border-ink-100 hover:bg-peach-50 cursor-pointer"
                        onClick={() => window.open(`/library/${b.id}`, '_blank')}
                      >
                        <td className="px-3 py-2 text-ink-500 font-bold">
                          {b.curriculumMeta?.no ?? '—'}
                        </td>
                        <td className="px-3 py-2 font-bold text-ink-900">{b.title}</td>
                        <td className="px-3 py-2 text-ink-500 hidden md:table-cell">
                          {b.curriculumMeta?.originalTitle ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-ink-500 hidden md:table-cell">
                          {b.curriculumMeta?.author ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {b.usedVariants.levels.slice().sort().join(', ') || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {b.usedVariants.styles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {b.usedVariants.styles.map((s) => (
                                <span
                                  key={s}
                                  className="px-1.5 py-0.5 rounded bg-ink-100 text-[10px] font-bold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-ink-500">
                          {b.usedVariants.languages.join(', ') || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn('px-2 py-1 rounded-md text-[11px] font-bold', pill.cls)}
                          >
                            {pill.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-peach-50 text-xs text-ink-500 font-bold border-t border-ink-100">
              {visible.length}권 표시
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

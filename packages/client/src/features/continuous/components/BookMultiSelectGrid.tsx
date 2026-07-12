import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStorybooks } from '@/features/storybook';
import { useLibraryConfig, makeCategoryComparator } from '@/features/library';
import { useStyleGenreMap, type StyleGenreSlug } from '@/lib/art-style-genre';
import { SkeletonBookCard, BookCover } from '@/design-system';
import { cn } from '@/lib/cn';

interface BookMultiSelectGridProps {
  /** 선택된 책 id — 순서대로. */
  selectedIds: string[];
  /** 카드 탭 시 토글. */
  onToggle: (id: string) => void;
  /** 제목/카테고리 검색어 (없으면 전체). */
  search?: string;
  /** 표지 미리보기 그림풍 (메인 라이브러리와 동일: coversByStyle × style-genre-map). 없으면 대표 표지. */
  styleGenre?: StyleGenreSlug;
}

// 카테고리 헤더 이모지 (메인 라이브러리 sprite 대신 가벼운 폴백).
const CATEGORY_EMOJI: Record<string, string> = {
  '세계 명작': '📚',
  '자연 관찰': '🔭',
  '생활 동화': '🏠',
  '전래 동화': '📜',
  기타: '✨',
};

/**
 * 공개 동화책을 **카테고리별 섹션 + 검색**으로 렌더하고 탭으로 선택 토글 (메인 라이브러리와 동일 그룹핑).
 * 선택 순서를 번호 배지로 표시 (재생 순서 = 선택 순서). Controlled — 선택 상태는 부모가 소유.
 */
export function BookMultiSelectGrid({
  selectedIds,
  onToggle,
  search = '',
  styleGenre,
}: BookMultiSelectGridProps) {
  const { t, i18n } = useTranslation('continuous');
  const { data: list, isLoading, isError } = useStorybooks();
  const { data: libConfig } = useLibraryConfig();
  const { map: styleGenreMap } = useStyleGenreMap();

  const compareCategory = useMemo(
    () => makeCategoryComparator(libConfig?.categoryOrder),
    [libConfig?.categoryOrder]
  );

  // 선택 그림풍에 해당하는 styleId (clean/legacy 표지 해석 키). 없으면 undefined → 대표 표지 폴백.
  const styleIdFor = (b: { coversByStyle?: Record<string, string> }): string | undefined => {
    if (styleGenre && b.coversByStyle) {
      for (const styleId of Object.keys(b.coversByStyle)) {
        if (styleGenreMap[styleId] === styleGenre) return styleId;
      }
    }
    return undefined;
  };

  // 공개 동화책 + **나레이션(모든 페이지 TTS) 있는 책만** (연속재생=자동 이어읽기라 무음 책 제외).
  const books = useMemo(
    () =>
      (list ?? []).filter(
        (b) => b.isPublic && (!b.type || b.type === 'storybook') && b.koCompletion?.pagesTts
      ),
    [list]
  );

  // 검색 필터 (제목 또는 카테고리) → 카테고리별 그룹 → 카테고리 순서 정렬.
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? books.filter(
          (b) => b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
        )
      : books;
    const map = new Map<string, typeof filtered>();
    for (const b of filtered) {
      const key = b.category || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()].sort((a, b) => compareCategory(a[0], b[0], a[1].length, b[1].length));
  }, [books, search, compareCategory]);

  const orderOf = useMemo(() => {
    const m = new Map<string, number>();
    selectedIds.forEach((id, i) => m.set(id, i + 1));
    return m;
  }, [selectedIds]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBookCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="py-8 text-center font-bold text-ink-500">{t('grid.loadError')}</p>;
  }

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center font-bold text-ink-500">
        {search.trim() ? t('grid.noResults') : t('grid.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([category, catBooks]) => (
        <section key={category}>
          <h3 className="mb-2.5 flex items-center gap-1.5 font-display text-lg font-black text-ink-900">
            <span>{CATEGORY_EMOJI[category] ?? '📖'}</span>
            <span className="break-keep">{category}</span>
            <span className="text-sm font-bold text-ink-400">
              {t('grid.bookCount', { count: catBooks.length })}
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {catBooks.map((b) => {
              const order = orderOf.get(b.id);
              const selected = order !== undefined;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onToggle(b.id)}
                  aria-pressed={selected}
                  className={cn(
                    'group flex flex-col items-stretch rounded-2xl text-left transition-transform active:scale-95',
                    selected && 'ring-4 ring-coral-400'
                  )}
                >
                  <div className="relative aspect-video overflow-hidden rounded-2xl shadow-soft">
                    <BookCover
                      book={b}
                      lang={i18n.language}
                      style={styleIdFor(b)}
                      overlayTitle={false}
                    />
                    {selected && (
                      <span className="absolute left-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-coral-500 text-lg font-black text-white shadow-pop">
                        {order}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1.5 truncate px-1 font-display text-sm font-black leading-tight text-ink-900 md:text-base">
                    {b.title}
                  </h4>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useBookIndex } from '@/features/book-v2';
import { CategorySection, BookCard } from '@/features/library';
import { StateScreen } from '@/design-system';
import { SkeletonBookCard } from '@/design-system';
import { cn } from '@/lib/cn';
import type { BookIndexEntry } from '@tangobook/shared';

type LibraryType = 'storybook' | 'phonics';
type PhonicsLang = 'all' | 'korean' | 'english';

interface LibraryPageProps {
  /** 동화책 페이지 vs 파닉스 페이지 분기. AppShell 좌측 nav 의 3축 중 어느 쪽인지. */
  type?: LibraryType;
}

const CATEGORY_ICON: Record<string, string> = {
  동물: '🐾',
  가족: '👪',
  자연: '🌳',
  친구: '👫',
  음식: '🍎',
  모험: '🗺️',
  직업: '🧑‍⚕️',
  감정: '❤️',
  일상: '🏠',
};
const getCategoryIcon = (cat: string) => CATEGORY_ICON[cat] ?? '📚';

export default function LibraryPage({ type = 'storybook' }: LibraryPageProps) {
  const { data: index, isLoading, isError } = useBookIndex();
  const all = index?.books;
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [phonicsLang, setPhonicsLang] = useState<PhonicsLang>('all');

  const matchesType = (b: BookIndexEntry): boolean => {
    if (type === 'storybook') return !b.type || b.type === 'storybook';
    if (type === 'phonics') {
      if (b.type !== 'phonics') return false;
      if (phonicsLang === 'all') return true;
      return b.phonicsLanguage === phonicsLang;
    }
    return false;
  };

  const filtered = useMemo<BookIndexEntry[]>(() => {
    if (!all) return [];
    const publicOnly = all.filter((b) => b.isPublic);
    const result = publicOnly.filter(matchesType);
    const q = search.trim().toLowerCase();
    const searched = q
      ? result.filter(
          (b) => b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
        )
      : result;
    const byCat = activeCategory
      ? searched.filter((b) => (b.category || '기타') === activeCategory)
      : searched;
    return [...byCat].sort((a, b) =>
      sortBy === 'recent'
        ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
        : a.title.localeCompare(b.title, 'ko')
    );
  }, [all, type, phonicsLang, search, sortBy, activeCategory]);

  // 카테고리 chip — 동화책일 때만
  const allCategories = useMemo(() => {
    if (type !== 'storybook' || !all) return [];
    const q = search.trim().toLowerCase();
    const base = all
      .filter((b) => b.isPublic)
      .filter(matchesType)
      .filter(
        (b) =>
          !q || b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
      );
    const counts = new Map<string, number>();
    base.forEach((b) => {
      const k = b.category || '기타';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [all, type, search]);

  // 카테고리 chip 미선택 + 동화책 → 카테고리별 섹션, 그 외 → 플랫 그리드
  const showCategoryGroups = type === 'storybook' && !activeCategory;
  const grouped = useMemo(() => {
    if (!showCategoryGroups) return null;
    const map = new Map<string, BookIndexEntry[]>();
    filtered.forEach((b) => {
      const key = b.category || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return [...map.entries()];
  }, [filtered, showCategoryGroups]);

  // 파닉스 한/영 카운트
  const phonicsCounts = useMemo(() => {
    if (type !== 'phonics' || !all) return { korean: 0, english: 0 };
    const pub = all.filter((b) => b.isPublic && b.type === 'phonics');
    return {
      korean: pub.filter((b) => b.phonicsLanguage === 'korean').length,
      english: pub.filter((b) => b.phonicsLanguage === 'english').length,
    };
  }, [all, type]);

  if (isError) {
    return (
      <StateScreen
        mascotState="sad"
        title="연결이 안 돼"
        description="와이파이를 확인해줘"
        action={{ label: '↻ 다시 시도', onClick: () => location.reload() }}
      />
    );
  }

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      <div className="max-w-[1440px] mx-auto px-5 md:px-7 py-5">
        {/* 검색 (정렬 select 제거 — 시각 노이즈) */}
        <div className="mb-4 bg-white rounded-2xl px-5 py-3 shadow-soft flex items-center gap-2">
          <span className="text-ink-500">🔍</span>
          <input
            type="text"
            placeholder={type === 'storybook' ? '무슨 책 찾을까?' : '어떤 파닉스 찾을까?'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-base bg-transparent text-ink-900 placeholder:text-ink-500 font-semibold"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="bg-transparent text-xs font-bold text-ink-500 outline-none"
          >
            <option value="recent">최신순</option>
            <option value="title">제목순</option>
          </select>
        </div>

        {/* 파닉스 한/영 chip */}
        {type === 'phonics' && (
          <div className="flex gap-2 mb-5">
            {(
              [
                { id: 'all', label: '전체', count: phonicsCounts.korean + phonicsCounts.english },
                { id: 'korean', label: '한글', count: phonicsCounts.korean },
                { id: 'english', label: '영어', count: phonicsCounts.english },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                onClick={() => setPhonicsLang(c.id)}
                className={cn(
                  'px-4 py-1.5 rounded-full font-bold text-sm transition-all',
                  phonicsLang === c.id
                    ? 'bg-success text-white shadow-soft'
                    : 'bg-white text-ink-700 hover:bg-success/10'
                )}
              >
                {c.label}
                {phonicsLang === c.id && <span className="ml-1.5 opacity-80">{c.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* 카테고리 chip — 동화책 (카운트는 활성/전체만) */}
        {type === 'storybook' && allCategories.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shrink-0',
                activeCategory === null
                  ? 'bg-ink-900 text-white shadow-soft'
                  : 'bg-white text-ink-700 hover:bg-peach-100'
              )}
            >
              전체
            </button>
            {allCategories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0',
                  activeCategory === cat
                    ? 'bg-coral-500 text-white shadow-soft'
                    : 'bg-white text-ink-700 hover:bg-peach-100'
                )}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
                {activeCategory === cat && <span className="opacity-80">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonBookCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <StateScreen
            mascotState="thinking"
            title={search ? '찾는 책이 없네' : '책이 아직 없어'}
            description={search ? '다른 말로 찾아볼까?' : '선생님이 곧 준비해 줄 거야!'}
            action={search ? { label: '🔎 다시 검색', onClick: () => setSearch('') } : undefined}
          />
        ) : showCategoryGroups && grouped ? (
          grouped.map(([cat, books]) => (
            <CategorySection key={cat} icon={getCategoryIcon(cat)} title={cat} books={books} />
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

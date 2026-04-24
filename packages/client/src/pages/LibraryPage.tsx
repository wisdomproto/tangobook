import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { WelcomeHeader, CategorySection, BookCard } from '@/features/library';
import { StateScreen } from '@/components/StateScreen';
import { SkeletonBookCard } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import type { StorybookSummary } from '@tangobook/shared';
import { ParentCornerButton } from '@/features/auth/components/ParentCornerButton';
import { useAuth } from '@/features/auth/context/AuthContext';

type TabId = 'storybook' | 'korean-phonics' | 'english-phonics';

const TABS: Array<{
  id: TabId;
  icon: string;
  label: string;
  match: (b: StorybookSummary) => boolean;
}> = [
  {
    id: 'storybook',
    icon: '📖',
    label: '동화책',
    match: (b) => !b.type || b.type === 'storybook',
  },
  {
    id: 'korean-phonics',
    icon: '🇰🇷',
    label: '한글 파닉스',
    match: (b) => b.type === 'phonics' && b.phonicsLanguage === 'korean',
  },
  {
    id: 'english-phonics',
    icon: '🇺🇸',
    label: '영어 파닉스',
    match: (b) => b.type === 'phonics' && b.phonicsLanguage === 'english',
  },
];

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

export default function LibraryPage() {
  const { data: all, isLoading, isError } = useStorybooks();
  const [activeTab, setActiveTab] = useState<TabId>('storybook');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 탭 전환 시 카테고리 필터 리셋
  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setActiveCategory(null);
  };

  const filtered = useMemo<StorybookSummary[]>(() => {
    if (!all) return [];
    // 뷰어에는 저작도구에서 "공개"로 체크된 책만 노출
    const publicOnly = all.filter((b) => b.isPublic);
    const tab = TABS.find((t) => t.id === activeTab)!;
    const result = publicOnly.filter(tab.match);
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
        ? (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        : a.title.localeCompare(b.title, 'ko')
    );
  }, [all, activeTab, search, sortBy, activeCategory]);

  // 카테고리 필터 칩 — 동화책 탭일 때만. 탭·검색 적용 후의 책들에서 카테고리 추출.
  const allCategories = useMemo(() => {
    if (activeTab !== 'storybook' || !all) return [];
    const tab = TABS.find((t) => t.id === activeTab)!;
    const q = search.trim().toLowerCase();
    const base = all
      .filter((b) => b.isPublic) // 뷰어: 공개 책만
      .filter(tab.match)
      .filter(
        (b) =>
          !q || b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
      );
    const counts = new Map<string, number>();
    base.forEach((b) => {
      const k = b.category || '기타';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]); // 많은 순
  }, [all, activeTab, search]);

  // 카테고리 필터 선택된 경우 섹션 묶기 해제하고 플랫 그리드로
  const showCategories = activeTab === 'storybook' && !activeCategory;
  const grouped = useMemo(() => {
    if (!showCategories) return null;
    const map = new Map<string, StorybookSummary[]>();
    filtered.forEach((b) => {
      const key = b.category || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return [...map.entries()];
  }, [filtered, showCategories]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = {
      storybook: 0,
      'korean-phonics': 0,
      'english-phonics': 0,
    };
    all?.forEach((b) =>
      TABS.forEach((t) => {
        if (t.match(b)) counts[t.id]++;
      })
    );
    return counts;
  }, [all]);

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
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1440px] mx-auto p-5 md:p-7">
        <AuthCornerBar />
        <WelcomeHeader bookCount={all?.length ?? 0} />

        {/* 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={cn(
                'px-5 py-2.5 rounded-md font-black text-sm whitespace-nowrap flex items-center gap-2 transition-all',
                activeTab === t.id
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'bg-transparent text-ink-500 hover:bg-peach-100'
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-md',
                  activeTab === t.id ? 'bg-white/30' : 'bg-ink-100 text-ink-700'
                )}
              >
                {tabCounts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px] bg-white rounded-md px-5 py-3 shadow-soft flex items-center gap-2">
            <span>🔍</span>
            <input
              type="text"
              placeholder="무슨 책 찾을까?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-base bg-transparent text-ink-900 placeholder:text-ink-500 font-semibold"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="bg-white rounded-md px-4 py-3 shadow-soft font-bold text-sm text-ink-900"
          >
            <option value="recent">🆕 최신순</option>
            <option value="title">🔤 제목순</option>
          </select>
        </div>

        {/* 카테고리 필터 (동화책 탭에서만) */}
        {activeTab === 'storybook' && allCategories.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all shrink-0',
                activeCategory === null
                  ? 'bg-ink-900 text-white shadow-soft'
                  : 'bg-white text-ink-700 hover:bg-peach-100 shadow-soft'
              )}
            >
              전체
            </button>
            {allCategories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0',
                  activeCategory === cat
                    ? 'bg-coral-500 text-white shadow-pop'
                    : 'bg-white text-ink-700 hover:bg-peach-100 shadow-soft'
                )}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-md font-black',
                    activeCategory === cat ? 'bg-white/30' : 'bg-ink-100 text-ink-700'
                  )}
                >
                  {count}
                </span>
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
        ) : showCategories && grouped ? (
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

function AuthCornerBar() {
  const { activeProfile } = useAuth();
  return (
    <div className="flex justify-end items-center gap-2 mb-2">
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white shadow-pop text-sm font-bold hover:brightness-110 active:scale-95 transition"
      >
        🎮 놀이터
      </Link>
      {activeProfile && (
        <div className="px-3 py-1.5 rounded-full bg-white shadow-soft text-sm font-bold text-ink-900">
          👦 {activeProfile.name}
        </div>
      )}
      <ParentCornerButton />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorybooks } from '@/features/storybook';
import type { StorybookSummary } from '@tangobook/shared';

type TabId = 'storybook' | 'korean-phonics' | 'english-phonics';
type SortBy = 'newest' | 'title';

const TABS: { id: TabId; label: string }[] = [
  { id: 'storybook', label: '동화책' },
  { id: 'korean-phonics', label: '한글 파닉스' },
  { id: 'english-phonics', label: '영어 파닉스' },
];

function filterByTab(books: StorybookSummary[], tab: TabId): StorybookSummary[] {
  switch (tab) {
    case 'storybook':
      return books.filter((s) => !s.type || s.type === 'storybook');
    case 'korean-phonics':
      return books.filter((s) => s.type === 'phonics' && s.phonicsLanguage === 'korean');
    case 'english-phonics':
      return books.filter((s) => s.type === 'phonics' && s.phonicsLanguage === 'english');
  }
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-md">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="검색..."
        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
      />
    </div>
  );
}

function BookCard({
  book,
  isSelected,
  onClick,
  showPageCount,
  actionButtons,
}: {
  book: StorybookSummary;
  isSelected: boolean;
  onClick: () => void;
  showPageCount?: boolean;
  actionButtons: React.ReactNode;
}) {
  return (
    <div className="group">
      <div
        onClick={onClick}
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-violet-500 rounded-xl' : ''
        }`}
      >
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm group-hover:shadow-lg transition-shadow">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
            {book.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">{book.targetAge}세</span>
            {book.category && (
              <>
                <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs text-violet-400">{book.category}</span>
              </>
            )}
            {showPageCount && book.pageCount != null && (
              <>
                <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {book.pageCount}쪽
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {isSelected && actionButtons}
    </div>
  );
}

function BookGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {children}
    </div>
  );
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { data: storybooks, isLoading } = useStorybooks();
  const [activeTab, setActiveTab] = useState<TabId>('storybook');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [searchByTab, setSearchByTab] = useState<Record<TabId, string>>({
    storybook: '',
    'korean-phonics': '',
    'english-phonics': '',
  });

  const search = searchByTab[activeTab];
  const setSearch = (v: string) => setSearchByTab((prev) => ({ ...prev, [activeTab]: v }));

  // 동화책 전체 카테고리 목록 (필터용)
  const allCategories = useMemo(() => {
    if (!storybooks) return [];
    const publicBooks = storybooks.filter((s) => s.isPublic);
    const storybookOnly = filterByTab(publicBooks, 'storybook');
    const cats = new Set<string>();
    for (const b of storybookOnly) {
      if (b.category) cats.add(b.category);
    }
    return [...cats].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [storybooks]);

  const filtered = useMemo(() => {
    if (!storybooks) return [];
    const publicBooks = storybooks.filter((s) => s.isPublic);
    const tabFiltered = filterByTab(publicBooks, activeTab);
    return tabFiltered
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.targetAge?.includes(q)
        );
      })
      .filter((s) => {
        if (activeTab !== 'storybook' || !selectedCategory) return true;
        return (s.category || '기타') === selectedCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'ko');
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [storybooks, search, activeTab, selectedCategory, sortBy]);

  // 동화책 카테고리별 그룹
  const categoryGroups = useMemo(() => {
    if (activeTab !== 'storybook') return null;
    const groups = new Map<string, StorybookSummary[]>();
    for (const book of filtered) {
      const cat = book.category || '기타';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(book);
    }
    // 카테고리 정렬: '기타'를 마지막으로
    const sorted = [...groups.entries()].sort((a, b) => {
      if (a[0] === '기타') return 1;
      if (b[0] === '기타') return -1;
      return a[0].localeCompare(b[0], 'ko');
    });
    return sorted;
  }, [filtered, activeTab]);

  const handleCardClick = (book: StorybookSummary) => {
    setSelectedBookId(selectedBookId === book.id ? null : book.id);
  };

  const renderStorybookActions = (book: StorybookSummary) => (
    <div className="flex gap-2 mt-2 px-0.5">
      <button
        onClick={() => navigate(`/viewer/${book.id}`)}
        className="flex-1 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
      >
        보기
      </button>
      <button
        onClick={() => navigate(`/viewer/${book.id}?mode=games`)}
        className="flex-1 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
      >
        게임
      </button>
    </div>
  );

  const renderPhonicsActions = (book: StorybookSummary) => (
    <div className="flex gap-2 mt-2 px-0.5">
      <button
        onClick={() => navigate(`/viewer/${book.id}`)}
        className="flex-1 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
      >
        열기
      </button>
      <button
        onClick={() => navigate(`/viewer/${book.id}?mode=games`)}
        className="flex-1 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
      >
        게임
      </button>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          {search ? '검색 결과가 없습니다.' : '콘텐츠가 없습니다.'}
        </div>
      );
    }

    // 동화책 탭: 카테고리별 그룹
    if (activeTab === 'storybook' && categoryGroups) {
      return (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {filtered.length}개 동화책
          </p>
          {categoryGroups.map(([category, books]) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-violet-500 rounded-full" />
                {category}
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                  ({books.length})
                </span>
              </h2>
              <BookGrid>
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isSelected={selectedBookId === book.id}
                    onClick={() => handleCardClick(book)}
                    showPageCount
                    actionButtons={renderStorybookActions(book)}
                  />
                ))}
              </BookGrid>
            </div>
          ))}
        </>
      );
    }

    // 파닉스 탭: 플랫 그리드
    return (
      <>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {filtered.length}개 콘텐츠
        </p>
        <BookGrid>
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isSelected={selectedBookId === book.id}
              onClick={() => handleCardClick(book)}
              actionButtons={renderPhonicsActions(book)}
            />
          ))}
        </BookGrid>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1
            className="text-xl font-bold text-violet-700 dark:text-violet-300 cursor-pointer shrink-0"
            onClick={() => navigate('/library')}
          >
            탱고북
          </h1>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0"
          >
            에디터
          </button>
        </div>

        {/* 탭 */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedBookId(null);
                  setSelectedCategory(null);
                }}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 탭별 검색 + 정렬 + 카테고리 필터 */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            >
              <option value="newest">최신순</option>
              <option value="title">제목순</option>
            </select>
          </div>
          {activeTab === 'storybook' && allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  !selectedCategory
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:border-violet-400'
                }`}
              >
                전체
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:border-violet-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {renderContent()}
      </main>
    </div>
  );
}

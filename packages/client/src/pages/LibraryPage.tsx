import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorybooks } from '@/features/storybook';
import type { StorybookSummary } from '@tangobook/shared';

type TabId = 'storybook' | 'korean-phonics' | 'english-phonics';

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

export default function LibraryPage() {
  const navigate = useNavigate();
  const { data: storybooks, isLoading } = useStorybooks();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('storybook');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [storybooks, search, activeTab]);

  const handleCardClick = (book: StorybookSummary) => {
    setSelectedBookId(selectedBookId === book.id ? null : book.id);
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

          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
          </div>

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
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            {search ? '검색 결과가 없습니다.' : '콘텐츠가 없습니다.'}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {filtered.length}개 콘텐츠
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filtered.map((book) => {
                const isSelected = selectedBookId === book.id;
                return (
                  <div key={book.id} className="group">
                    <div
                      onClick={() => handleCardClick(book)}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-violet-500 rounded-xl' : ''
                      }`}
                    >
                      {/* 표지 이미지 */}
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm group-hover:shadow-lg transition-shadow">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <svg
                              className="w-12 h-12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
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

                      {/* 정보 */}
                      <div className="mt-2 px-0.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                          {book.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {book.targetAge}세
                          </span>
                          {book.category && (
                            <>
                              <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-xs text-violet-400">{book.category}</span>
                            </>
                          )}
                          {activeTab === 'storybook' && book.pageCount != null && (
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

                    {/* 동화책 액션 버튼 (선택 시) */}
                    {isSelected && activeTab === 'storybook' && (
                      <div className="flex gap-2 mt-2 px-0.5">
                        <button
                          onClick={() => navigate(`/viewer/${book.id}`)}
                          className="flex-1 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => navigate(`/viewer/${book.id}?mode=quiz`)}
                          className="flex-1 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          퀴즈
                        </button>
                      </div>
                    )}

                    {/* 파닉스 열기 버튼 (선택 시) */}
                    {isSelected && activeTab !== 'storybook' && (
                      <div className="flex gap-1.5 mt-2 px-0.5">
                        <button
                          onClick={() => navigate(`/viewer/${book.id}`)}
                          className="flex-1 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                        >
                          열기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

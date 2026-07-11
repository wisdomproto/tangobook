import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BookCard } from './BookCard';
import type { BookIndexEntry } from '@tangobook/shared';

interface CategorySectionProps {
  /** 이모지 string 또는 AppIcon 등 ReactNode */
  icon: ReactNode;
  title: string;
  books: BookIndexEntry[];
  limit?: number;
  onShowMore?: () => void;
  /** 타이틀 오른쪽(권수 배지 옆) 커스텀 노드 — 예: 세계명작 그림풍 선택기 */
  headerExtra?: ReactNode;
}

export function CategorySection({
  icon,
  title,
  books,
  limit = 8,
  onShowMore,
  headerExtra,
}: CategorySectionProps) {
  const { t } = useTranslation('library');
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section className="mb-8 sm:mb-14">
      <header className="flex items-center justify-between mb-3 sm:mb-4 px-1 gap-2">
        <h2 className="text-xl sm:text-3xl font-black text-ink-900 font-display flex items-center gap-2 sm:gap-3 min-w-0 truncate">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {headerExtra}
          <span className="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white shadow-soft text-xs sm:text-base text-ink-700 font-black">
            {t('section.bookCount', { count: books.length })}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
        {visible.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {hasMore && onShowMore && (
        <button
          onClick={onShowMore}
          className="mt-3 sm:mt-4 w-full py-3 sm:py-4 bg-coral-100 rounded-xl sm:rounded-2xl shadow-soft text-coral-600 font-black text-sm sm:text-lg hover:bg-coral-200 transition-colors"
        >
          {t('section.showMore', { count: books.length - limit })}
        </button>
      )}
    </section>
  );
}

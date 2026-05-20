import type { ReactNode } from 'react';
import { BookCard } from './BookCard';
import type { BookIndexEntry } from '@tangobook/shared';

interface CategorySectionProps {
  /** 이모지 string 또는 AppIcon 등 ReactNode */
  icon: ReactNode;
  title: string;
  books: BookIndexEntry[];
  limit?: number;
  onShowMore?: () => void;
}

export function CategorySection({
  icon,
  title,
  books,
  limit = 9,
  onShowMore,
}: CategorySectionProps) {
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section className="mb-8 sm:mb-14">
      <header className="flex items-center justify-between mb-3 sm:mb-4 px-1 gap-2">
        <h2 className="text-xl sm:text-3xl font-black text-ink-900 font-display flex items-center gap-2 sm:gap-3 min-w-0 truncate">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        <span className="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white shadow-soft text-xs sm:text-base text-ink-700 font-black">
          {books.length}권
        </span>
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
          더 보기 ({books.length - limit}권)
        </button>
      )}
    </section>
  );
}

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
  limit = 8,
  onShowMore,
}: CategorySectionProps) {
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section className="mb-10">
      <header className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-2xl font-black text-ink-900 font-display flex items-center gap-3">
          <span>{icon}</span>
          <span>{title}</span>
        </h2>
        <span className="px-3 py-1 rounded-full bg-white shadow-soft text-sm text-ink-700 font-black">
          {books.length}권
        </span>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
        {visible.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {hasMore && onShowMore && (
        <button
          onClick={onShowMore}
          className="mt-4 w-full py-4 bg-white rounded-2xl shadow-soft text-ink-700 font-black text-base hover:bg-peach-100"
        >
          더 보기 ({books.length - limit}권)
        </button>
      )}
    </section>
  );
}

import { BookCard } from './BookCard';
import type { StorybookSummary } from '@tangobook/shared';

interface CategorySectionProps {
  icon: string;
  title: string;
  books: StorybookSummary[];
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
    <section className="mb-8">
      <header className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-black text-ink-900 font-display flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </h2>
        <span className="text-xs text-ink-500 font-bold">{books.length}권</span>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {visible.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {hasMore && onShowMore && (
        <button
          onClick={onShowMore}
          className="mt-4 w-full py-3 bg-white rounded-lg shadow-soft text-ink-700 font-bold hover:bg-peach-100"
        >
          더 보기 ({books.length - limit}권)
        </button>
      )}
    </section>
  );
}

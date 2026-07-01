import type { StorybookSummary } from '@tangobook/shared';
import type { CompletedBookStat } from '../lib/aggregate';
import { kstDateKey } from '../lib/aggregate';

interface Props {
  items: CompletedBookStat[];
  storybooks: StorybookSummary[];
}

export function CompletedBooksList({ items, storybooks }: Props) {
  if (items.length === 0) return null;

  const byId = new Map(storybooks.map((s) => [s.id, s]));
  const stripVariant = (id: string) => id.replace(/__L[1-4]$/, '');

  const findBook = (id: string): StorybookSummary | undefined =>
    byId.get(id) ?? byId.get(stripVariant(id));

  const resolved = items
    .map((item) => ({ item, book: findBook(item.storybookId) }))
    .filter((r): r is { item: CompletedBookStat; book: StorybookSummary } => r.book !== undefined)
    .sort((a, b) => (a.item.lastAt > b.item.lastAt ? -1 : 1));

  if (resolved.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-base font-bold">완독한 책</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {resolved.map(({ item, book }) => (
          <div key={item.storybookId} className="flex w-32 shrink-0 flex-col items-center">
            <div className="relative h-40 w-32 overflow-hidden rounded-xl bg-peach-100 shadow-sm">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">📖</div>
              )}
              {item.count > 1 && (
                <span className="absolute right-1 top-1 rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  ×{item.count}
                </span>
              )}
            </div>
            <div className="mt-1.5 w-full break-keep text-center text-xs font-semibold text-ink-700">
              {book.title}
            </div>
            <div className="text-[10px] text-coral-500 font-medium">{item.count}회 완독</div>
            <div className="text-[10px] text-ink-400">{kstDateKey(item.lastAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import type { StorybookSummary } from '@tangobook/shared';
import type { CompletedBookStat, RecentBookStat } from '../lib/aggregate';
import { formatKstDate } from '../lib/aggregate';

interface Props {
  /** recentBooks() 결과 — 최근 순 */
  items: RecentBookStat[];
  /** completedBooks() 를 storybookId 로 맵핑한 것 — 완독 리본 표시용 */
  completed: Map<string, CompletedBookStat>;
  storybooks: StorybookSummary[];
}

const stripVariant = (id: string) => id.replace(/__L[1-4]$/, '');

/**
 * "읽은 책" 표지 스트립 — 완독 여부와 무관하게 만난 책 전부 노출.
 * (표지가 리포트의 감정 훅 — 완독에만 잠그면 읽다 만 책 10권이어도 화면이 텅 빈다)
 * 완독한 책엔 🎉 리본, 아니면 "읽는 중" 칩.
 */
export function RecentBooksStrip({ items, completed, storybooks }: Props) {
  const { t } = useTranslation('learning');
  if (items.length === 0) return null;

  const byId = new Map(storybooks.map((s) => [s.id, s]));
  const findBook = (id: string): StorybookSummary | undefined =>
    byId.get(id) ?? byId.get(stripVariant(id));

  const resolved = items.flatMap((item) => {
    const book = findBook(item.storybookId);
    return book ? [{ item, book, done: completed.get(item.storybookId) }] : [];
  });

  if (resolved.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-ink-900">{t('recentBooks.title')}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {resolved.map(({ item, book, done }) => (
          <div key={item.storybookId} className="flex w-32 shrink-0 flex-col items-center">
            <div className="relative h-40 w-32 overflow-hidden rounded-xl bg-peach-100 shadow-soft">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">📖</div>
              )}
              <span
                className={
                  'absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-soft ' +
                  (done ? 'bg-coral-500 text-white' : 'bg-white/90 text-amber-600')
                }
              >
                {done ? t('recentBooks.completed') : t('recentBooks.reading')}
              </span>
            </div>
            <div className="mt-1.5 w-full break-keep text-center text-xs font-semibold text-ink-700">
              {book.title}
            </div>
            <div className="text-[10px] font-medium text-coral-500">
              {done && done.count > 1 ? t('recentBooks.readCount', { count: done.count }) : ''}
            </div>
            <div className="text-[10px] text-ink-400">{formatKstDate(item.lastAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { groupByWord, countDistinctBooks } from '../lib/aggregate';
import { VocabularyMasteryCard } from './VocabularyMasteryCard';
import { ReportEmptyState } from './ReportEmptyState';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

function StatChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-coral-500">{value}</div>
      <div className="text-xs text-ink-500">
        {label} ({unit})
      </div>
    </div>
  );
}

function BookThumb({
  book,
  lastReadAt,
  reads,
}: {
  book: StorybookSummary;
  lastReadAt?: string;
  reads: number;
}) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-center">
      <div className="relative h-40 w-32 overflow-hidden rounded-xl bg-peach-100 shadow-sm">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">📖</div>
        )}
        {reads > 1 && (
          <span className="absolute right-1 top-1 rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-white">
            ×{reads}
          </span>
        )}
      </div>
      <div className="mt-1.5 w-full truncate text-center text-xs font-semibold text-ink-700">
        {book.title}
      </div>
      {lastReadAt && (
        <div className="text-[10px] text-ink-400">
          {new Date(lastReadAt).toLocaleDateString('ko-KR')}
        </div>
      )}
    </div>
  );
}

export function StorybookReportSection({ events, storybooks, lang }: Props) {
  const relevant = events.filter((e) => !e.metadata?.lang || e.metadata.lang === lang);
  const pageReads = relevant.filter((e) => e.event_type === 'page_read');

  const bookStats = new Map<string, { reads: number; lastAt: string }>();
  for (const e of pageReads) {
    if (!e.storybook_id) continue;
    const cur = bookStats.get(e.storybook_id) ?? { reads: 0, lastAt: e.created_at };
    cur.reads += 1;
    if (e.created_at > cur.lastAt) cur.lastAt = e.created_at;
    bookStats.set(e.storybook_id, cur);
  }

  const readBooksCount = countDistinctBooks(relevant, lang);
  const totalPages = pageReads.length;
  const activeDays = new Set(pageReads.map((e) => e.created_at.slice(0, 10))).size;

  const recent = [...bookStats.entries()]
    .sort((a, b) => (a[1].lastAt > b[1].lastAt ? -1 : 1))
    .slice(0, 10)
    .map(([id, s]) => {
      const book = storybooks.find((b) => b.id === id);
      return book ? { book, ...s } : null;
    })
    .filter((x): x is { book: StorybookSummary; reads: number; lastAt: string } => !!x);

  const wordStats = groupByWord(relevant, lang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="읽은 책" value={readBooksCount} unit="권" />
        <StatChip label="총 페이지" value={totalPages} unit="쪽" />
        <StatChip label="활동 일수" value={activeDays} unit="일" />
      </div>

      <div>
        <h3 className="mb-2 text-base font-bold">최근 읽은 책</h3>
        {recent.length === 0 ? (
          <ReportEmptyState
            emoji="📚"
            message={`${lang === 'ko' ? '한글' : '영어'} 책을 아직 읽지 않았어요`}
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recent.map((r) => (
              <BookThumb key={r.book.id} book={r.book} lastReadAt={r.lastAt} reads={r.reads} />
            ))}
          </div>
        )}
      </div>

      <VocabularyMasteryCard stats={wordStats} />
    </div>
  );
}

import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { countDistinctBooks } from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';
import {
  ArtStyleDistributionCard,
  getArtStyleEmoji,
  getArtStyleLabel,
} from './ArtStyleDistributionCard';

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
  styleHint,
}: {
  book: StorybookSummary;
  lastReadAt?: string;
  reads: number;
  styleHint?: string;
}) {
  const styleRaw = styleHint ?? book.artStyle;
  const styleLabel = styleRaw ? getArtStyleLabel(styleRaw) : null;
  const styleEmoji = styleRaw ? getArtStyleEmoji(styleRaw) : null;
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
        {styleLabel && (
          <span
            className="absolute bottom-1 left-1 right-1 truncate rounded-full bg-black/55 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white backdrop-blur-sm"
            title={styleLabel}
          >
            {styleEmoji} {styleLabel}
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
  // phonics storybook은 파닉스 섹션에서만 집계 (동화책 섹션에서 제외)
  const phonicsIds = new Set(storybooks.filter((s) => s.type === 'phonics').map((s) => s.id));
  const relevant = events
    .filter((e) => !e.metadata?.lang || e.metadata.lang === lang)
    .filter((e) => !e.storybook_id || !phonicsIds.has(e.storybook_id));
  const nonPhonicsBooks = storybooks.filter((s) => s.type !== 'phonics');

  // ID lookup: 직접 매칭 → variant suffix(__L1/L2/L3) 떼기 → base 매칭 → 그래도 없으면 phonics 까지 포함해서 매칭
  const stripVariant = (id: string): string => id.replace(/__L[1-4]$/, '');
  const findBook = (id: string): StorybookSummary | undefined => {
    const direct = nonPhonicsBooks.find((b) => b.id === id);
    if (direct) return direct;
    const base = stripVariant(id);
    const baseMatch = nonPhonicsBooks.find((b) => b.id === base);
    if (baseMatch) return baseMatch;
    // 마지막 수단: phonics 까지 포함해서 매칭 (위 분류가 잘못됐을 가능성)
    return storybooks.find((b) => b.id === id || b.id === base);
  };

  const pageReads = relevant.filter((e) => e.event_type === 'page_read');

  const bookStats = new Map<string, { reads: number; lastAt: string; lastStyle?: string }>();
  for (const e of pageReads) {
    if (!e.storybook_id) continue;
    const cur = bookStats.get(e.storybook_id) ?? { reads: 0, lastAt: e.created_at };
    cur.reads += 1;
    if (e.created_at >= cur.lastAt) {
      cur.lastAt = e.created_at;
      // 가장 최근에 읽은 그림체를 썸네일 칩에 표시
      if (e.metadata?.style) cur.lastStyle = e.metadata.style;
    }
    bookStats.set(e.storybook_id, cur);
  }

  const readBooksCount = countDistinctBooks(relevant, lang);
  const totalPages = pageReads.length;
  const activeDays = new Set(pageReads.map((e) => e.created_at.slice(0, 10))).size;

  const recent = [...bookStats.entries()]
    .sort((a, b) => (a[1].lastAt > b[1].lastAt ? -1 : 1))
    .slice(0, 10)
    .map(([id, s]) => {
      const book = findBook(id);
      const fallback: StorybookSummary = {
        id,
        title: '(알 수 없는 책)',
        type: 'general',
        coverImage: undefined,
      } as unknown as StorybookSummary;
      return { book: book ?? fallback, ...s };
    });

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
              <BookThumb
                key={r.book.id}
                book={r.book}
                lastReadAt={r.lastAt}
                reads={r.reads}
                styleHint={r.lastStyle}
              />
            ))}
          </div>
        )}
      </div>

      {/* 그림체 분포: lookup 의 폴백 가능성 높이려고 storybooks 전체 넘김 (phonics 도 포함). relevant 이벤트는 이미 phonics 제외됨. */}
      <ArtStyleDistributionCard events={relevant} storybooks={storybooks} lang={lang} />
    </div>
  );
}

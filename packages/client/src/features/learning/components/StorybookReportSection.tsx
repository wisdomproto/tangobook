import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import {
  booksThisWeek,
  completedBooks,
  computeStreak,
  estimateReadingMinutes,
  metWords,
} from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';
import { ArtStyleDistributionCard } from './ArtStyleDistributionCard';
import { StorybookSummaryCards } from './StorybookSummaryCards';
import { CompletedBooksList } from './CompletedBooksList';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

const MET_WORDS_LIMIT = 40;

export function StorybookReportSection({ events, storybooks, lang }: Props) {
  const now = new Date();

  // phonics storybook은 파닉스 섹션에서만 집계 (동화책 섹션에서 제외)
  const phonicsIds = new Set(storybooks.filter((s) => s.type === 'phonics').map((s) => s.id));
  const relevant = events
    .filter((e) => !e.metadata?.lang || e.metadata.lang === lang)
    .filter((e) => !e.storybook_id || !phonicsIds.has(e.storybook_id));

  // Summary stats
  const weekBooks = booksThisWeek(relevant, now, lang);
  const minutes = estimateReadingMinutes(relevant);
  const streak = computeStreak(relevant, now);

  // Completed books (using full events filtered to lang/non-phonics)
  const completed = completedBooks(relevant);

  // Met words (capped)
  const words = metWords(relevant, lang).slice(0, MET_WORDS_LIMIT);

  const hasAnyActivity = relevant.some((e) => e.event_type === 'page_read');

  return (
    <div className="space-y-4">
      {/* Summary: 이번 주 N권 · 약 N분 · 연속 N일 */}
      <StorybookSummaryCards booksThisWeek={weekBooks} minutes={minutes} streak={streak} />

      {/* 완독한 책 */}
      <CompletedBooksList items={completed} storybooks={storybooks} />

      {/* 최근 읽은 책 (activity check) */}
      {!hasAnyActivity && (
        <ReportEmptyState
          emoji="📚"
          message={`${lang === 'ko' ? '한글' : '영어'} 책을 아직 읽지 않았어요`}
        />
      )}

      {/* 만난 단어 */}
      {words.length > 0 && (
        <div>
          <h3 className="mb-2 text-base font-bold">이런 단어들을 만났어요</h3>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <span
                key={w}
                className="break-keep rounded-full bg-peach-100 px-3 py-1 text-xs font-medium text-ink-700"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 그림체 분포: 재미 요소, 학습 성과 아님 */}
      <details className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <summary className="cursor-pointer select-none text-base font-bold text-ink-700">
          이런 그림체를 좋아해요
        </summary>
        <div className="mt-3">
          {/* storybooks 전체 넘김 — phonics 포함해도 relevant 이벤트는 이미 phonics 제외됨 */}
          <ArtStyleDistributionCard events={relevant} storybooks={storybooks} lang={lang} />
        </div>
      </details>
    </div>
  );
}

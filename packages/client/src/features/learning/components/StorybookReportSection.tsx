import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import {
  booksThisWeek,
  completedBooks,
  computeStreak,
  estimateReadingMinutes,
  metWords,
  recentBooks,
  weekActivity,
} from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';
import { ArtStyleDistributionCard } from './ArtStyleDistributionCard';
import { WeeklyHeroCard } from './WeeklyHeroCard';
import { RecentBooksStrip } from './RecentBooksStrip';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

const MET_WORDS_LIMIT = 40;
const WEEK_MS = 7 * 86_400_000;

export function StorybookReportSection({ events, storybooks, lang }: Props) {
  const now = new Date();

  // phonics storybook은 파닉스 섹션에서만 집계 (동화책 섹션에서 제외)
  const phonicsIds = new Set(storybooks.filter((s) => s.type === 'phonics').map((s) => s.id));
  const relevant = events
    .filter((e) => !e.metadata?.lang || e.metadata.lang === lang)
    .filter((e) => !e.storybook_id || !phonicsIds.has(e.storybook_id));

  // 히어로 stats — 전부 "이번 주" 기준으로 통일
  const weekEvents = relevant.filter((e) => Date.parse(e.created_at) >= now.getTime() - WEEK_MS);
  const weekBooks = booksThisWeek(relevant, now, lang);
  const weekMinutes = weekEvents.length > 0 ? estimateReadingMinutes(weekEvents) : 0;
  const streak = computeStreak(relevant, now);
  const days = weekActivity(relevant, now);

  // 읽은 책 스트립 — 완독 여부와 무관하게 만난 책 전부 (완독은 리본으로 표시)
  const recent = recentBooks(relevant);
  const completed = new Map(completedBooks(relevant).map((c) => [c.storybookId, c]));

  // Met words (최근 순, capped)
  const allWords = metWords(relevant, lang);
  const words = allWords.slice(0, MET_WORDS_LIMIT);

  const hasAnyActivity = relevant.some((e) => e.event_type === 'page_read');

  return (
    <div className="space-y-5">
      {/* 히어로 — 호리 + 이번 주 한 줄 + 읽기 리듬 도트 */}
      <WeeklyHeroCard weekBooks={weekBooks} weekMinutes={weekMinutes} streak={streak} days={days} />

      {/* 읽은 책 표지 스트립 */}
      <RecentBooksStrip items={recent} completed={completed} storybooks={storybooks} />

      {!hasAnyActivity && (
        <ReportEmptyState
          mascot
          message={`${lang === 'ko' ? '한글' : '영어'} 책을 아직 읽지 않았어요`}
          ctaLabel="동화책 보러 가기"
          ctaTo="/library"
        />
      )}

      {/* 만난 단어 */}
      {words.length > 0 && (
        <div>
          <h3 className="mb-2 text-base font-bold text-ink-900">
            <span>이런 단어들을 만났어요</span>
            <span className="ml-1.5 text-sm font-black text-coral-500">
              모두 {allWords.length}개
            </span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <span
                key={w}
                className="break-keep rounded-full bg-peach-100 px-3 py-1 text-xs font-medium text-ink-700"
              >
                {w}
              </span>
            ))}
            {allWords.length > words.length && (
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-500">
                외 {allWords.length - words.length}개
              </span>
            )}
          </div>
        </div>
      )}

      {/* 그림체 분포: 재미 요소, 학습 성과 아님 */}
      <details className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <summary className="cursor-pointer select-none list-none text-base font-bold text-ink-700 [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-xs text-ink-400 transition-transform [details[open]_&]:rotate-90">
            ▶
          </span>
          이런 그림체를 좋아해요
        </summary>
        <div className="mt-3">
          {/* storybooks 전체 넘김 — phonics 포함해도 relevant 이벤트는 이미 phonics 제외됨 */}
          <ArtStyleDistributionCard events={relevant} storybooks={storybooks} lang={lang} bare />
        </div>
      </details>
    </div>
  );
}

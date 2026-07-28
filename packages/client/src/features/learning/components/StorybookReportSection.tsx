import { useTranslation } from 'react-i18next';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import {
  kstDateKey,
  booksThisWeek,
  completedBooks,
  computeStreak,
  estimateReadingMinutes,
  recentBooks,
  weekActivity,
  wordDetails,
} from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';
import { ArtStyleGenreCard } from './ArtStyleGenreCard';
import { MetWordsCard } from './MetWordsCard';
import { ReviewWordsCard } from './ReviewWordsCard';
import { WeeklyHeroCard } from './WeeklyHeroCard';
import { RecentBooksStrip } from './RecentBooksStrip';

interface Props {
  /** 이벤트가 상한에 걸려 오래된 기록이 빠졌는가. */
  capped?: boolean;
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

const WEEK_MS = 7 * 86_400_000;

export function StorybookReportSection({ events, storybooks, lang, capped }: Props) {
  const { t } = useTranslation('learning');
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
  /**
   * 🔴 **읽기 리듬은 읽은 날만** — 예전엔 모든 이벤트를 셌다. 아이가 단어 게임만 3분 하고
   *    책은 한 장도 안 봤는데 그 날 도트에 ✓ 가 켜지고 「🔥 연속 4일」 이 유지됐다.
   *    라벨이 "읽음" 이면 세는 것도 읽기여야 한다.
   */
  const readEvents = relevant.filter((e) => e.event_type === 'page_read');
  const streak = computeStreak(readEvents, now);
  const days = weekActivity(readEvents, now);

  // 오늘 — 부모가 제일 먼저 묻는 것. 같은 7일 창 계산을 하루로 좁히면 된다.
  const todayKey = kstDateKey(now.toISOString());
  const todayEvents = relevant.filter((e) => kstDateKey(e.created_at) === todayKey);
  const todayMinutes = todayEvents.length > 0 ? estimateReadingMinutes(todayEvents) : 0;
  const todayBookId = [...todayEvents]
    .reverse()
    .find((e) => e.event_type === 'page_read' && e.storybook_id)?.storybook_id;
  const todayBookTitle = todayBookId
    ? storybooks.find((s) => s.id === todayBookId)?.title
    : undefined;
  // 지난주(7~14일 전) — 이번 주가 는 건지 준 건지 견줄 기준.
  const prevWeekBooks = booksThisWeek(
    relevant.filter((e) => Date.parse(e.created_at) < now.getTime() - WEEK_MS),
    new Date(now.getTime() - WEEK_MS),
    lang
  );

  // 읽은 책 스트립 — 완독 여부와 무관하게 만난 책 전부 (완독은 리본으로 표시)
  const recent = recentBooks(relevant);
  const completed = new Map(completedBooks(relevant).map((c) => [c.storybookId, c]));

  // 학습한 단어 — 단어별 상세(어느 책·읽음·게임), 언어는 단어 문자로 분류(섞임 방지)
  const wordItems = wordDetails(relevant, lang);

  const hasAnyActivity = relevant.some((e) => e.event_type === 'page_read');

  return (
    <div className="space-y-5">
      {/* 히어로 — 호리 + 이번 주 한 줄 + 읽기 리듬 도트 */}
      <WeeklyHeroCard
        todayMinutes={todayMinutes}
        {...(todayBookTitle ? { todayBookTitle } : {})}
        prevWeekBooks={prevWeekBooks}
        weekBooks={weekBooks}
        weekMinutes={weekMinutes}
        streak={streak}
        days={days}
      />

      {/* 읽은 책 표지 스트립 */}
      <RecentBooksStrip items={recent} completed={completed} storybooks={storybooks} />

      {!hasAnyActivity && (
        <ReportEmptyState
          mascot
          message={t(lang === 'ko' ? 'storybookReport.emptyKo' : 'storybookReport.emptyEn')}
          ctaLabel={t('storybookReport.goToLibrary')}
          ctaTo="/library"
        />
      )}

      {/* 🔴 이 리포트에서 **유일하게 행동이 되는 카드** — 헷갈린 단어 5개 + 그 책으로 가는 링크.
          「만난 단어 N개」보다 위에 온다(그건 자랑이고, 이건 오늘 밤 할 일이다). */}
      <ReviewWordsCard words={wordItems} storybooks={storybooks} />

      {/* 학습한 단어 — 카드 그리드. 🔴 **접어 둔다**: 24장이 화면 절반을 먹는데 시키는 행동이 없다.
          🔴 단어가 없으면 접이식 껍데기도 만들지 않는다(빈 아코디언은 "고장" 으로 읽힌다). */}
      {wordItems.length > 0 && (
        <details className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <summary className="cursor-pointer text-base font-bold text-ink-900">
            {t('metWords.title')}
          </summary>
          <div className="mt-3">
            <MetWordsCard details={wordItems} storybooks={storybooks} capped={capped} />
          </div>
        </details>
      )}

      {/* 그림체 분포: 재미 요소, 학습 성과 아님. 메인 3종 장르만. */}
      <details className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <summary className="cursor-pointer select-none list-none text-base font-bold text-ink-700 [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-xs text-ink-400 transition-transform [details[open]_&]:rotate-90">
            ▶
          </span>
          {t('storybookReport.artStyleTitle')}
        </summary>
        <div className="mt-3">
          {/* storybooks 전체 넘김 — phonics 포함해도 relevant 이벤트는 이미 phonics 제외됨 */}
          <ArtStyleGenreCard events={relevant} storybooks={storybooks} lang={lang} bare />
        </div>
      </details>
    </div>
  );
}

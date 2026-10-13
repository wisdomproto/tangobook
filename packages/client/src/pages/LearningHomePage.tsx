import { getCourseTheme } from '@/design-system';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { useBookGroups } from '@/features/library/hooks/useBookGroups';
import { useLibraryConfig } from '@/features/library/hooks/useLibraryConfig';
import { recommendBooks } from '@/features/library/lib/home-recommendations';
import { usePhonicsProgress } from '@/features/phonics-learner/lib/progress-store';
import {
  journeyProgress,
  journeyActivityUrl,
  hasJourneyStarted,
} from '@/features/phonics-learner/lib/learning-journey';
import { unitTitle } from '@/features/phonics-learner/lib/activity-title';
import { BookCover } from '@/design-system/primitives/BookCover';
import { bookDisplayTitle } from '@tangobook/shared';

export default function LearningHomePage() {
  const { activeProfile } = useAuth();
  return <LearningHomeContent key={activeProfile?.id ?? 'guest'} />;
}

function LearningHomeContent() {
  const { t, i18n } = useTranslation('shell');
  const { t: tp } = useTranslation('phonics');
  const { data: books = [], isLoading, isError, refetch } = useStorybooks();
  const { data: groups } = useBookGroups();
  const { data: config } = useLibraryConfig();
  const now = new Date();
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const recommended = recommendBooks(books, groups?.groups, config, day);
  const ko = usePhonicsProgress('korean');
  const en = usePhonicsProgress('english');
  const koProgress = journeyProgress('korean', ko.unitCompletedActivities);
  const enProgress = journeyProgress('english', en.unitCompletedActivities);
  const recent = [
    { lang: 'korean' as const, progress: koProgress },
    { lang: 'english' as const, progress: enProgress },
  ].filter(
    (item) => (item.progress.completed > 0 || hasJourneyStarted(item.lang)) && item.progress.current
  );
  const focus =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-700';
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pt-8">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('home.title')}</h1>
        <p className="mt-3 text-base text-ink-600 md:text-lg">{t('home.subtitle')}</p>
      </div>
      <section aria-label={t('home.courses')} className="grid gap-4 sm:grid-cols-2 md:gap-6">
        {(['korean', 'english'] as const).map((lang) => (
          <Link
            key={lang}
            to={`/library/phonics/${lang}`}
            className={`group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[24px] border-2 p-6 transition-colors md:min-h-[220px] md:p-8 ${getCourseTheme(lang)!.surface} ${getCourseTheme(lang)!.focus}`}
          >
            <div className="relative z-10 max-w-[calc(100%_-_112px)] md:max-w-[calc(100%_-_136px)]">
              <h2 className="text-2xl font-bold md:text-3xl">{t(`nav.${lang}`)}</h2>
              <p className="mt-3 break-keep text-base leading-relaxed text-ink-600 md:text-lg">
                {t(`home.${lang}Description`)}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`absolute right-5 top-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/70 text-5xl font-bold md:right-8 md:top-8 md:h-28 md:w-28 md:text-6xl ${getCourseTheme(lang)!.text}`}
            >
              {lang === 'korean' ? '가' : 'Aa'}
            </span>
            <span
              className={`mt-6 inline-flex min-h-12 w-fit items-center gap-8 rounded-xl px-5 text-base font-bold ${getCourseTheme(lang)!.action}`}
            >
              {t('home.start')}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </section>
      {recent.length > 0 && (
        <section
          className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white px-5 py-3"
          aria-labelledby="continue-heading"
        >
          <h2 id="continue-heading" className="text-lg font-bold">
            {t('home.continue')}
          </h2>
          <div className="flex flex-1 flex-wrap gap-3">
            {recent.map(({ lang, progress }) => (
              <Link
                key={lang}
                to={journeyActivityUrl(
                  lang,
                  progress.current!.unit.id,
                  progress.current!.activity.key
                )}
                className={`flex min-h-12 min-w-36 flex-1 items-center justify-between gap-4 rounded-xl px-4 py-2 ${getCourseTheme(lang)!.badge} ${getCourseTheme(lang)!.focus}`}
              >
                <div>
                  <p className="text-sm font-bold text-ink-600">{t(`nav.${lang}`)}</p>
                  <p className="mt-1 text-lg font-bold">{unitTitle(tp, progress.current!.unit)}</p>
                </div>
                <span aria-hidden="true" className={getCourseTheme(lang)!.text}>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="mt-8" aria-labelledby="recommend-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recommend-heading" className="text-xl font-bold md:text-2xl">
            {t('home.recommended')}
          </h2>
          <Link
            to="/library/books"
            className={`inline-flex min-h-11 items-center gap-2 text-base font-bold text-ink-600 ${focus}`}
          >
            {t('home.allBooks')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        {isLoading ? (
          <div
            role="status"
            aria-label={t('home.loading')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="aspect-video motion-safe:animate-pulse rounded-2xl bg-peach-100"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-white p-5">
            <p>{t('home.loadError')}</p>
            <button
              type="button"
              className="mt-3 min-h-11 font-bold text-coral-700"
              onClick={() => void refetch()}
            >
              {t('home.retry')}
            </button>
          </div>
        ) : recommended.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {recommended.map((book, idx) => (
              <Link
                key={book.id}
                to={`/library/${book.id}`}
                aria-label={bookDisplayTitle(book, i18n.language)}
                className={`block min-w-[240px] shrink-0 overflow-hidden rounded-2xl shadow-soft sm:min-w-0 ring-1 ring-ink-200/60 ${focus}`}
              >
                <div className="aspect-video">
                  <BookCover
                    book={book}
                    lang={i18n.language}
                    overlayTitle
                    loading="eager"
                    priority={idx === 0}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-ink-600">{t('home.noBooks')}</p>
        )}
      </section>
    </div>
  );
}

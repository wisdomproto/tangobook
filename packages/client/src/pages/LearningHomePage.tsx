import { StorybookTitle } from '@/design-system/primitives/StorybookTitle';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { getCourseTheme } from '@/design-system';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { useBookGroups } from '@/features/library/hooks/useBookGroups';
import { useLibraryConfig } from '@/features/library/hooks/useLibraryConfig';
import { recommendBooks } from '@/features/library/lib/home-recommendations';
import { BookCover } from '@/design-system/primitives/BookCover';
import { bookDisplayTitle } from '@tangobook/shared';
import { useMemo, useState } from 'react';
import { ArrowRight, Shuffle, Play } from 'lucide-react';
import './learning-home.css';
import { useSeo } from '@/lib/useSeo';
import { usePhonicsProgress } from '@/features/phonics-learner/lib/progress-store';
import {
  journeyProgress,
  hasJourneyStarted,
  journeyActivityUrl,
  type JourneyLanguage,
} from '@/features/phonics-learner/lib/learning-journey';
import { activityTitle } from '@/features/phonics-learner/lib/activity-title';

function HomeCourseResume({ lang }: { lang: JourneyLanguage }) {
  const { t } = useTranslation('phonics');
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  const progress = journeyProgress(lang, unitCompletedActivities);
  if (!progress.current || !(progress.completed > 0 || hasJourneyStarted(lang))) return null;
  return (
    <Link
      className="home-course-resume"
      style={getCourseTheme(lang)!.style}
      aria-label={`${t(`journey.${lang}`)} · ${t('journey.continue')}`}
      to={journeyActivityUrl(lang, progress.current.unit.id, progress.current.activity.key)}
    >
      <span className="home-resume-icon" aria-hidden="true">
        <Play size={22} fill="currentColor" />
      </span>
      <span>
        <strong>{t(`journey.${lang}`)}</strong>
        <small>{activityTitle(t, progress.current.activity)}</small>
      </span>
      <span className="home-resume-action">
        {t('journey.continue')}
        <ArrowRight size={19} aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function LearningHomePage() {
  const { activeProfile } = useAuth();
  return <LearningHomeContent key={activeProfile?.id ?? 'guest'} />;
}

function LearningHomeContent() {
  const { t, i18n } = useTranslation('shell');
  useSeo({
    title: t('home.seoTitle'),
    description: t('home.subtitle'),
    keywords: t('home.courses'),
    path: '/library',
  });
  const { data: books = [], isLoading, isError, refetch } = useStorybooks();
  const { data: groups } = useBookGroups();
  const { data: config } = useLibraryConfig();
  const now = new Date();
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const [shuffle, setShuffle] = useState({ seed: '', previousIds: [] as string[] });
  const recommended = useMemo(
    () =>
      recommendBooks(
        books,
        groups?.groups,
        config,
        shuffle.seed ? `${day}:${shuffle.seed}` : day,
        shuffle.previousIds
      ),
    [books, groups?.groups, config, day, shuffle]
  );
  const courses = ['korean', 'english'] as const;
  const focus =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-700';
  return (
    <div className="storybook-home-page mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pt-8">
      <div className="mb-7">
        <StorybookTitle className="text-3xl font-bold tracking-tight md:text-4xl">
          {t('home.title')}
        </StorybookTitle>
        <p className="mt-3 text-center text-base text-ink-600 md:text-lg">{t('home.subtitle')}</p>
      </div>
      <section aria-label={t('home.courses')} className="grid gap-4 sm:grid-cols-2 md:gap-6">
        {courses.map((lang) => {
          return (
            <Link
              key={lang}
              to={`/library/phonics/${lang}`}
              data-language={lang}
              aria-label={t(`nav.${lang}`)}
              style={getCourseTheme(lang)!.style}
              className={`home-language-portal ${getCourseTheme(lang)!.focus}`}
            >
              <div className="home-language-copy">
                <h2>{t(`nav.${lang}`)}</h2>
                <p>{t(`home.${lang}Description`)}</p>
                <span className="home-language-arrow" aria-hidden="true">
                  <ArrowRight size={24} />
                </span>
              </div>
              <span className="home-language-art" aria-hidden="true">
                <span className="home-language-orbit" />
                <StorybookSprite name={lang} className="home-language-letter" />
              </span>
            </Link>
          );
        })}
      </section>
      <div className="home-resume-row">
        {courses.map((lang) => (
          <HomeCourseResume key={lang} lang={lang} />
        ))}
      </div>
      <section className="mt-8" aria-labelledby="recommend-heading">
        <div className="home-recommend-heading">
          <div className="home-recommend-title">
            <h2 id="recommend-heading" className="text-xl font-bold md:text-2xl">
              {t('home.recommended')}
            </h2>
            <button
              type="button"
              className={`home-recommend-shuffle ${focus}`}
              aria-label={t('home.shuffle')}
              title={t('home.shuffle')}
              disabled={isLoading || isError || recommended.length === 0}
              onClick={() =>
                setShuffle({
                  seed: crypto.randomUUID(),
                  previousIds: recommended.map((book) => book.id),
                })
              }
            >
              <Shuffle size={22} aria-hidden="true" />
            </button>
          </div>
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
          <div
            aria-live="polite"
            className="home-recommended-books flex gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible"
          >
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

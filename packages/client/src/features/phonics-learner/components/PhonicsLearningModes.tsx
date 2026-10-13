import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Route, Sparkles } from 'lucide-react';
import { courseThemes } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PhonicsBackdrop } from './PhonicsBackdrop';
import { PhonicsCurriculumPath } from './PhonicsCurriculumPath';
import { getKoreanUnit } from '../lib/korean-phonics-units';
import { getEnglishUnit } from '../lib/english-phonics-units';
import { activityTitle, unitTitle } from '../lib/activity-title';
import { getRecentUnit, usePhonicsProgress } from '../lib/progress-store';
import {
  journeyActivityUrl,
  journeyHomeUrl,
  journeyProgress,
  journeyUnits,
  hasJourneyStarted,
  type JourneyLanguage,
} from '../lib/learning-journey';

export function PhonicsLearningModes({ lang }: { lang: JourneyLanguage }) {
  const { t } = useTranslation('phonics');
  const [search] = useSearchParams();
  const { activeProfile } = useAuth();
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  // Reading is scoped to the active child; changing profiles must also rerender this page.
  const progress = journeyProgress(lang, unitCompletedActivities);
  const started = progress.completed > 0 || hasJourneyStarted(lang);
  const units = journeyUnits(lang);
  const theme = courseThemes[lang];
  const curriculum = search.get('mode') === 'curriculum';
  const recent = getRecentUnit(lang);
  const freeUnit =
    (lang === 'korean' ? getKoreanUnit(recent ?? '') : getEnglishUnit(recent ?? '')) ?? units[0];
  const title = t(`journey.${lang}`);
  const startUrl = progress.current
    ? journeyActivityUrl(lang, progress.current.unit.id, progress.current.activity.key)
    : undefined;
  const finishedUnit = units.find((u) => u.id === search.get('finished'));
  const finishedUnitDone =
    finishedUnit &&
    progress.steps.some((s) => s.unit.id === finishedUnit.id) &&
    progress.steps
      .map((s, i) => ({ ...s, done: progress.done[i] }))
      .filter((s) => s.unit.id === finishedUnit.id)
      .every((s) => s.done);

  if (curriculum) {
    return (
      <PhonicsCurriculumPath
        key={`${lang}:${activeProfile?.id ?? 'guest'}`}
        lang={lang}
        progress={progress}
        started={started}
        finishedUnitDone={!!finishedUnitDone}
      />
    );
  }
  return (
    <section
      key={activeProfile?.id ?? 'guest'}
      style={theme.style}
      className="phonics-course-page relative min-h-[calc(100dvh-73px)] overflow-hidden bg-cream-50 pb-24"
    >
      <PhonicsBackdrop />
      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
        <Link
          to="/library"
          className={`inline-flex min-h-11 items-center gap-2 font-bold text-ink-700 ${theme.focus}`}
        >
          ← {t('common.home')}
        </Link>
        <header className="my-6">
          <p className={`mb-2 font-bold ${theme.text}`}>{title}</p>
          <h1 className="text-3xl font-black text-ink-900 sm:text-4xl">{t('journey.modeTitle')}</h1>
          <p className="mt-3 text-base text-ink-600 sm:text-lg">{t('journey.modeDescription')}</p>
        </header>
        {
          <div className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
            <section className="rounded-[32px] border border-white bg-white/95 p-5 shadow-soft sm:p-10">
              <div className="flex items-center gap-4 sm:block">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:mb-6 sm:h-20 sm:w-20 sm:rounded-3xl ${theme.badge}`}
                >
                  <Route className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <h2 className="text-2xl font-black">{t('journey.curriculum')}</h2>
              </div>
              <p className="mt-3 text-sm text-ink-600 sm:min-h-14 sm:text-base">
                {t('journey.guidedDescription')}
              </p>
              {progress.current && (
                <p className="mt-3 text-sm font-bold text-ink-700 sm:mt-5 sm:text-base">
                  {unitTitle(t, progress.current.unit)} ·{' '}
                  {activityTitle(t, progress.current.activity)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 sm:mt-6">
                <Link
                  to={startUrl ?? journeyHomeUrl(lang)}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black sm:min-h-14 sm:gap-3 sm:px-7 sm:text-base ${theme.action} ${theme.focus}`}
                >
                  {t(
                    progress.finished
                      ? 'journey.viewJourney'
                      : started
                        ? 'journey.continue'
                        : 'journey.start'
                  )}{' '}
                  <ArrowRight size={22} />
                </Link>
                {startUrl && (
                  <Link
                    to={journeyHomeUrl(lang)}
                    className={`inline-flex min-h-11 items-center py-2 text-xs font-bold sm:text-sm ${theme.text} ${theme.focus}`}
                  >
                    {t('journey.viewJourney')} →
                  </Link>
                )}
              </div>
            </section>
            <section className="rounded-[32px] border border-white bg-white/85 p-5 sm:p-10">
              <div className="flex items-center gap-4 sm:block">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-ink-600 sm:mb-6 sm:h-20 sm:w-20 sm:rounded-3xl">
                  <Sparkles className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <h2 className="text-2xl font-black">{t('journey.free')}</h2>
              </div>
              <p className="mt-3 text-sm text-ink-600 sm:min-h-14 sm:text-base">
                {t('journey.freeDescription')}
              </p>
              {freeUnit && (
                <Link
                  to={`/library/phonics/${lang}/${freeUnit.id}`}
                  className={`mt-4 inline-flex min-h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 text-sm font-black text-ink-700 sm:mt-6 sm:min-h-14 sm:gap-3 sm:px-7 sm:text-base ${theme.focus}`}
                >
                  {t('journey.chooseActivity')} <ArrowRight size={22} />
                </Link>
              )}
            </section>
          </div>
        }
      </div>
    </section>
  );
}

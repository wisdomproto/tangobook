import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, LockKeyhole, Route, Sparkles } from 'lucide-react';
import { courseThemes } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PhonicsBackdrop } from './PhonicsBackdrop';
import { ToyHangul } from './ToyHangul';
import { activityTitle, levelName, unitTitle } from '../lib/activity-title';
import { getRecentUnit, usePhonicsProgress } from '../lib/progress-store';
import {
  journeyActivityUrl,
  journeyHomeUrl,
  journeyProgress,
  journeyUnits,
  hasJourneyStarted,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { readGameObservations } from '../lib/journey-assessment';

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
  const observations = Object.entries(readGameObservations(lang)).filter(([id]) =>
    progress.steps.some((s) => `${s.unit.id}/${s.activity.key}` === id)
  );
  const curriculum = search.get('mode') === 'curriculum';
  const recent = getRecentUnit(lang);
  const freeUnit = units.find((u) => u.id === recent) ?? units[0];
  const title = t(`journey.${lang}`);
  const startUrl = progress.current
    ? journeyActivityUrl(lang, progress.current.unit.id, progress.current.activity.key)
    : undefined;
  const finishedUnit = units.find((u) => u.id === search.get('finished'));
  const finishedUnitDone =
    finishedUnit &&
    progress.steps
      .map((s, i) => ({ ...s, done: progress.done[i] }))
      .filter((s) => s.unit.id === finishedUnit.id)
      .every((s) => s.done);

  return (
    <section
      key={activeProfile?.id ?? 'guest'}
      style={theme.style}
      className="phonics-course-page relative min-h-[calc(100dvh-73px)] overflow-hidden bg-cream-50 pb-24"
    >
      <PhonicsBackdrop />
      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
        <Link
          to={curriculum ? `/library/phonics/${lang}` : '/library'}
          className={`inline-flex min-h-11 items-center gap-2 font-bold text-ink-700 ${theme.focus}`}
        >
          ← {curriculum ? t('journey.chooseMode') : t('common.home')}
        </Link>
        <header className="my-6">
          <p className={`mb-2 font-bold ${theme.text}`}>{title}</p>
          <h1 className="text-3xl font-black text-ink-900 sm:text-4xl">
            {t(curriculum ? 'journey.curriculumTitle' : 'journey.modeTitle')}
          </h1>
          <p className="mt-3 text-base text-ink-600 sm:text-lg">
            {t(curriculum ? 'journey.curriculumDescription' : 'journey.modeDescription')}
          </p>
        </header>
        {!curriculum ? (
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
        ) : (
          <>
            <section
              className="relative mb-8 rounded-[32px] bg-white/95 p-6 shadow-soft sm:p-8 sm:pr-40"
              aria-live="polite"
            >
              {progress.current && (
                <div
                  className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 sm:block"
                  aria-hidden="true"
                >
                  {lang === 'korean' ? (
                    <ToyHangul
                      text={
                        progress.current.activity.vowels?.[0]?.vowel ??
                        progress.current.activity.consonant ??
                        progress.current.activity.coda ??
                        progress.current.unit.phonemes[0]?.replace('받침', '') ??
                        'ㅏ'
                      }
                      decorative
                      className="text-[100px]"
                    />
                  ) : (
                    <span className={`text-6xl font-black ${theme.text}`}>
                      {progress.current.activity.letters?.[0] ??
                        progress.current.activity.cvcPattern?.vc ??
                        progress.current.activity.pattern ??
                        progress.current.unit.phonemes[0] ??
                        'Aa'}
                    </span>
                  )}
                </div>
              )}
              <p className={`mb-2 font-black ${theme.text}`}>
                {t(
                  progress.finished
                    ? 'journey.allDone'
                    : finishedUnitDone
                      ? 'journey.unitDone'
                      : 'journey.nextStep'
                )}
              </p>
              <h2 className="text-2xl font-black">
                {progress.current
                  ? unitTitle(t, progress.current.unit)
                  : t('journey.congratulations')}
              </h2>
              <p className="mt-2 text-ink-600">
                {progress.current
                  ? activityTitle(t, progress.current.activity)
                  : t('journey.repeatDescription')}
              </p>
              {startUrl && (
                <Link
                  to={startUrl}
                  className={`mt-5 inline-flex min-h-14 items-center gap-3 rounded-full px-7 font-black ${theme.action} ${theme.focus}`}
                >
                  {t(started ? 'journey.continue' : 'journey.start')} <ArrowRight size={22} />
                </Link>
              )}
              <p className="mt-4 text-sm text-ink-500">
                {t('journey.progress', { done: progress.completed, total: progress.steps.length })}
              </p>
            </section>
            <div className="space-y-8">
              {[...new Set(units.map((u) => u.levelKey))].map((level) => (
                <details
                  key={level}
                  open={level === (progress.current?.unit.levelKey ?? units[0]?.levelKey)}
                >
                  <summary className="mb-4 min-h-11 cursor-pointer py-2 text-xl font-black text-ink-800">
                    {levelName(t, units.find((u) => u.levelKey === level)!)}
                  </summary>
                  <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {units
                      .filter((u) => u.levelKey === level)
                      .map((unit) => {
                        const indices = progress.steps.flatMap((s, i) =>
                          s.unit.id === unit.id ? [i] : []
                        );
                        const complete =
                          indices.length > 0 && indices.every((i) => progress.done[i]);
                        const current = progress.current?.unit.id === unit.id;
                        const first =
                          progress.steps[indices.find((i) => !progress.done[i]) ?? indices[0]];
                        const unlocked = current || complete;
                        const body = (
                          <>
                            <span
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.badge}`}
                              aria-hidden="true"
                            >
                              {complete ? (
                                <Check size={28} />
                              ) : !unlocked ? (
                                <LockKeyhole size={22} />
                              ) : lang === 'korean' ? (
                                <ToyHangul
                                  text={unit.phonemes[0] ?? 'ㅏ'}
                                  decorative
                                  className="text-[40px]"
                                />
                              ) : (
                                <span className="text-2xl font-black">
                                  {unit.phonemes[0] ?? 'Aa'}
                                </span>
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-base font-black">
                                {unitTitle(t, unit)}
                              </span>
                              <span className="mt-1 block text-sm text-ink-600">
                                {t(
                                  complete
                                    ? 'journey.completed'
                                    : current
                                      ? 'journey.current'
                                      : 'journey.locked'
                                )}
                              </span>
                            </span>
                          </>
                        );
                        return (
                          <li key={unit.id}>
                            {unlocked && first ? (
                              <Link
                                aria-current={current ? 'step' : undefined}
                                to={journeyActivityUrl(lang, unit.id, first.activity.key)}
                                className={`flex min-h-24 items-center gap-4 rounded-3xl border-2 p-4 ${current ? theme.selected : 'border-white bg-white/90'} ${theme.focus}`}
                              >
                                {body}
                              </Link>
                            ) : (
                              <div
                                className="flex min-h-24 items-center gap-4 rounded-3xl border-2 border-transparent bg-white/50 p-4 text-ink-500"
                                aria-disabled="true"
                              >
                                {body}
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ol>
                </details>
              ))}
            </div>
            {freeUnit && (
              <Link
                to={`/library/phonics/${lang}/${freeUnit.id}`}
                className={`mt-8 inline-flex min-h-11 items-center gap-2 font-bold ${theme.text} ${theme.focus}`}
              >
                {t('journey.goFree')} <ArrowRight size={18} />
              </Link>
            )}
            {observations.length > 0 && (
              <details className="mt-6 rounded-3xl bg-white/90 p-5 text-ink-700">
                <summary className="min-h-11 cursor-pointer font-bold">
                  {t('journey.observations')}
                </summary>
                <p className="mb-4 text-sm text-ink-500">{t('journey.observationDescription')}</p>
                <ul className="space-y-3">
                  {observations.map(([id, run]) => {
                    const step = progress.steps.find(
                      (s) => `${s.unit.id}/${s.activity.key}` === id
                    );
                    if (!step) return null;
                    const choices = Object.values(run.firstChoices);
                    return (
                      <li key={id}>
                        <p className="font-bold">
                          {unitTitle(t, step.unit)} · {activityTitle(t, step.activity)}
                        </p>
                        <p className="text-sm">
                          {t('journey.observationScore', {
                            correct: choices.filter((c) => c.correct).length,
                            total: choices.length,
                            retries: run.retries,
                          })}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}

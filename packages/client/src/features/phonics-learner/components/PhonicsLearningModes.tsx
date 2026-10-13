import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import './phonics-learning-modes.css';
import { courseThemes } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PhonicsGameSprite } from './PhonicsGameSprite';
import { PhonicsBackdrop } from './PhonicsBackdrop';
import { PhonicsCurriculumPath } from './PhonicsCurriculumPath';
import { getKoreanUnit } from '../lib/korean-phonics-units';
import { getEnglishUnit } from '../lib/english-phonics-units';
import { getRecentUnit, usePhonicsProgress } from '../lib/progress-store';
import {
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
      className="phonics-course-page relative min-h-[calc(100dvh-133px-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-73px)] overflow-hidden bg-cream-50"
    >
      <PhonicsBackdrop />
      <div className="phonics-mode-content">
        <header className="phonics-mode-header">
          <Link
            to="/library"
            aria-label={t('common.home')}
            className={`phonics-mode-home ${theme.focus}`}
          >
            <PhonicsGameSprite name="scenery-cottage" />
          </Link>
          <h1 className={`phonics-mode-title ${theme.text}`}>
            <img
              src="/images/phonics/mode-buttons-v2/title-ribbon.webp"
              alt=""
              width={1000}
              height={345}
              decoding="async"
              draggable={false}
            />
            <span>{title}</span>
          </h1>
        </header>
        <div className="grid grid-cols-2 justify-items-center gap-4 sm:gap-6">
          <Link to={journeyHomeUrl(lang)} className={`phonics-mode-choice ${theme.focus}`}>
            <img
              src="/images/phonics/mode-buttons-v2/curriculum.webp"
              alt=""
              width={900}
              height={600}
              decoding="async"
              draggable={false}
            />
            <span>
              {t('journey.curriculumMode')}
              <ArrowRight aria-hidden="true" />
            </span>
          </Link>
          {freeUnit && (
            <Link
              to={`/library/phonics/${lang}/${freeUnit.id}`}
              className={`phonics-mode-choice ${theme.focus}`}
            >
              <img
                src="/images/phonics/mode-buttons-v2/free.webp"
                alt=""
                width={900}
                height={600}
                decoding="async"
                draggable={false}
              />
              <span>
                {t('journey.free')}
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

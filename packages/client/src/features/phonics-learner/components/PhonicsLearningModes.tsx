import { useLearningWorkspace } from './learning-workspace-context';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import './phonics-learning-modes.css';
import { courseThemes } from '@/design-system';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { useAuth } from '@/features/auth/context/AuthContext';
import { CurriculumEntryDialog } from './CurriculumEntryDialog';
import { PhonicsJourneyMap } from './PhonicsJourneyMap';
import { MobileLandscapeGate } from '@/features/games/components/MobileLandscapeGate';
import { usePhonicsProgress } from '../lib/progress-store';
import { PhonicsFreeMap } from './PhonicsFreeMap';
import {
  journeyHomeUrl,
  journeyProgress,
  journeyUnits,
  hasJourneyStarted,
  type JourneyLanguage,
} from '../lib/learning-journey';

export function PhonicsLearningModes({ lang }: { lang: JourneyLanguage }) {
  const { t } = useTranslation('phonics');
  const workspace = useLearningWorkspace();
  const [search] = useSearchParams();
  const { activeProfile } = useAuth();
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  // Reading is scoped to the active child; changing profiles must also rerender this page.
  const progress = journeyProgress(lang, unitCompletedActivities);
  const started = progress.completed > 0 || hasJourneyStarted(lang);
  const units = journeyUnits(lang);
  const theme = courseThemes[lang];
  const curriculum = search.get('mode') === 'curriculum';
  const title = t(`journey.${lang}`);
  const finishedUnit = units.find((u) => u.id === search.get('finished'));
  const finishedUnitDone =
    finishedUnit &&
    progress.steps.some((s) => s.unit.id === finishedUnit.id) &&
    progress.steps
      .map((s, i) => ({ ...s, done: progress.done[i] }))
      .filter((s) => s.unit.id === finishedUnit.id)
      .every((s) => s.done);

  if (search.get('mode') === 'free') return <PhonicsFreeMap lang={lang} />;
  if (curriculum) {
    return (
      <MobileLandscapeGate>
        {!workspace && (
          <PhonicsJourneyMap
            key={`map:${lang}:${activeProfile?.id ?? 'guest'}`}
            lang={lang}
            progress={progress}
            started={started}
            finishedUnitDone={!!finishedUnitDone}
          />
        )}
        {search.get('resume') === '1' && progress.current && (
          <CurriculumEntryDialog
            key={`entry:${lang}:${activeProfile?.id ?? 'guest'}`}
            lang={lang}
            step={progress.current}
            started={started}
          />
        )}
      </MobileLandscapeGate>
    );
  }
  return (
    <section
      key={activeProfile?.id ?? 'guest'}
      style={theme.style}
      className={`phonics-course-page phonics-mode-page phonics-mode-page--${lang} relative min-h-[calc(100dvh-133px-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-73px)] overflow-hidden bg-cream-50`}
    >
      <div className="phonics-mode-content">
        <header className="phonics-mode-header">
          <h1 className={`phonics-mode-title ${theme.text}`}>
            <StorybookSprite name="book" size={48} />
            <span>{title}</span>
          </h1>
        </header>
        <div className="phonics-mode-options">
          <Link
            to={`${journeyHomeUrl(lang)}&resume=1`}
            className={`phonics-mode-choice ${theme.focus}`}
          >
            <img
              src="/images/phonics/mode-entry-v1/curriculum.webp"
              alt=""
              width={800}
              height={450}
              decoding="async"
              draggable={false}
            />
            <span>
              {t('journey.curriculumMode')}
              <ArrowRight aria-hidden="true" />
            </span>
          </Link>
          {
            <Link
              to={`/library/phonics/${lang}?mode=free`}
              className={`phonics-mode-choice ${theme.focus}`}
            >
              <img
                src="/images/phonics/mode-entry-v1/free.webp"
                alt=""
                width={800}
                height={450}
                decoding="async"
                draggable={false}
              />
              <span>
                {t('journey.free')}
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          }
        </div>
      </div>
    </section>
  );
}

import { Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchPath, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MobileLandscapeGate } from '@/features/games/components/MobileLandscapeGate';
import { usePhonicsProgress } from '../lib/progress-store';
import {
  journeyProgress,
  journeyUnits,
  hasJourneyStarted,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { PhonicsJourneyMap } from './PhonicsJourneyMap';
import { LearningWorkspaceContext, type WorkspaceWordActivity } from './learning-workspace-context';
import {
  wordLearningStage,
  wordLearningStages,
  readWordStageProgress,
} from '../lib/word-learning-run';
import './phonics-workspace.css';
import { ActivityShell } from './ActivityShell';

/** A shared route parent keeps the map alive while the Outlet changes between activities. */
export function PhonicsWorkspaceLayout() {
  const { pathname, search } = useLocation();
  const { activeProfile } = useAuth();
  const match = matchPath('/library/phonics/:language/:unitId?/:activityKey?', pathname);
  const lang = match?.params.language;
  if (lang !== 'korean' && lang !== 'english') return <Outlet />;
  const query = new URLSearchParams(search);
  const enabled =
    !!match?.params.unitId || ['curriculum', 'free'].includes(query.get('mode') ?? '');
  if (!enabled) return <Outlet />;
  return (
    <WorkspaceRun
      key={`${lang}:${activeProfile?.id ?? 'guest'}:${query.get('mode') === 'curriculum' ? 'curriculum' : 'free'}`}
      lang={lang}
      unitId={match?.params.unitId}
      activityKey={match?.params.activityKey}
    />
  );
}

export default PhonicsWorkspaceLayout;

function WorkspaceRun({
  lang,
  unitId,
  activityKey,
}: {
  lang: JourneyLanguage;
  unitId?: string;
  activityKey?: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('phonics');
  const { search, key: locationKey } = useLocation();
  const query = new URLSearchParams(search);
  const curriculum = query.get('mode') === 'curriculum';
  const active = !!activityKey;
  const [navigation, setNavigation] = useState({ key: locationKey, open: !active });
  const navigationOpen = navigation.key === locationKey ? navigation.open : !active;
  const setNavigationOpen = (open: boolean) => setNavigation({ key: locationKey, open });
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  const [wordActivity, setWordActivity] = useState<WorkspaceWordActivity | null>(null);
  const requestedStage = wordLearningStage(query.get('part'));
  const wordProgress = unitId && requestedStage ? readWordStageProgress(lang, unitId) : undefined;
  const stageCompleted =
    !!requestedStage &&
    !!wordProgress?.total &&
    wordProgress.counts[requestedStage] === wordProgress.total;
  const practiceStage =
    activityKey === 'word-learning' &&
    unitId &&
    requestedStage &&
    wordLearningStages(unitId).includes(requestedStage) &&
    (!curriculum || unitCompletedActivities(unitId).includes('word-learning') || stageCompleted)
      ? requestedStage
      : undefined;
  const progress = journeyProgress(lang, unitCompletedActivities);
  const finished = query.get('finished');
  const finishedSteps = progress.steps.filter((step) => step.unit.id === finished);
  const finishedUnitDone =
    finishedSteps.length > 0 &&
    finishedSteps.every((step) =>
      unitCompletedActivities(step.unit.id).includes(step.activity.key)
    );
  const backToMap = useCallback(() => {
    navigate(
      curriculum
        ? `/library/phonics/${lang}?mode=curriculum&chapter=${encodeURIComponent(unitId ?? progress.current?.unit.id ?? '')}`
        : `/library/phonics/${lang}/${unitId ?? ''}`
    );
  }, [navigate, curriculum, lang, unitId, progress.current?.unit.id]);
  return (
    <LearningWorkspaceContext.Provider
      value={{
        mode: curriculum ? 'curriculum' : 'free',
        active,
        unitId,
        activityKey,
        practiceStage,
        wordActivity,
        setWordActivity,
        navigationOpen,
        setNavigationOpen,
        backToMap,
      }}
    >
      <MobileLandscapeGate>
        {(curriculum || active) && (
          <PhonicsJourneyMap
            lang={lang}
            progress={progress}
            started={progress.completed > 0 || hasJourneyStarted(lang)}
            finishedUnitDone={finishedUnitDone}
            mode={curriculum ? 'curriculum' : 'free'}
            initialUnitId={unitId ?? progress.current?.unit.id ?? journeyUnits(lang)[0]?.id}
            readDone={unitCompletedActivities}
            activityContent={
              active ? (
                <Suspense
                  fallback={
                    <ActivityShell unitId={unitId} onBack={backToMap}>
                      <p className="m-auto text-lg font-bold" role="status">
                        {t('common.loading')}
                      </p>
                    </ActivityShell>
                  }
                >
                  <Outlet />
                </Suspense>
              ) : undefined
            }
          />
        )}
        {!active && <Outlet />}
      </MobileLandscapeGate>
    </LearningWorkspaceContext.Provider>
  );
}

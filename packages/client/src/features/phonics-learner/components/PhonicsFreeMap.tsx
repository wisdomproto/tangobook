import { useLearningWorkspace } from './learning-workspace-context';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEffect } from 'react';
import { MobileLandscapeGate } from '@/features/games/components/MobileLandscapeGate';
import { usePhonicsProgress, markRecentUnit } from '../lib/progress-store';
import { journeyProgress, type JourneyLanguage } from '../lib/learning-journey';
import { PhonicsJourneyMap } from './PhonicsJourneyMap';

/** Free exploration shares the story board, completion store and activity plans. */
export function PhonicsFreeMap({ lang, unitId }: { lang: JourneyLanguage; unitId?: string }) {
  const workspace = useLearningWorkspace();
  const { activeProfile } = useAuth();
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  useEffect(() => {
    if (unitId) markRecentUnit(lang, unitId);
  }, [lang, unitId]);
  if (workspace) return null;
  return (
    <MobileLandscapeGate>
      <PhonicsJourneyMap
        key={`${lang}:${activeProfile?.id ?? 'guest'}:${unitId ?? 'free'}`}
        lang={lang}
        progress={journeyProgress(lang, unitCompletedActivities)}
        started={false}
        finishedUnitDone={false}
        mode="free"
        initialUnitId={unitId}
        readDone={unitCompletedActivities}
      />
    </MobileLandscapeGate>
  );
}

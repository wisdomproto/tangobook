import { useEffect } from 'react';
import { MobileLandscapeGate } from '@/features/games/components/MobileLandscapeGate';
import { markRecentUnit } from '../lib/progress-store';
import type { JourneyLanguage } from '../lib/learning-journey';
import { PhonicsFreePlay } from './PhonicsFreePlay';

/** Preserve legacy chapter URLs while the free entry is now an activity shelf. */
export function PhonicsFreeMap({ lang, unitId }: { lang: JourneyLanguage; unitId?: string }) {
  useEffect(() => {
    if (unitId) markRecentUnit(lang, unitId);
  }, [lang, unitId]);
  return (
    <MobileLandscapeGate>
      <PhonicsFreePlay key={lang} lang={lang} unitId={unitId} />
    </MobileLandscapeGate>
  );
}

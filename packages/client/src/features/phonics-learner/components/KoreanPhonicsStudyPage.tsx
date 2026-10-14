import { Navigate, useParams } from 'react-router-dom';
import { koreanLearningUnitId } from '@tangobook/shared';
import { usePhonicsSeo } from '../hooks/usePhonicsSeo';
import { getKoreanUnit } from '../lib/korean-phonics-units';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { PhonicsFreeMap } from './PhonicsFreeMap';

/** Language entry chooses a mode; existing chapter URLs open the shared free board. */
export default function KoreanPhonicsStudyPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  usePhonicsSeo('korean');
  if (!unitId) return <PhonicsLearningModes lang="korean" />;
  const canonical = koreanLearningUnitId(unitId);
  if (canonical !== unitId) return <Navigate to={`/library/phonics/korean/${canonical}`} replace />;
  if (!getKoreanUnit(unitId)) return <Navigate to="/library/phonics/korean?mode=free" replace />;
  return <PhonicsFreeMap lang="korean" unitId={unitId} />;
}

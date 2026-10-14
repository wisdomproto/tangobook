import { Navigate, useParams } from 'react-router-dom';
import { getEnglishUnit } from '../lib/english-phonics-units';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { PhonicsFreeMap } from './PhonicsFreeMap';

export default function EnglishPhonicsStudyPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  if (!unitId) return <PhonicsLearningModes lang="english" />;
  if (!getEnglishUnit(unitId)) return <Navigate to="/library/phonics/english?mode=free" replace />;
  return <PhonicsFreeMap lang="english" unitId={unitId} />;
}

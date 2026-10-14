import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { koreanLearningUnitId } from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { getKoreanUnit } from '../lib/korean-phonics-units';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { PhonicsFreeMap } from './PhonicsFreeMap';

/** Language entry chooses a mode; existing chapter URLs open the shared free board. */
export default function KoreanPhonicsStudyPage() {
  const { t } = useTranslation('phonics');
  const { unitId } = useParams<{ unitId?: string }>();
  useSeo({
    title: t('seo.koreanTitle'),
    description: t('seo.koreanDescription'),
    path: '/library/phonics/korean',
    keywords: t('seo.koreanKeywords'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: t('seo.koreanJsonLdName'),
      description: t('seo.koreanJsonLdDescription'),
      url: 'https://www.tangobook.co.kr/library/phonics/korean',
      educationalLevel: t('seo.educationalLevel'),
      educationalUse: t('seo.educationalUse'),
      inLanguage: ['ko'],
      provider: { '@type': 'Organization', name: '탱고북', url: 'https://www.tangobook.co.kr/' },
    },
  });
  if (!unitId) return <PhonicsLearningModes lang="korean" />;
  const canonical = koreanLearningUnitId(unitId);
  if (canonical !== unitId) return <Navigate to={`/library/phonics/korean/${canonical}`} replace />;
  if (!getKoreanUnit(unitId)) return <Navigate to="/library/phonics/korean?mode=free" replace />;
  return <PhonicsFreeMap lang="korean" unitId={unitId} />;
}

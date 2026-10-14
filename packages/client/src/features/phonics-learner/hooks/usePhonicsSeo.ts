import { useTranslation } from 'react-i18next';
import { useSeo } from '@/lib/useSeo';
import type { JourneyLanguage } from '../lib/learning-journey';

/** Route hosts own metadata; embedded exercises must never replace their parent page's title. */
export function usePhonicsSeo(lang: JourneyLanguage) {
  const { t } = useTranslation('phonics');
  useSeo(
    lang === 'korean'
      ? {
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
            provider: {
              '@type': 'Organization',
              name: '탱고북',
              url: 'https://www.tangobook.co.kr/',
            },
          },
        }
      : {
          title: t('seo.englishTitle'),
          description: t('shell:home.englishDescription'),
          path: '/library/phonics/english',
          keywords: t('journey.english'),
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: t('journey.english'),
            description: t('shell:home.englishDescription'),
            url: 'https://www.tangobook.co.kr/library/phonics/english',
            educationalLevel: t('seo.educationalLevel'),
            educationalUse: t('journey.english'),
            inLanguage: ['en'],
            provider: {
              '@type': 'Organization',
              name: '탱고북',
              url: 'https://www.tangobook.co.kr/',
            },
          },
        }
  );
}

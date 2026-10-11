import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';

export default function PhonicsLandingPage() {
  const { t } = useTranslation('phonics');
  const { account } = useAuth();
  const tracks = [
    { key: 'korean', symbol: '가' },
    { key: 'english', symbol: 'Aa' },
    ...(isDevEmail(account?.email) ? [{ key: 'chinese', symbol: '拼' }] : []),
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-page-title font-display">{t('landing.title')}</h1>
      <p className="mt-2 mb-6 text-learning-body text-ink-600">{t('landing.subtitle')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tracks.map(({ key, symbol }) => (
          <Link
            key={key}
            to={`/library/phonics/${key}`}
            className="flex min-h-48 items-center justify-between gap-4 rounded-course border border-ink-100 bg-white p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700"
          >
            <div className="min-w-0">
              <h2 className="text-section-title font-display">{t(`landing.${key}Title`)}</h2>
              <p className="mt-2 text-base leading-relaxed text-ink-600 break-keep">
                {t(`landing.${key}Desc`)}
              </p>
              <span className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-full bg-coral-700 px-5 font-bold text-white">
                {t('landing.start')} →
              </span>
            </div>
            <span
              aria-hidden="true"
              className="grid size-20 shrink-0 place-items-center rounded-full bg-cream-100 font-display text-4xl font-bold text-coral-700"
            >
              {symbol}
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm leading-relaxed text-ink-600">
        {t('landing.curriculumLink')}:{' '}
        <Link
          className="inline-flex min-h-11 items-center text-coral-700 underline"
          to="/library/phonics/korean/about"
        >
          {t('landing.koreanTitle')}
        </Link>{' '}
        ·{' '}
        <Link
          className="inline-flex min-h-11 items-center text-coral-700 underline"
          to="/library/phonics/english/about"
        >
          {t('landing.englishTitle')}
        </Link>
      </p>
    </div>
  );
}

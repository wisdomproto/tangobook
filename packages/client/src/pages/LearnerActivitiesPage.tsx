import { StorybookTitle } from '@/design-system/primitives/StorybookTitle';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LearnerActivitiesPage() {
  const { t } = useTranslation('shell');
  const activities = [
    { key: 'games', path: '/games/vocab', image: '/icons/game/line-matching.webp' },
    { key: 'paper', path: '/activity', image: '/icons/game/word-writing-ko.webp' },
    { key: 'blocks', path: '/blocks', image: '/icons/game/korean-block.webp' },
  ];
  return (
    <div className="storybook-activities-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <StorybookTitle className="text-3xl font-bold">{t('nav.activities')}</StorybookTitle>
      <p className="mt-3 text-center text-lg text-ink-600">{t('activities.subtitle')}</p>
      <div className="storybook-activity-options mt-7 grid gap-4 md:grid-cols-3">
        {activities.map(({ key, path, image }) => (
          <Link
            key={key}
            to={path}
            className="storybook-game-choice flex min-h-64 flex-col items-start justify-between gap-5 rounded-3xl border border-ink-100 bg-white p-6 focus-visible:outline-coral-700"
          >
            <img src={image} alt="" className="h-16 w-16 object-contain" />
            <div>
              <h2 className="text-2xl font-bold">{t(`activities.${key}`)}</h2>
              <p className="mt-3 leading-relaxed text-ink-600">
                {t(`activities.${key}Description`)}
              </p>
            </div>
            <span aria-hidden="true" className="text-2xl text-coral-700">
              <StorybookSprite name="next" size={26} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useAdaptiveFreePlay } from '../hooks/useAdaptiveFreePlay';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { courseThemes } from '@/design-system';
import {
  StorybookSprite,
  type StorybookSpriteName,
} from '@/design-system/primitives/StorybookSprite';
import { FREE_GAME_TYPES, freePlayCatalog, type FreeGameType } from '../lib/free-play-catalog';
import type { JourneyLanguage } from '../lib/learning-journey';
import './phonics-free-play.css';
import './workspace-buttons.css';

function GameArt({ game, lang }: { game: FreeGameType; lang: JourneyLanguage }) {
  const file = game.art === 'blocks' ? `blocks-${lang === 'korean' ? 'ko' : 'en'}.webp` : game.art;
  if (file.endsWith('.webp'))
    return (
      <img
        src={`/images/learning/vocabulary-menu-v1/${file}`}
        alt=""
        width={640}
        height={480}
        draggable={false}
      />
    );
  return <StorybookSprite name={file as StorybookSpriteName} size={96} />;
}

/** Four direct play entrances: choose the game, not a book or lesson. */
export function PhonicsFreePlay({ lang }: { lang: JourneyLanguage; unitId?: string }) {
  const { t } = useTranslation('phonics');
  const { start, busy } = useAdaptiveFreePlay(lang);
  const catalog = useMemo(() => freePlayCatalog(lang), [lang]);
  const games = FREE_GAME_TYPES.filter(
    (game) =>
      ['wordMatch', 'block', 'wordWrite', 'color'].includes(game.id) &&
      catalog.some((entry) => entry.game === (game.id === 'block' ? 'listenBlock' : game.id))
  );
  return (
    <section
      className={`phonics-free-play phonics-free-play--${lang}`}
      style={courseThemes[lang].style}
    >
      <div className="free-play-content">
        <header className="free-play-header">
          <Link
            className="workspace-icon-button"
            to={`/library/phonics/${lang}`}
            aria-label={t('journey.chooseMode')}
          >
            <StorybookSprite name="back" size={28} />
          </Link>
          <h1>
            <StorybookSprite name="book" size={38} />
            <span>
              {t(`journey.${lang}`)}
              <small>{t('journey.free')}</small>
            </span>
          </h1>
          <Link
            className="workspace-icon-button"
            to={`/library/phonics/${lang}?mode=curriculum`}
            aria-label={t('journey.curriculumMode')}
            title={t('journey.curriculumMode')}
          >
            <StorybookSprite name="compass" size={28} />
          </Link>
        </header>
        {busy && (
          <p role="status" className="free-play-loading">
            {t('common.loading')}
          </p>
        )}
        <div className="free-play-game-grid">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="free-play-game"
              disabled={busy}
              onClick={() => start(game.id)}
            >
              <span className="free-play-game-art">
                <GameArt game={game} lang={lang} />
              </span>
              <span className="free-play-game-label">
                {t(`freeShelf.games.${game.id}`)}
                <ArrowRight size={20} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

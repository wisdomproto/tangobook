import { useTranslation } from 'react-i18next';
import type { GameTypeId } from '@tangobook/shared';
import { StorybookGameIcon } from '@/design-system/primitives/StorybookGameIcon';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import type { VocabGameOption } from '../lib/game-data-adapter';

/** 대등한 게임 선택지. 순서 번호·부제·예시 단어 없이 그림과 이름으로 고른다. */
export function VocabularyGameMenu({
  games,
  onPlay,
}: {
  games: VocabGameOption[];
  onPlay: (game: GameTypeId) => void;
}) {
  const { t } = useTranslation('games');
  return (
    <section className="storybook-scope vocabulary-game-menu" aria-label={t('study.gamesHeading')}>
      {games.map((game, index) => (
        <button
          key={game.id}
          type="button"
          className="vocabulary-game-button"
          disabled={!game.available}
          aria-label={game.label}
          title={!game.available ? game.unavailableReason : undefined}
          onClick={() => onPlay(game.id)}
        >
          <StorybookSprite
            name={index % 2 === 0 ? 'cta-mint' : 'cta-coral'}
            className="vocabulary-game-plate"
          />
          <span className="vocabulary-game-picture" aria-hidden="true">
            {game.iconSrc ? (
              <img src={game.iconSrc} alt="" draggable={false} />
            ) : (
              <StorybookGameIcon game={game.id} size={76} />
            )}
          </span>
          <span className="vocabulary-game-label font-display">{game.label}</span>
        </button>
      ))}
    </section>
  );
}

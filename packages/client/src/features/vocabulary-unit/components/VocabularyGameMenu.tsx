import { useTranslation } from 'react-i18next';
import type { GameTypeId } from '@tangobook/shared';
import { StorybookGameIcon } from '@/design-system/primitives/StorybookGameIcon';
import type { VocabGameOption } from '../lib/game-data-adapter';

export type VocabularyMenuGameId = GameTypeId | 'scene-coloring';
export type VocabularyMenuGameOption = Omit<VocabGameOption, 'id'> & { id: VocabularyMenuGameId };

const ART = '/images/learning/vocabulary-menu-v1/';
function gameIllustration(game: VocabularyMenuGameId): string | undefined {
  if (game.includes('line-matching')) return ART + 'matching.webp';
  if (game === 'korean-block') return ART + 'blocks-ko.webp';
  if (game === 'english-block' || game === 'order-block') return ART + 'blocks-en.webp';
  if (game === 'coloring') return ART + 'coloring.webp';
  if (game === 'scene-coloring') return ART + 'scene-coloring.webp';
  if (game === 'hidden-object') return ART + 'hidden.webp';
  if (game === 'connect-the-dots') return ART + 'drawing.webp';
  if (game.includes('writing')) return ART + 'writing.webp';
}

/** 대등한 게임 선택지. 순서 번호·부제·예시 단어 없이 그림과 이름으로 고른다. */
export function VocabularyGameMenu({
  games,
  onPlay,
}: {
  games: VocabularyMenuGameOption[];
  onPlay: (game: VocabularyMenuGameId) => void;
}) {
  const { t } = useTranslation('games');
  return (
    <section className="storybook-scope vocabulary-game-menu" aria-label={t('study.gamesHeading')}>
      {games.map((game) => (
        <button
          key={game.id}
          type="button"
          className="vocabulary-game-button"
          disabled={!game.available}
          aria-label={game.label}
          title={!game.available ? game.unavailableReason : undefined}
          onClick={() => onPlay(game.id)}
        >
          <span className="vocabulary-game-picture" aria-hidden="true">
            {(gameIllustration(game.id) ?? game.iconSrc) ? (
              <img
                src={gameIllustration(game.id) ?? game.iconSrc}
                width={640}
                height={480}
                alt=""
                draggable={false}
              />
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

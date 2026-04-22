import { registerGame } from '../game-registry';
import { LineMatchingConfigPanel } from '../../components/config/LineMatchingConfigPanel';
import { LineMatchingPlayer } from '../../components/players/LineMatchingPlayer';
import type { GamePlayerProps } from '../game-registry';
import type { EnglishLineMatchingData } from '@tangobook/shared';

function EnglishLineMatchingPlayerWrapper(p: GamePlayerProps) {
  return (
    <LineMatchingPlayer
      storybookId={p.storybookId}
      gameData={p.gameData as EnglishLineMatchingData}
      difficulty={p.difficulty}
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
      lang="en"
    />
  );
}

registerGame({
  id: 'english-line-matching',
  category: 'common',
  nameKo: '그림-단어 선긋기 (영어)',
  descriptionKo: '그림과 어울리는 영어 단어를 짝지어요',
  icon: '🔗',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'english-line-matching', itemCount: 4 },
  ConfigPanel: LineMatchingConfigPanel,
  PlayerComponent: EnglishLineMatchingPlayerWrapper,
  language: 'en',
});

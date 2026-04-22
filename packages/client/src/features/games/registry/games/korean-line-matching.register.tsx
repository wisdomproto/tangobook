import { registerGame } from '../game-registry';
import { LineMatchingConfigPanel } from '../../components/config/LineMatchingConfigPanel';
import { LineMatchingPlayer } from '../../components/players/LineMatchingPlayer';
import type { GamePlayerProps } from '../game-registry';
import type { KoreanLineMatchingData } from '@tangobook/shared';

function KoreanLineMatchingPlayerWrapper(p: GamePlayerProps) {
  return (
    <LineMatchingPlayer
      storybookId={p.storybookId}
      gameData={p.gameData as KoreanLineMatchingData}
      difficulty={p.difficulty}
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
      lang="ko"
    />
  );
}

registerGame({
  id: 'korean-line-matching',
  category: 'common',
  nameKo: '그림-단어 선긋기',
  descriptionKo: '그림과 어울리는 한글 단어를 짝지어요',
  icon: '🔗',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-line-matching', itemCount: 4 },
  ConfigPanel: LineMatchingConfigPanel,
  PlayerComponent: KoreanLineMatchingPlayerWrapper,
  language: 'ko',
});

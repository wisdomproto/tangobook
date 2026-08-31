import { registerGame } from '../game-registry';
import { StoryImageConfigPanel } from '../../components/config/StoryImageConfigPanel';
import { StoryImagePlayer } from '../../components/players/StoryImagePlayer';
import type { GamePlayerProps } from '../game-registry';
import type { KoreanStoryImageData } from '@tangobook/shared';

function KoreanStoryImagePlayerWrapper(p: GamePlayerProps) {
  return (
    <StoryImagePlayer
      storybookId={p.storybookId}
      gameData={p.gameData as KoreanStoryImageData}
      difficulty={p.difficulty}
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
      lang="ko"
    />
  );
}

registerGame({
  id: 'korean-story-image',
  category: 'storybook',
  nameKo: '이야기 듣고 그림 찾기',
  descriptionKo: '이야기를 듣고 어울리는 장면을 골라요',
  icon: '📖',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-story-image', roundCount: 5, optionsPerRound: 4 },
  ConfigPanel: StoryImageConfigPanel,
  PlayerComponent: KoreanStoryImagePlayerWrapper,
  language: 'ko',
});

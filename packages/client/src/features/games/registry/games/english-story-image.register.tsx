import { registerGame } from '../game-registry';
import { StoryImageConfigPanel } from '../../components/config/StoryImageConfigPanel';
import { StoryImagePlayer } from '../../components/players/StoryImagePlayer';
import type { GamePlayerProps } from '../game-registry';
import type { EnglishStoryImageData } from '@tangobook/shared';

function EnglishStoryImagePlayerWrapper(p: GamePlayerProps) {
  return (
    <StoryImagePlayer
      storybookId={p.storybookId}
      gameData={p.gameData as EnglishStoryImageData}
      difficulty={p.difficulty}
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
      lang="en"
    />
  );
}

registerGame({
  id: 'english-story-image',
  category: 'storybook',
  nameKo: '이야기 듣고 그림 찾기 (영어)',
  descriptionKo: 'Listen to the story and pick the matching scene',
  icon: '📖',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'english-story-image', roundCount: 5, optionsPerRound: 4 },
  ConfigPanel: StoryImageConfigPanel,
  PlayerComponent: EnglishStoryImagePlayerWrapper,
  language: 'en',
});

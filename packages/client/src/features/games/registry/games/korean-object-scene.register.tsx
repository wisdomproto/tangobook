import { registerGame } from '../game-registry';
import { StoryImageConfigPanel } from '../../components/config/StoryImageConfigPanel';
import { StoryImagePlayer } from '../../components/players/StoryImagePlayer';
import type { GamePlayerProps } from '../game-registry';

function KoreanObjectScenePlayerWrapper(p: GamePlayerProps) {
  return <StoryImagePlayer {...p} lang="ko" variant="object" />;
}

registerGame({
  id: 'korean-object-scene',
  category: 'storybook',
  nameKo: '이 물건 어느 장면?',
  descriptionKo: '낱말 카드를 보고 그 물건이 나온 쪽을 골라요',
  icon: '🔍',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-object-scene', roundCount: 5, optionsPerRound: 3 },
  ConfigPanel: StoryImageConfigPanel,
  PlayerComponent: KoreanObjectScenePlayerWrapper,
  language: 'ko',
});

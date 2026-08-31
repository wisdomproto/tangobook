import { registerGame } from '../game-registry';
import { StoryImageConfigPanel } from '../../components/config/StoryImageConfigPanel';
import { PageOrderPlayer } from '../../components/players/PageOrderPlayer';

registerGame({
  id: 'korean-page-order',
  category: 'storybook',
  nameKo: '쪽 순서 맞추기',
  descriptionKo: '삽화를 이야기 순서대로 놓아요',
  icon: '🔢',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-page-order', itemCount: 4 },
  ConfigPanel: StoryImageConfigPanel,
  PlayerComponent: PageOrderPlayer,
  language: 'ko',
});

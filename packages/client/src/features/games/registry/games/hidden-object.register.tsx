import { registerGame } from '../game-registry';
import { HiddenObjectConfigPanel } from '../../components/config/HiddenObjectConfigPanel';
import { HiddenObjectPlayer } from '../../components/players/HiddenObjectPlayer';

registerGame({
  id: 'hidden-object',
  category: 'storybook',
  nameKo: '숨은그림 찾기',
  descriptionKo: '그림 속에 숨은 단어들을 모두 찾아요',
  icon: '🔍',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
    needsHiddenObjectScenes: true,
  },
  defaultConfig: { type: 'hidden-object', sceneCount: 1 },
  ConfigPanel: HiddenObjectConfigPanel,
  PlayerComponent: HiddenObjectPlayer,
});

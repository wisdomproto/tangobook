import { registerGame } from '../game-registry';
import { PictureSequenceConfigPanel } from '../../components/config/PictureSequenceConfigPanel';
import { PictureSequencePlayer } from '../../components/players/PictureSequencePlayer';

registerGame({
  id: 'picture-sequence',
  category: 'storybook',
  nameKo: '그림 순서 맞추기',
  descriptionKo: '그림을 올바른 순서로 배열하세요',
  icon: '🔢',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'picture-sequence',
    imageCount: 4,
  },
  ConfigPanel: PictureSequenceConfigPanel,
  PlayerComponent: PictureSequencePlayer,
});

import { registerGame } from '../game-registry';
import { ConnectTheDotsConfigPanel } from '../../components/config/ConnectTheDotsConfigPanel';
import { ConnectTheDotsPlayer } from '../../components/players/ConnectTheDotsPlayer';

registerGame({
  id: 'connect-the-dots',
  nameKo: '점잇기',
  descriptionKo: '점을 이어 그림을 완성하세요',
  icon: '🖊️',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: true,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'connect-the-dots',
    sourcePages: [],
    pointCount: 15,
    showNumbers: true,
    showFaintOutline: true,
  },
  ConfigPanel: ConnectTheDotsConfigPanel,
  PlayerComponent: ConnectTheDotsPlayer,
});

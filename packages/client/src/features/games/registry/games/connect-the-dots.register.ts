import { registerGame } from '../game-registry';
import { ConnectTheDotsConfigPanel } from '../../components/config/ConnectTheDotsConfigPanel';
import { ConnectTheDotsPlayer } from '../../components/players/ConnectTheDotsPlayer';

registerGame({
  id: 'connect-the-dots',
  category: 'common',
  nameKo: '단어 그림 그리기',
  descriptionKo: '점을 이어 그림을 완성하고 단어를 들어요',
  icon: '🖊️',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'connect-the-dots',
    sourcePages: [],
    sourceObjects: [],
    sourceMode: 'objects' as const,
    pointCount: 15,
    showNumbers: true,
    showFaintOutline: true,
  },
  ConfigPanel: ConnectTheDotsConfigPanel,
  PlayerComponent: ConnectTheDotsPlayer,
});

import { registerGame } from '../game-registry';
import { BlendingListeningConfigPanel } from '../../components/config/BlendingListeningConfigPanel';
import { BlendingListeningPlayer } from '../../components/players/BlendingListeningPlayer';

registerGame({
  id: 'blending-listening',
  nameKo: '듣기 맞추기',
  descriptionKo: '단어를 듣고 알맞은 그림을 골라요',
  icon: '🔊',
  supportedTypes: ['phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: true,
  },
  defaultConfig: {
    type: 'blending-listening',
  },
  ConfigPanel: BlendingListeningConfigPanel,
  PlayerComponent: BlendingListeningPlayer,
});

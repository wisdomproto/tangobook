import { registerGame } from '../game-registry';
import { WordImageMatchingConfigPanel } from '../../components/config/WordImageMatchingConfigPanel';
import { WordImageMatchingPlayer } from '../../components/players/WordImageMatchingPlayer';

registerGame({
  id: 'word-image-matching',
  nameKo: '선긋기 게임',
  descriptionKo: '단어와 그림을 선으로 연결하세요',
  icon: '🖇️',
  supportedTypes: ['phonics'],
  supportedLevels: [1, 2, 3, 4, 5],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: true,
  },
  defaultConfig: {
    type: 'word-image-matching',
  },
  ConfigPanel: WordImageMatchingConfigPanel,
  PlayerComponent: WordImageMatchingPlayer,
});

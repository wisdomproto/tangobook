import { registerGame } from '../game-registry';
import { WordListeningConfigPanel } from '../../components/config/WordListeningConfigPanel';
import { WordListeningPlayer } from '../../components/players/WordListeningPlayer';

registerGame({
  id: 'word-listening',
  nameKo: '듣고 단어 맞추기',
  descriptionKo: '소리를 듣고 알맞은 그림을 골라요',
  icon: '👂',
  supportedTypes: ['phonics'],
  supportedLevels: [1, 2, 3, 4, 5],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: true,
  },
  defaultConfig: { type: 'word-listening' },
  ConfigPanel: WordListeningConfigPanel,
  PlayerComponent: WordListeningPlayer,
});

import { registerGame } from '../game-registry';
import { VocabularyMatchingConfigPanel } from '../../components/config/VocabularyMatchingConfigPanel';
import { VocabularyMatchingPlayer } from '../../components/players/VocabularyMatchingPlayer';

registerGame({
  id: 'vocabulary-matching',
  nameKo: '단어 매칭',
  descriptionKo: '단어와 그림을 짝지어 보세요',
  icon: '🔗',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'vocabulary-matching',
    itemCount: 6,
    includeKeyObjects: true,
    includeCharacters: false,
  },
  ConfigPanel: VocabularyMatchingConfigPanel,
  PlayerComponent: VocabularyMatchingPlayer,
});

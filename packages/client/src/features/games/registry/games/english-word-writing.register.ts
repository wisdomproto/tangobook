import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { WordWritingPlayer } from '../../components/players/WordWritingPlayer';

registerGame({
  id: 'english-word-writing',
  category: 'common',
  nameKo: '영어 단어 따라쓰기',
  descriptionKo: '영어 단어를 따라 써보세요',
  icon: '🖊️',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'english-word-writing',
    language: 'english',
    wordSource: 'vocabulary',
    showGuide: true,
    accuracyThreshold: 0.7,
  },
  ConfigPanel: WordWritingConfigPanel,
  PlayerComponent: WordWritingPlayer,
  language: 'en',
});

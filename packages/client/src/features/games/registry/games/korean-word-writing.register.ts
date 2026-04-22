import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { WordWritingPlayer } from '../../components/players/WordWritingPlayer';

registerGame({
  id: 'korean-word-writing',
  category: 'common',
  nameKo: '한글 단어 따라쓰기',
  descriptionKo: '한글 단어를 따라 써보세요',
  icon: '✍️',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'korean-word-writing',
    language: 'korean',
    wordSource: 'vocabulary',
    showGuide: true,
    accuracyThreshold: 0.7,
  },
  ConfigPanel: WordWritingConfigPanel,
  PlayerComponent: WordWritingPlayer,
  language: 'ko',
});

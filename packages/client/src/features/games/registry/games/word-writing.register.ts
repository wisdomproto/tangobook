import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { WordWritingPlayer } from '../../components/players/WordWritingPlayer';

registerGame({
  id: 'word-writing',
  category: 'common',
  nameKo: '낱말 쓰기',
  descriptionKo: '단어를 직접 따라 써보세요',
  icon: '✍️',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'word-writing',
    language: 'korean',
    wordSource: 'vocabulary',
    showGuide: true,
    accuracyThreshold: 0.7,
  },
  ConfigPanel: WordWritingConfigPanel,
  PlayerComponent: WordWritingPlayer,
});

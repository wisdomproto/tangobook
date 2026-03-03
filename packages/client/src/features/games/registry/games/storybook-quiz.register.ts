import { registerGame } from '../game-registry';
import { StorybookQuizConfigPanel } from '../../components/config/StorybookQuizConfigPanel';
import { StorybookQuizPlayer } from '../../components/players/StorybookQuizPlayer';

registerGame({
  id: 'storybook-quiz',
  category: 'storybook',
  nameKo: '동화책 퀴즈',
  descriptionKo: '동화책 내용을 얼마나 이해했는지 퀴즈를 풀어보세요',
  icon: '📖',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'storybook-quiz',
    questionCount: 5,
  },
  ConfigPanel: StorybookQuizConfigPanel,
  PlayerComponent: StorybookQuizPlayer,
});

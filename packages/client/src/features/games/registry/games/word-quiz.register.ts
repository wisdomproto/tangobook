import { registerGame } from '../game-registry';
import { WordQuizConfigPanel } from '../../components/config/WordQuizConfigPanel';
import { WordQuizPlayer } from '../../components/players/WordQuizPlayer';

registerGame({
  id: 'word-quiz',
  nameKo: '단어 퀴즈',
  descriptionKo: '단어의 뜻과 철자를 맞춰보세요',
  icon: '❓',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'word-quiz',
    questionCount: 5,
    questionTypes: ['meaning', 'picture'],
  },
  ConfigPanel: WordQuizConfigPanel,
  PlayerComponent: WordQuizPlayer,
});

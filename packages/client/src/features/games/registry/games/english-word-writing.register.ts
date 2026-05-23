import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { EnglishWordWritingPlayer } from '../../components/players/EnglishWordWritingPlayer';

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
  // 영어는 글로벌 letter-stroke-library 기반 stroke 채점 — 한글은 기존 canvas pixel 채점 유지
  PlayerComponent: EnglishWordWritingPlayer,
  language: 'en',
});

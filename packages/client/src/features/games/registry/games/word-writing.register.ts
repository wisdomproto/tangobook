import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { WordWritingPlayer } from '../../components/players/WordWritingPlayer';

registerGame({
  id: 'word-writing',
  hidden: true, // 레거시 호환용 — korean-word-writing / english-word-writing으로 대체
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
    language: 'english',
    wordSource: 'vocabulary',
    showGuide: true,
    accuracyThreshold: 0.7,
  },
  ConfigPanel: WordWritingConfigPanel,
  PlayerComponent: WordWritingPlayer,
  language: 'en', // 레거시 word-writing 인스턴스는 영어 단어만 사용 → 영어 탭에서만 표시
});

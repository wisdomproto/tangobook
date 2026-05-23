import { registerGame } from '../game-registry';
import { WordWritingConfigPanel } from '../../components/config/WordWritingConfigPanel';
import { KoreanWordWritingPlayer } from '../../components/players/KoreanWordWritingPlayer';

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
  // paint 모드 (LetterFillCanvas) — 글자 영역 채움 비율로 통과 판정. 한글 폰트 fidelity 100%.
  PlayerComponent: KoreanWordWritingPlayer,
  language: 'ko',
});

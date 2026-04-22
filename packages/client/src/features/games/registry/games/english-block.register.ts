import { registerGame } from '../game-registry';
import { EnglishBlockConfigPanel } from '../../components/config/EnglishBlockConfigPanel';
import { EnglishBlockPlayer } from '../../components/players/EnglishBlockPlayer';

registerGame({
  id: 'english-block',
  category: 'common',
  nameKo: '영어 블록 맞추기',
  descriptionKo: '알파벳 블록을 배치하여 영단어를 완성하세요',
  icon: '🔤',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'english-block',
    itemCount: 5,
    includeKeyObjects: true,
    includeCharacters: false,
  },
  ConfigPanel: EnglishBlockConfigPanel,
  PlayerComponent: EnglishBlockPlayer,
  language: 'en',
});

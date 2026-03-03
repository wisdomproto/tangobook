import { registerGame } from '../game-registry';
import { KoreanBlockConfigPanel } from '../../components/config/KoreanBlockConfigPanel';
import { KoreanBlockPlayer } from '../../components/players/KoreanBlockPlayer';

registerGame({
  id: 'korean-block',
  category: 'common',
  nameKo: '한글 블록 맞추기',
  descriptionKo: '자모 블록을 조합하여 단어를 완성하세요',
  icon: '🧩',
  supportedTypes: ['storybook', 'phonics'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'korean-block',
    itemCount: 5,
    includeKeyObjects: true,
    includeCharacters: false,
  },
  ConfigPanel: KoreanBlockConfigPanel,
  PlayerComponent: KoreanBlockPlayer,
});

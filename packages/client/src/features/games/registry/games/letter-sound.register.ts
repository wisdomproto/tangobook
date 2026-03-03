import { registerGame } from '../game-registry';
import { LetterSoundConfigPanel } from '../../components/config/LetterSoundConfigPanel';
import { LetterSoundPlayer } from '../../components/players/LetterSoundPlayer';

registerGame({
  id: 'letter-sound',
  category: 'korean-phonics',
  nameKo: '음가 듣기',
  descriptionKo: '소리를 듣고 알파벳을 찾아요',
  icon: '🔤',
  supportedTypes: ['phonics'],
  supportedLevels: [1],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: true,
  },
  defaultConfig: { type: 'letter-sound' },
  ConfigPanel: LetterSoundConfigPanel,
  PlayerComponent: LetterSoundPlayer,
});

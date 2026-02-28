import { registerGame } from '../game-registry';
import { InitialSoundConfigPanel } from '../../components/config/InitialSoundConfigPanel';
import { InitialSoundPlayer } from '../../components/players/InitialSoundPlayer';

registerGame({
  id: 'initial-sound',
  nameKo: '첫소리 찾기',
  descriptionKo: '그림을 보고 첫소리를 맞춰요',
  icon: '🖼️',
  supportedTypes: ['phonics'],
  supportedLevels: [1],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: true,
  },
  defaultConfig: { type: 'initial-sound' },
  ConfigPanel: InitialSoundConfigPanel,
  PlayerComponent: InitialSoundPlayer,
});

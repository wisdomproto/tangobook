import { registerGame } from '../game-registry';
import { OddOneOutConfigPanel } from '../../components/config/OddOneOutConfigPanel';
import { OddOneOutPlayer } from '../../components/players/OddOneOutPlayer';

registerGame({
  id: 'odd-one-out',
  nameKo: '다른 것 찾기',
  descriptionKo: '나머지와 다른 하나를 찾아보세요',
  icon: '🔍',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: {
    type: 'odd-one-out',
    roundCount: 5,
    optionsPerRound: 4,
  },
  ConfigPanel: OddOneOutConfigPanel,
  PlayerComponent: OddOneOutPlayer,
});

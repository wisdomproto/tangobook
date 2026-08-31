import { registerGame } from '../game-registry';
import { LineMatchingConfigPanel } from '../../components/config/LineMatchingConfigPanel';
import { LineMatchingPlayer } from '../../components/players/LineMatchingPlayer';
import type { GamePlayerProps } from '../game-registry';

function KoreanCharacterMatchingPlayerWrapper(p: GamePlayerProps) {
  return <LineMatchingPlayer {...p} lang="ko" variant="character" />;
}

registerGame({
  id: 'korean-character-matching',
  category: 'storybook',
  nameKo: '인물 짝 찾기',
  descriptionKo: '등장인물 그림과 이름을 짝지어요',
  icon: '🎭',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: false,
    // 낱말이 아니라 characters[].referenceImage 를 쓴다 — 레지스트리 플래그엔 대응 항목이 없다.
    needsCharacterImages: true,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-character-matching', itemCount: 4 },
  ConfigPanel: LineMatchingConfigPanel,
  PlayerComponent: KoreanCharacterMatchingPlayerWrapper,
  language: 'ko',
});

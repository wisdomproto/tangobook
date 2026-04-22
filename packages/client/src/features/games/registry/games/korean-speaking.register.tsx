import { registerGame } from '../game-registry';
import { SpeakingConfigPanel } from '../../components/config/SpeakingConfigPanel';
import { SpeakingPlayer } from '../../components/players/SpeakingPlayer';
import type { GameConfigPanelProps, GamePlayerProps } from '../game-registry';
import type { KoreanSpeakingData } from '@tangobook/shared';

function KoreanSpeakingConfigPanelWrapper(p: GameConfigPanelProps) {
  return <SpeakingConfigPanel storybook={p.storybook} lang="ko" />;
}

function KoreanSpeakingPlayerWrapper(p: GamePlayerProps) {
  return (
    <SpeakingPlayer
      storybookId={p.storybookId}
      gameData={p.gameData as KoreanSpeakingData}
      difficulty={p.difficulty}
      lang="ko"
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
    />
  );
}

registerGame({
  id: 'korean-speaking',
  category: 'common',
  nameKo: '한국어 말하기',
  descriptionKo: '단어를 듣고 따라 말해요',
  icon: '🎤',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-speaking' },
  ConfigPanel: KoreanSpeakingConfigPanelWrapper,
  PlayerComponent: KoreanSpeakingPlayerWrapper,
  language: 'ko',
  hidden: true, // 완성도 개선 후 공개 예정 (Phase 2 Azure 도입 등)
});

import { registerGame } from '../game-registry';
import { SpeakingConfigPanel } from '../../components/config/SpeakingConfigPanel';
import { SpeakingPlayer } from '../../components/players/SpeakingPlayer';
import type { GameConfigPanelProps, GamePlayerProps } from '../game-registry';
import type { EnglishSpeakingData } from '@tangobook/shared';

function EnglishSpeakingConfigPanelWrapper(p: GameConfigPanelProps) {
  return <SpeakingConfigPanel storybook={p.storybook} lang="en" />;
}

function EnglishSpeakingPlayerWrapper(p: GamePlayerProps) {
  return (
    <SpeakingPlayer
      storybookId={p.storybookId}
      gameData={p.gameData as EnglishSpeakingData}
      difficulty={p.difficulty}
      lang="en"
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
    />
  );
}

registerGame({
  id: 'english-speaking',
  category: 'common',
  nameKo: '영어 말하기',
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
  defaultConfig: { type: 'english-speaking' },
  ConfigPanel: EnglishSpeakingConfigPanelWrapper,
  PlayerComponent: EnglishSpeakingPlayerWrapper,
  language: 'en',
  hidden: true, // 완성도 개선 후 공개 예정
});

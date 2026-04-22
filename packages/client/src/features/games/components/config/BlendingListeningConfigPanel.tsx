import type { GameConfigPanelProps } from '../../registry/game-registry';

export function BlendingListeningConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const pairCount = blending.filter(
    (b) =>
      b.exampleWordImageUrl &&
      b.exampleWordTtsUrl &&
      b.exampleWord2 &&
      b.exampleWord2ImageUrl &&
      b.exampleWord2TtsUrl
  ).length;

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>블렌딩별 단어를 듣고 맞는 그림을 고르는 게임입니다.</p>
      <p className="mt-1">
        이미지+TTS 완비 블렌딩:{' '}
        <span className="font-bold text-coral-500 dark:text-coral-400">{pairCount}개</span> (각
        2라운드)
      </p>
    </div>
  );
}

import type { GameConfigPanelProps } from '../../registry/game-registry';

export function WordImageMatchingConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];

  let count = 0;
  for (let i = 0; i < blending.length; i++) {
    const b = blending[i];
    const wf = wordFamilies[i];
    const hasImage =
      !!b.exampleWordImageUrl ||
      !!b.exampleWord2ImageUrl ||
      !!b.illustrationUrl ||
      (wf && wf.words.some((w) => !!w.imageUrl));
    if (hasImage) count++;
  }

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>단어와 그림을 선으로 연결하는 게임입니다.</p>
      <p className="mt-1">
        이미지가 있는 블렌딩:{' '}
        <span className="font-bold text-violet-600 dark:text-violet-400">{count}개</span>
      </p>
    </div>
  );
}

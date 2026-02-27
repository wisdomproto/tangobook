import type { GameConfigPanelProps } from '../../registry/game-registry';

export function WordImageMatchingConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const groupCount = blending.filter((b) => b.exampleWordImageUrl && b.exampleWord2ImageUrl).length;

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>블렌딩 단어 이미지를 이용한 선긋기 게임입니다.</p>
      <p className="mt-1">
        이미지가 있는 블렌딩 그룹:{' '}
        <span className="font-bold text-violet-600 dark:text-violet-400">{groupCount}개</span>
      </p>
    </div>
  );
}

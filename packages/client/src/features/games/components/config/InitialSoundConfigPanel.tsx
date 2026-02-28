import type { GameConfigPanelProps } from '../../registry/game-registry';

export function InitialSoundConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];

  let count = 0;
  const seenLetters = new Set<string>();

  for (let i = 0; i < blending.length; i++) {
    const b = blending[i];
    if (b.vowel.length !== 1 || !/^[A-Za-z]$/.test(b.vowel)) continue;

    let hasImage = !!b.exampleWordImageUrl;
    if (!hasImage) {
      const wf = wordFamilies[i];
      if (wf) hasImage = wf.words.some((w) => !!w.imageUrl);
    }
    // Level 1 fallback: illustrationUrl (전체 삽화)
    if (!hasImage) hasImage = !!b.illustrationUrl;
    if (hasImage) {
      seenLetters.add(b.vowel.toUpperCase());
      count++;
    }
  }

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>그림을 보고 첫소리 알파벳을 고르는 Level 1 전용 게임입니다.</p>
      <p className="mt-1">
        이미지 완비 알파벳:{' '}
        <span className="font-bold text-violet-600 dark:text-violet-400">{seenLetters.size}개</span>{' '}
        (단어 {count}개)
      </p>
    </div>
  );
}

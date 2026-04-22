import type { GameConfigPanelProps } from '../../registry/game-registry';

export function WordListeningConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];
  const flashcards = storybook.flashcards ?? [];
  const seen = new Set<string>();

  // 이미지 + TTS 모두 있는 단어 수
  for (let i = 0; i < blending.length; i++) {
    const ex = blending[i];
    if (
      (ex.illustrationUrl || ex.exampleWordImageUrl) &&
      (ex.exampleWordTtsUrl || ex.blendTtsUrl)
    ) {
      const w = ex.exampleWord || ex.blend;
      if (w) seen.add(w);
    }
    if (ex.exampleWordImageUrl && ex.exampleWordTtsUrl) seen.add(ex.exampleWord);
    if (ex.exampleWord2 && ex.exampleWord2ImageUrl && ex.exampleWord2TtsUrl)
      seen.add(ex.exampleWord2);
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && w.ttsUrl) seen.add(w.word);
      }
    }
  }
  for (const fc of flashcards) {
    if (fc.imageUrl && fc.ttsUrl) seen.add(fc.word);
  }

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>단어 소리를 듣고 맞는 그림을 고르는 게임입니다.</p>
      <p className="mt-1">
        이미지+TTS 완비 단어:{' '}
        <span className="font-bold text-coral-500 dark:text-coral-400">{seen.size}개</span>
      </p>
    </div>
  );
}

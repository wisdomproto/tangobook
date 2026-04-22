import type { GameConfigPanelProps } from '../../registry/game-registry';

export function LetterSoundConfigPanel({ storybook }: GameConfigPanelProps) {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];
  const count = blending.filter((b, i) => {
    if (b.vowel.length !== 1 || !/^[A-Za-z]$/.test(b.vowel)) return false;
    if (
      b.vowelTtsUrl ||
      b.consonantTtsUrl ||
      b.blendTtsUrl ||
      b.blendingSequenceTtsUrl ||
      b.exampleWordTtsUrl
    )
      return true;
    const wf = wordFamilies[i];
    return wf?.words.some((w) => !!w.ttsUrl) ?? false;
  }).length;

  return (
    <div className="text-sm text-slate-500 dark:text-slate-400">
      <p>알파벳 음가를 듣고 맞는 글자를 고르는 Level 1 전용 게임입니다.</p>
      <p className="mt-1">
        음가 TTS 완비 알파벳:{' '}
        <span className="font-bold text-coral-500 dark:text-coral-400">{count}개</span>
      </p>
    </div>
  );
}

import { LetterWritingCanvas } from './LetterWritingCanvas';

interface WritingPracticeSectionProps {
  vowel: string;
  consonant: string;
  idx: number;
  active: { idx: number; letter: string } | null;
  onToggle: (state: { idx: number; letter: string } | null) => void;
  correctSoundUrl?: string;
  incorrectSoundUrl?: string;
}

export function WritingPracticeSection({
  vowel,
  consonant,
  idx,
  active,
  onToggle,
  correctSoundUrl,
  incorrectSoundUrl,
}: WritingPracticeSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">글자 쓰기 연습</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() =>
            onToggle(
              active?.idx === idx && active?.letter === vowel ? null : { idx, letter: vowel }
            )
          }
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
            active?.idx === idx && active?.letter === vowel
              ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
          }`}
        >
          {vowel} 쓰기
        </button>
        <button
          onClick={() =>
            onToggle(
              active?.idx === idx && active?.letter === consonant
                ? null
                : { idx, letter: consonant }
            )
          }
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
            active?.idx === idx && active?.letter === consonant
              ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-600 dark:text-sky-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'
          }`}
        >
          {consonant} 쓰기
        </button>
      </div>
      {active?.idx === idx && (
        <div className="mt-3">
          <LetterWritingCanvas
            letter={active.letter}
            correctSoundUrl={correctSoundUrl}
            incorrectSoundUrl={incorrectSoundUrl}
          />
        </div>
      )}
    </div>
  );
}

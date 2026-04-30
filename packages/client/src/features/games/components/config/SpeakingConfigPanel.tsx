import type { Storybook } from '@tangobook/shared';
import { getEffectiveVocabulary } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface SpeakingConfigPanelProps {
  storybook: Storybook;
  lang: 'ko' | 'en';
}

const DIFFICULTY_HINT = {
  easy: '단어·그림·철자 다 보여주고 자동 재생해요',
  medium: '단어·그림만 보여주고 TTS 버튼으로 들어요',
  hard: '그림만 보고 발음해요. 한 바퀴 더 반복!',
} as const;

export function SpeakingConfigPanel({ storybook, lang }: SpeakingConfigPanelProps) {
  const wordCount = getEffectiveVocabulary(storybook).length;
  const label = lang === 'ko' ? '한국어' : '영어';

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-ink-700">
        이 책의 {label} 단어 <strong className="text-coral-500">{wordCount}개</strong>를 사용합니다.
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <div
            key={d}
            className={cn(
              'p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
              'text-xs text-ink-700 dark:text-peach-200'
            )}
          >
            <div className="font-bold mb-1">
              {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
            </div>
            <div>{DIFFICULTY_HINT[d]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

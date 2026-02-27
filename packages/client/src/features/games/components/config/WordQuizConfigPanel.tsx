import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { WordQuizConfig } from '@tangobook/shared';

export function WordQuizConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as WordQuizConfig;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          문제 수
        </label>
        <div className="flex gap-2">
          {[5, 8, 10].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...c, questionCount: n })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.questionCount === n
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {n}문제
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          문제 유형
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'meaning' as const, label: '뜻 맞추기' },
            { value: 'spelling' as const, label: '철자 맞추기' },
            { value: 'picture' as const, label: '그림 맞추기' },
          ].map((opt) => {
            const selected = c.questionTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() =>
                  onChange({
                    ...c,
                    questionTypes: selected
                      ? c.questionTypes.filter((t) => t !== opt.value)
                      : [...c.questionTypes, opt.value],
                  })
                }
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  selected
                    ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

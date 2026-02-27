import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { OddOneOutConfig } from '@tangobook/shared';

export function OddOneOutConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as OddOneOutConfig;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          라운드 수
        </label>
        <div className="flex gap-2">
          {[3, 5, 8].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...c, roundCount: n })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.roundCount === n
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {n}라운드
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          보기 수
        </label>
        <div className="flex gap-2">
          {[3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...c, optionsPerRound: n })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.optionsPerRound === n
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {n}개
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { PictureSequenceConfig } from '@tangobook/shared';

export function PictureSequenceConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as PictureSequenceConfig;
  const maxPages = (storybook.pages ?? []).filter((p) => p.illustrationUrl).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          이미지 수
        </label>
        <div className="flex gap-2">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={n > maxPages}
              onClick={() => onChange({ ...c, imageCount: n })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.imageCount === n
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : n > maxPages
                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {n}장
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          삽화가 있는 페이지: {maxPages}개
        </p>
      </div>
    </div>
  );
}

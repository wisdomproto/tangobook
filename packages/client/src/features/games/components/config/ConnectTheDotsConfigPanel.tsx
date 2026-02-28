import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { ConnectTheDotsConfig } from '@tangobook/shared';
import { NumberSelector, ConfigCheckbox } from './ConfigControls';

export function ConnectTheDotsConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as ConnectTheDotsConfig;
  const pagesWithIllustration = (storybook.pages ?? []).filter((p) => p.illustrationUrl);

  return (
    <div className="space-y-4">
      <NumberSelector
        label="점 개수"
        value={c.pointCount}
        options={[10, 15, 20, 30]}
        onChange={(n) => onChange({ ...c, pointCount: n })}
        suffix="개"
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          사용할 페이지 (삽화 {pagesWithIllustration.length}개)
        </label>
        <div className="flex gap-2 flex-wrap">
          {pagesWithIllustration.map((p) => {
            const selected = c.sourcePages.includes(p.pageNumber);
            return (
              <button
                key={p.pageNumber}
                onClick={() =>
                  onChange({
                    ...c,
                    sourcePages: selected
                      ? c.sourcePages.filter((n) => n !== p.pageNumber)
                      : [...c.sourcePages, p.pageNumber],
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selected
                    ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                p.{p.pageNumber}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <ConfigCheckbox
          label="번호 표시"
          checked={c.showNumbers}
          onChange={(v) => onChange({ ...c, showNumbers: v })}
        />
        <ConfigCheckbox
          label="희미한 윤곽선 표시"
          checked={c.showFaintOutline}
          onChange={(v) => onChange({ ...c, showFaintOutline: v })}
        />
      </div>
    </div>
  );
}

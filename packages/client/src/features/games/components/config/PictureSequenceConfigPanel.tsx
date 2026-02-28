import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { PictureSequenceConfig } from '@tangobook/shared';
import { NumberSelector } from './ConfigControls';

export function PictureSequenceConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as PictureSequenceConfig;
  const maxPages = (storybook.pages ?? []).filter((p) => p.illustrationUrl).length;

  return (
    <div className="space-y-4">
      <div>
        <NumberSelector
          label="이미지 수"
          value={c.imageCount}
          options={[3, 4, 5].filter((n) => n <= maxPages)}
          onChange={(n) => onChange({ ...c, imageCount: n })}
          suffix="장"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          삽화가 있는 페이지: {maxPages}개
        </p>
      </div>
    </div>
  );
}

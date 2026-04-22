import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { KoreanStoryImageConfig, EnglishStoryImageConfig } from '@tangobook/shared';
import { NumberSelector } from './ConfigControls';

export function StoryImageConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as KoreanStoryImageConfig | EnglishStoryImageConfig;

  return (
    <div className="space-y-4">
      <NumberSelector
        label="라운드 수"
        value={c.roundCount}
        options={[3, 5, 8]}
        onChange={(n) => onChange({ ...c, roundCount: n })}
        suffix="라운드"
      />

      <NumberSelector
        label="보기 수"
        value={c.optionsPerRound}
        options={[2, 3, 4]}
        onChange={(n) => onChange({ ...c, optionsPerRound: n })}
        suffix="개"
      />

      <p className="text-xs text-ink-500 dark:text-peach-200/70">
        각 페이지의 나레이션을 듣고 알맞은 장면을 골라요.
      </p>
    </div>
  );
}

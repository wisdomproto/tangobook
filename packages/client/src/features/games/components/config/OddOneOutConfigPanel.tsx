import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { OddOneOutConfig } from '@tangobook/shared';
import { NumberSelector } from './ConfigControls';

export function OddOneOutConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as OddOneOutConfig;

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
        options={[3, 4]}
        onChange={(n) => onChange({ ...c, optionsPerRound: n })}
        suffix="개"
      />
    </div>
  );
}

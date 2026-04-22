import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { KoreanLineMatchingConfig, EnglishLineMatchingConfig } from '@tangobook/shared';
import { NumberSelector } from './ConfigControls';

export function LineMatchingConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as KoreanLineMatchingConfig | EnglishLineMatchingConfig;

  return (
    <div className="space-y-4">
      <NumberSelector
        label="짝지을 개수"
        value={c.itemCount}
        options={[3, 4, 5, 6]}
        onChange={(n) => onChange({ ...c, itemCount: n })}
        suffix="쌍"
      />
      <p className="text-xs text-ink-500 dark:text-peach-200/70">
        핵심 사물 이미지에서 뽑아요. 이미지 있는 단어가 부족하면 최소 3개부터 시작합니다.
      </p>
    </div>
  );
}

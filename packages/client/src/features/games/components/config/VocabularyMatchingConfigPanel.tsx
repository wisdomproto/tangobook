import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { VocabularyMatchingConfig } from '@tangobook/shared';
import { NumberSelector, ConfigCheckbox } from './ConfigControls';

export function VocabularyMatchingConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as VocabularyMatchingConfig;

  return (
    <div className="space-y-4">
      <NumberSelector
        label="매칭 쌍 수"
        value={c.itemCount}
        options={[4, 6, 8]}
        onChange={(n) => onChange({ ...c, itemCount: n })}
        suffix="쌍"
      />

      <div className="space-y-2">
        <ConfigCheckbox
          label="핵심사물 이미지 포함"
          checked={c.includeKeyObjects}
          onChange={(v) => onChange({ ...c, includeKeyObjects: v })}
        />
        <ConfigCheckbox
          label="캐릭터 이미지 포함"
          checked={c.includeCharacters}
          onChange={(v) => onChange({ ...c, includeCharacters: v })}
        />
      </div>
    </div>
  );
}

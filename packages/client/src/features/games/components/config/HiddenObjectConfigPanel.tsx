import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { HiddenObjectConfig } from '@tangobook/shared';

export function HiddenObjectConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as HiddenObjectConfig;
  const sceneCount = storybook.hiddenObjectScenes?.length ?? 0;

  return (
    <div className="space-y-4">
      {sceneCount === 0 ? (
        <p className="text-sm text-danger font-medium">
          숨은그림 씬이 없습니다. /editor2 의 "숨은그림" 탭에서 씬을 먼저 만들어주세요.
        </p>
      ) : (
        <p className="text-sm text-ink-700">
          저장된 씬 {sceneCount}개 중 무작위로 골라 게임을 만듭니다.
        </p>
      )}
      <label className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-900">한 게임에 포함할 씬 수</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, sceneCount)}
          value={c.sceneCount}
          onChange={(e) =>
            onChange({ ...c, sceneCount: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
          className="w-20 rounded-md border-2 border-peach-200 px-2 py-1"
        />
      </label>
    </div>
  );
}

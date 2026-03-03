import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { ConnectTheDotsConfig } from '@tangobook/shared';
import { ConfigCheckbox } from './ConfigControls';

export function ConnectTheDotsConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as ConnectTheDotsConfig;

  const keyObjectImages = storybook.keyObjectImages ?? [];
  const keyObjects = storybook.key_objects ?? [];
  const objectsWithDots = keyObjectImages.filter(
    (img) => img.success && img.imageUrl && img.keypoints && img.keypoints.length >= 2
  );

  return (
    <div className="space-y-4">
      {/* 핵심단어 선택 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          사용할 핵심단어 (점 등록됨 {objectsWithDots.length}개)
        </label>
        {objectsWithDots.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            핵심사물 탭에서 이미지를 생성하고 점을 등록해주세요.
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {objectsWithDots.map((img) => {
              const obj = keyObjects.find((o) => o.name === img.objectName);
              const selected = (c.sourceObjects ?? []).includes(img.objectName);
              return (
                <button
                  key={img.objectName}
                  onClick={() =>
                    onChange({
                      ...c,
                      sourceMode: 'objects',
                      sourceObjects: selected
                        ? (c.sourceObjects ?? []).filter((n) => n !== img.objectName)
                        : [...(c.sourceObjects ?? []), img.objectName],
                    })
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selected
                      ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.objectName}
                    className="w-8 h-8 rounded object-cover"
                  />
                  {obj?.korean || img.objectName} ({img.keypoints!.length}점)
                </button>
              );
            })}
          </div>
        )}
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

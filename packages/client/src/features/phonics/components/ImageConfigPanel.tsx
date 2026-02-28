import { ASPECT_RATIOS } from '@tangobook/shared';
import { ImageModelSelector } from '@/components/ImageModelSelector';

interface ImageConfigPanelProps {
  modelValue?: string;
  onModelChange: (modelId: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
}

export function ImageConfigPanel({
  modelValue,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
}: ImageConfigPanelProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <ImageModelSelector value={modelValue} onChange={onModelChange} label="이미지 모델" />
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          이미지 비율
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onAspectRatioChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                aspectRatio === r
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

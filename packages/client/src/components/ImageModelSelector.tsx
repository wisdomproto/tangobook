import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@tangobook/shared';

interface ImageModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
  /** 'inline' for compact mode (Character/KeyObject), 'block' for full-width (Cover) */
  layout?: 'inline' | 'block';
  label?: string;
}

export function ImageModelSelector({
  value,
  onChange,
  layout = 'inline',
  label = '이미지 모델',
}: ImageModelSelectorProps) {
  const isBlock = layout === 'block';

  return (
    <div className={isBlock ? '' : 'flex items-center gap-2'}>
      {isBlock ? (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      )}
      <select
        value={value ?? DEFAULT_IMAGE_MODEL}
        onChange={(e) => onChange(e.target.value)}
        className={`text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 ${
          isBlock ? 'w-full px-3 py-2' : 'px-2 py-1'
        }`}
      >
        {IMAGE_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {isBlock ? `${m.label} - ${m.description}` : m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

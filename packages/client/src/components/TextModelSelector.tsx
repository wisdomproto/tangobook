import { TEXT_MODELS, DEFAULT_TEXT_MODEL } from '@tangobook/shared';

interface TextModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
  layout?: 'inline' | 'block';
  label?: string;
}

export function TextModelSelector({
  value,
  onChange,
  layout = 'inline',
  label = '텍스트 모델',
}: TextModelSelectorProps) {
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
        value={value ?? DEFAULT_TEXT_MODEL}
        onChange={(e) => onChange(e.target.value)}
        className={`text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 ${
          isBlock ? 'w-full px-3 py-2' : 'px-2 py-1'
        }`}
      >
        {TEXT_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {isBlock ? `${m.label} - ${m.description}` : m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

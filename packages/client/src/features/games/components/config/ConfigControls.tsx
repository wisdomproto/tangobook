interface NumberSelectorProps {
  label: string;
  value: number;
  options: number[];
  onChange: (n: number) => void;
  suffix?: string;
}

export function NumberSelector({
  label,
  value,
  options,
  onChange,
  suffix = '',
}: NumberSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              value === n
                ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {n}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ConfigCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ConfigCheckbox({ label, checked, onChange }: ConfigCheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      {label}
    </label>
  );
}

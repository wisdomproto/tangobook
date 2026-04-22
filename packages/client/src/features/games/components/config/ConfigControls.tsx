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
      <label className="block text-sm font-bold text-ink-900 mb-1">{label}</label>
      <div className="flex gap-2">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
              value === n
                ? 'bg-coral-500 border-coral-500 text-white shadow-pop'
                : 'bg-peach-100 border-ink-100 text-ink-700 hover:bg-peach-200 hover:border-coral-200'
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
    <label className="flex items-center gap-2 text-sm font-bold text-ink-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-ink-300 text-coral-500 focus:ring-coral-500"
      />
      {label}
    </label>
  );
}

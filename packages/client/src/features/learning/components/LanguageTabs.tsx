import type { Lang } from '@tangobook/shared';

interface Props {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}

export function LanguageTabs({ value, onChange, className = '' }: Props) {
  return (
    <div className={`inline-flex rounded-full bg-peach-100 p-1 ${className}`}>
      {(['ko', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
            value === l ? 'bg-coral-500 text-white shadow' : 'text-ink-700 hover:bg-peach-200'
          }`}
        >
          {l === 'ko' ? '한글' : '영어'}
        </button>
      ))}
    </div>
  );
}

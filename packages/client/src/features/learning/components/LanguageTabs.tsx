import { getCourseTheme } from '@/design-system';
import type { Lang } from '@tangobook/shared';

interface Props {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}

export function LanguageTabs({ value, onChange, className = '' }: Props) {
  return (
    <div className={`inline-flex rounded-full border border-ink-100 bg-white p-1 ${className}`}>
      {(['ko', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={value === l}
          className={`min-h-11 px-4 py-1.5 rounded-full text-sm font-semibold transition ${getCourseTheme(l)!.focus} ${
            value === l
              ? `${getCourseTheme(l)!.badge} ring-2 ${getCourseTheme(l)!.ring}`
              : 'text-ink-700 hover:bg-cream-100'
          }`}
        >
          {l === 'ko' ? '한글' : '영어'}
        </button>
      ))}
    </div>
  );
}

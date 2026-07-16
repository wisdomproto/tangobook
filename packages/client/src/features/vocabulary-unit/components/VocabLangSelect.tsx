import { useTranslation } from 'react-i18next';
import type { Lang } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface VocabLangSelectProps {
  langs: { code: Lang; label: string }[];
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}

/**
 * 어휘 학습 언어 선택 드롭박스 (공용) — 어휘 게임 / 책상세 진입 학습화면 공유.
 * 언어 칩 5개(한국어·English·Tiếng Việt·中文·ไทย)를 가로로 늘어놓으면 모바일에서 넘치거나
 * 줄바꿈으로 지저분해서 네이티브 `<select>` 로 압축. (BookDetailPage 모바일 언어 드롭박스와 동일 톤.)
 */
export function VocabLangSelect({ langs, value, onChange, className }: VocabLangSelectProps) {
  const { t } = useTranslation('games');
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
        aria-hidden
      >
        🌐
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Lang)}
        aria-label={t('study.langSelectAria', { defaultValue: '언어 선택' })}
        className="h-11 appearance-none rounded-full bg-white pl-10 pr-9 shadow-soft text-sm sm:text-base font-black text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300"
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

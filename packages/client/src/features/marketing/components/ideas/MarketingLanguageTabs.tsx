import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { cn } from '../../lib/utils';

interface MarketingLanguageTabsProps {
  targetLanguages: string[];
  selectedLang: string;
  onLangChange: (lang: string) => void;
}

/**
 * Thin pill row — reads from project.target_languages (ko always pinned first).
 * Read-only; editing target languages stays in project settings (Q-4).
 */
export function MarketingLanguageTabs({
  targetLanguages,
  selectedLang,
  onLangChange,
}: MarketingLanguageTabsProps) {
  // ko always first
  const langs = ['ko', ...targetLanguages.filter((l) => l !== 'ko')];

  return (
    <div className="flex flex-wrap gap-1.5">
      {langs.map((lang) => {
        const meta = SUPPORTED_LANGUAGES.find((s) => s.code === lang);
        const label = meta?.nativeName ?? lang.toUpperCase();
        const flag = meta?.flag ?? '';
        const isActive = selectedLang === lang;

        return (
          <button
            key={lang}
            onClick={() => onLangChange(lang)}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {flag && <span>{flag}</span>}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

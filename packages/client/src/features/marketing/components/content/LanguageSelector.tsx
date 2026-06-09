import { Globe, Check, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { Button } from '../../ui/button';
import { useUIStore } from '../../store/ui-store';
import { cn } from '../../lib/utils';

interface LanguageSelectorProps {
  /** All target languages for this project (from project.target_languages). */
  targetLanguages: string[];
  /** Called when the user clicks "번역" for a non-ko language. */
  onTranslate: (lang: string) => void;
  /** Per-language translate status: 'translating' | 'completed' | 'none'/undefined. */
  translationStatuses?: Record<string, string>;
}

function getLangLabel(code: string): { label: string; flag: string } {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return found
    ? { label: found.nativeName, flag: found.flag }
    : { label: code.toUpperCase(), flag: '🌐' };
}

export function LanguageSelector({
  targetLanguages,
  onTranslate,
  translationStatuses = {},
}: LanguageSelectorProps) {
  const selectedLanguage = useUIStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useUIStore((s) => s.setSelectedLanguage);

  // ko is always present; de-duplicate; pin ko first
  const langs = ['ko', ...targetLanguages.filter((l) => l !== 'ko')];
  // Only render if there are multiple languages
  if (langs.length < 2) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/20 flex-wrap">
      <Globe size={13} className="text-muted-foreground shrink-0 mr-0.5" />
      {langs.map((lang) => {
        const { label, flag } = getLangLabel(lang);
        const isSelected = selectedLanguage === lang;
        return (
          <div key={lang} className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={isSelected ? 'default' : 'ghost'}
              className={cn(
                'h-6 px-2 text-xs gap-1',
                isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
              onClick={() => setSelectedLanguage(lang)}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </Button>
            {lang !== 'ko' && isSelected && (
              <div className="flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-1.5 text-xs"
                  disabled={translationStatuses[lang] === 'translating'}
                  onClick={() => onTranslate(lang)}
                >
                  번역
                </Button>
                {translationStatuses[lang] === 'translating' && (
                  <Loader2 size={11} className="animate-spin text-muted-foreground" />
                )}
                {translationStatuses[lang] === 'completed' && (
                  <Check size={11} className="text-green-600" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

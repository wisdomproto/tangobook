import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { setUiLanguage, AVAILABLE_UI_LANGS } from '@/i18n';

/** UI 언어 선택 — 번역 완비된 언어만(ko·en·vi·zh·th). 헤더 우상단 컴팩트 드롭다운. */
const LANGS = SUPPORTED_LANGUAGES.filter((l) => AVAILABLE_UI_LANGS.includes(l.code));

export function UiLangMenu() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // 번역 언어가 하나뿐이면(이론상) 선택 UI 불필요
  if (LANGS.length < 2) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-sm font-black text-ink-800 shadow-soft transition-all hover:shadow-pop"
        aria-label="언어 선택 / Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-sound="select"
      >
        <span className="text-base leading-none">{cur?.flag ?? '🌐'}</span>
        <span className="hidden text-xs sm:inline">{cur?.nativeName}</span>
        <span className="text-[10px] text-ink-400">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-pop ring-1 ring-ink-100"
        >
          {LANGS.map((l) => {
            const active = l.code === i18n.language;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    void setUiLanguage(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-peach-50 ${
                    active ? 'bg-peach-50 text-coral-600' : 'text-ink-700'
                  }`}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1">{l.nativeName}</span>
                  {active && <span className="text-coral-500">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

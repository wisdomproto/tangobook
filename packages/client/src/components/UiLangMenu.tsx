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
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-black text-ink-800 shadow-soft transition-all hover:shadow-pop"
        aria-label="언어 선택 / Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-sound="select"
      >
        <span className="text-base leading-none">{cur?.flag ?? '🌐'}</span>
        {/* 좁은 화면에선 국기만 — 헤더에 설치·프로필 칩과 함께 놓이므로 폭을 아낀다. */}
        <span className="hidden truncate sm:inline">{cur?.nativeName}</span>
        <span className="text-[10px] text-ink-400">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          // 🔴 좁은 화면에선 버튼에 매달지 않는다 — 이 칩은 헤더 우측 그룹 안에서 자리가
          // 옮겨다닌다(설치·로그인 버튼이 있으면 맨 왼쪽이라 우측정렬 메뉴가 화면 왼쪽으로
          // 잘리고, 없으면 맨 오른쪽이라 좌측정렬이 오른쪽으로 잘린다). 375px 은 헤더 아래
          // 폭 맞춤 시트, sm 이상에서만 버튼에 매다는 드롭다운.
          // ⚠️ `max-sm:` 은 이 프로젝트에서 안 만들어진다(theme.screens 의 `short: {raw}` 가
          //    Tailwind 의 max-* 변형을 통째로 막는다) → 모바일 base + `sm:` step-up 으로.
          className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-2xl bg-white py-1 shadow-pop ring-1 ring-ink-100 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1.5 sm:w-40"
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
                    void setUiLanguage(l.code, { explicit: true });
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

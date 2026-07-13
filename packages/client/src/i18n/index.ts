// UI i18n — 언어 목록은 shared SUPPORTED_LANGUAGES 단일 소스에서 derive.
// 새 언어 추가 = locales/<lang>/*.json 파일만 추가하면 자동 인식 (/add-language 커맨드 참조).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';

export const UI_LANG_KEY = 'tangobook-ui-lang';
// 사용자가 셀렉터/설정에서 언어를 "직접" 고르면 이 플래그가 켜진다 → 이후 /:lang URL 프리픽스가
// 언어를 덮어쓰지 않음 (한 번 vi 링크 탔다고 한국어 선택이 계속 vi 로 고정되던 문제 방지).
export const UI_LANG_EXPLICIT_KEY = 'tangobook-ui-lang-explicit';
export const UI_LANGS: string[] = SUPPORTED_LANGUAGES.map((l) => l.code);

/** 사용자가 언어를 직접 고른 적이 있는가 (LangEntry 가 덮어쓸지 판단). */
export function hasExplicitUiLang(): boolean {
  try {
    return localStorage.getItem(UI_LANG_EXPLICIT_KEY) === '1';
  } catch {
    return false;
  }
}

// ko(원문·폴백)는 eager 번들 — 첫 렌더에서 키 깜빡임 방지. 그 외 언어는 lazy.
const koModules = import.meta.glob('./locales/ko/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const localeModules = import.meta.glob('./locales/*/*.json');

// 실제 로케일 파일이 존재하는 언어만 = UI 언어 셀렉터에 노출할 목록.
// (SUPPORTED_LANGUAGES 는 콘텐츠·SEO 용 11개 전체지만, UI 번역이 없는 언어를
//  고르면 ko 로 폴백돼 "안 바뀐다"고 느껴지므로 셀렉터는 이걸 쓴다.)
// 새 언어 UI 번역 추가 = locales/<lang>/ 폴더 생기면 자동으로 여기 포함.
export const AVAILABLE_UI_LANGS: string[] = [
  ...new Set(Object.keys(localeModules).map((p) => p.split('/')[2])),
];

function nsFromPath(path: string, lang: string): string {
  return path.slice(`./locales/${lang}/`.length).replace(/\.json$/, '');
}

const koResources: Record<string, Record<string, unknown>> = {};
for (const [path, mod] of Object.entries(koModules)) {
  koResources[nsFromPath(path, 'ko')] = mod.default;
}

function detectLang(): string {
  try {
    const saved = localStorage.getItem(UI_LANG_KEY);
    // 실제 로케일 있는 언어만 인정 — 과거에 저장된 미번역 언어(ja 등)는 ko 로 폴백.
    if (saved && AVAILABLE_UI_LANGS.includes(saved)) return saved;
  } catch {
    /* SSR/프리렌더 등 localStorage 부재 */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'ko';
  return AVAILABLE_UI_LANGS.includes(nav) ? nav : 'ko';
}

/**
 * 언어 변경 + 영속화.
 * @param opts.explicit 사용자가 셀렉터/설정에서 직접 고른 경우 true — 이후 /:lang URL 이 덮어쓰지 못하게 플래그 저장.
 *   (LangEntry 처럼 URL 로 자동 설정하는 경우는 explicit 없이 호출 → 다음 명시적 선택 전까진 URL 이 계속 우선.)
 */
export async function setUiLanguage(lang: string, opts?: { explicit?: boolean }): Promise<void> {
  if (!AVAILABLE_UI_LANGS.includes(lang)) return; // 번역 없는 언어는 무시
  try {
    localStorage.setItem(UI_LANG_KEY, lang);
    if (opts?.explicit) localStorage.setItem(UI_LANG_EXPLICIT_KEY, '1');
  } catch {
    /* ignore */
  }
  await loadLanguage(lang);
  await i18n.changeLanguage(lang);
}

/** 해당 언어의 모든 네임스페이스 lazy 로드 (없는 파일은 무시 — ko 폴백). */
export async function loadLanguage(lang: string): Promise<void> {
  if (lang === 'ko') return; // eager 번들로 이미 로드됨
  const prefix = `./locales/${lang}/`;
  const loads = Object.entries(localeModules)
    .filter(([path]) => path.startsWith(prefix))
    .map(async ([path, loader]) => {
      const ns = nsFromPath(path, lang);
      const mod = (await loader()) as { default: Record<string, unknown> };
      i18n.addResourceBundle(lang, ns, mod.default, true, true);
    });
  await Promise.all(loads);
}

const initialLang = detectLang();

void i18n.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: 'ko', // ko 가 원문(소스 오브 트루스)
  resources: { ko: koResources }, // ko 는 동기 등록 (깜빡임 0)
  defaultNS: 'common',
  ns: Object.keys(koResources),
  interpolation: { escapeValue: false }, // React 가 이미 XSS 안전
  returnEmptyString: false,
  react: { useSuspense: false }, // lazy 로드 중엔 ko 폴백 노출
});

// 초기 언어가 ko 가 아니면 해당 로케일 lazy 로드
if (initialLang !== 'ko') void loadLanguage(initialLang);

// <html lang> 을 UI 언어와 동기화 — 언어별 디스플레이 폰트(index.css `:root[lang=...]`) 및
// 스크린리더·hreflang 힌트용. NanumSquareRound 는 한글 전용이라 vi/th/zh 는 이 lang 으로 폰트 스왑.
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;

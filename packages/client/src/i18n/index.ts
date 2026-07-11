// UI i18n — 언어 목록은 shared SUPPORTED_LANGUAGES 단일 소스에서 derive.
// 새 언어 추가 = locales/<lang>/*.json 파일만 추가하면 자동 인식 (/add-language 커맨드 참조).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';

export const UI_LANG_KEY = 'tangobook-ui-lang';
export const UI_LANGS: string[] = SUPPORTED_LANGUAGES.map((l) => l.code);

// ko(원문·폴백)는 eager 번들 — 첫 렌더에서 키 깜빡임 방지. 그 외 언어는 lazy.
const koModules = import.meta.glob('./locales/ko/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const localeModules = import.meta.glob('./locales/*/*.json');

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
    if (saved && UI_LANGS.includes(saved)) return saved;
  } catch {
    /* SSR/프리렌더 등 localStorage 부재 */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'ko';
  return UI_LANGS.includes(nav) ? nav : 'ko';
}

/** 언어 변경 + 영속화. 부모 설정·언어 스위처에서 사용. */
export async function setUiLanguage(lang: string): Promise<void> {
  if (!UI_LANGS.includes(lang)) return;
  try {
    localStorage.setItem(UI_LANG_KEY, lang);
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

export default i18n;

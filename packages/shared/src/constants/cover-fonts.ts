// Canonical cover-title font per language. Single source of truth shared by the
// in-app CSS overlay and (Plan #2) the server-side OG TTF bundle. Add one row per
// new SUPPORTED_LANGUAGES entry; unknown languages fall back to the Latin font.
export interface CoverFont {
  family: string;
}
const LATIN = 'Baloo 2';
const BY_LANG: Record<string, string> = {
  ko: 'Jua',
  en: LATIN,
  es: LATIN,
  fr: LATIN,
  de: LATIN,
  ms: LATIN,
  id: LATIN,
  vi: LATIN,
  zh: 'ZCOOL KuaiLe',
  ja: 'Noto Sans JP',
  th: 'Noto Sans Thai',
};
export function coverTitleFont(lang: string): CoverFont {
  return { family: BY_LANG[lang] ?? LATIN };
}
/** All distinct families — used to build the webfont @import / server TTF bundle. */
export const COVER_FONT_FAMILIES: string[] = [...new Set(Object.values(BY_LANG))];

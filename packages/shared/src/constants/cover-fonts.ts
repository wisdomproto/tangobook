// Complete cover-title webfonts are declared in client/lib/cover-title-fonts.css.
// Original TangoBook lettering and Korean + attributed OFL compatibility glyphs.
// Japanese uses regional outlines, followed by the same complete global family.
export interface CoverFont {
  family: string;
}
const LATIN = 'TangoBook Story Hand Global';
const BY_LANG: Record<string, string> = {
  ko: LATIN,
  en: LATIN,
  es: LATIN,
  fr: LATIN,
  de: LATIN,
  ms: LATIN,
  id: LATIN,
  vi: LATIN,
  zh: LATIN,
  ja: 'TangoBook Story Hand Global Japanese',
  th: LATIN,
};
export function coverTitleFont(lang: string): CoverFont {
  return { family: BY_LANG[lang.toLowerCase().split('-')[0]] ?? LATIN };
}
/** All distinct families — used to build the webfont @import / server TTF bundle. */
export const COVER_FONT_FAMILIES: string[] = [...new Set(Object.values(BY_LANG))];

// Canonical lang→font-family map for cover-title overlays. Unknown languages fall
// back to the Latin font. Adding a language font is a THREE-PLACE change (the font
// string can't be consumed from TS by CSS/Tailwind):
//   1) add a row here,
//   2) add the family to the webfont `@import` in packages/client/src/index.css,
//   3) add a `font-cover-*` token in packages/client/tailwind.config.ts + map it in
//      BookCover's coverFontClass (Chunk 2).
// Plan #2 (server OG) also bundles the TTFs listed in COVER_FONT_FAMILIES.
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

/** Lightweight home metadata: do not import game data builders into the home bundle. */
export const FREE_PLAYS = [
  { kind: 'blocks', art: 'blocks-ko.webp' },
  { kind: 'writing', art: 'writing.webp' },
  { kind: 'coloring', art: 'coloring.webp' },
  { kind: 'hidden-object', art: 'hidden.webp' },
] as const;
export type FreePlayKind = (typeof FREE_PLAYS)[number]['kind'];
export const isFreePlayKind = (kind: string | undefined): kind is FreePlayKind =>
  FREE_PLAYS.some((entry) => entry.kind === kind);

export type FreePlayLanguage = 'ko' | 'en';
export const freePlayLanguage = (value: string | null): FreePlayLanguage =>
  value === 'en' ? 'en' : 'ko';
export const freePlayLabelKey = (kind: FreePlayKind, lang: FreePlayLanguage) =>
  `freePlay.${kind === 'blocks' && lang === 'en' ? 'blocksEnglish' : kind}`;
export const freePlayArt = (kind: FreePlayKind, lang: FreePlayLanguage) =>
  kind === 'blocks' && lang === 'en'
    ? 'blocks-en.webp'
    : FREE_PLAYS.find((entry) => entry.kind === kind)!.art;

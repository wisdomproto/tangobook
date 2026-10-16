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

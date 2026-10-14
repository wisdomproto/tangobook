import {
  collapseStyleGroups,
  type BookGroupsDoc,
  type LibraryConfig,
  type StorybookSummary,
} from '@tangobook/shared';
import { makeCategoryComparator } from './category-order';

/** A daily rotation across categories, using public books and existing editorial order. */
export function recommendBooks(
  books: StorybookSummary[],
  groups: BookGroupsDoc['groups'] = [],
  config: LibraryConfig = {},
  day: string,
  previousIds: readonly string[] = []
): StorybookSummary[] {
  const publicBooks = books.filter((b) => b.isPublic && (!b.type || b.type === 'storybook'));
  const candidates = collapseStyleGroups(publicBooks, groups).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const fresh = candidates.filter((book) => !previousIds.includes(book.id));
  const selected = pickBooks(fresh, config, day, 3);
  return [
    ...selected,
    ...pickBooks(
      candidates.filter((book) => !selected.some((pick) => pick.id === book.id)),
      config,
      day,
      3 - selected.length
    ),
  ];
}

/** Prefer a completely new set; a small catalogue can reuse just the missing slots. */
function pickBooks(
  candidates: StorybookSummary[],
  config: LibraryConfig,
  day: string,
  count: number
) {
  if (count <= 0) return [];
  const categories = [...new Set(candidates.map((b) => b.category ?? '기타'))].sort(
    makeCategoryComparator(config.categoryOrder)
  );
  const seed = [...day].reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 0);
  const selected: StorybookSummary[] = [];
  for (let pass = 0; selected.length < count; pass++) {
    let added = false;
    for (const category of categories) {
      const priority = config.bookPriority?.[category] ?? [];
      const inCategory = candidates
        .filter((b) => (b.category ?? '기타') === category)
        .sort((a, b) => {
          const ai = priority.indexOf(a.id),
            bi = priority.indexOf(b.id);
          return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi) || a.id.localeCompare(b.id);
        });
      const book = inCategory[(seed + pass) % inCategory.length];
      if (book && !selected.some((b) => b.id === book.id)) {
        selected.push(book);
        added = true;
      }
      if (selected.length === count) break;
    }
    if (!added) break;
  }
  return selected;
}

import { describe, it, expect } from 'vitest';
import { sanitizeBookGroups, suggestStyleGroups } from './book-groups';

describe('sanitizeBookGroups', () => {
  it('drops groups without id/title and unknown kinds fall back to style', () => {
    const doc = sanitizeBookGroups({
      groups: [
        { id: 'a', title: '신데렐라', kind: 'weird', bookIds: ['1', '2'] },
        { id: '', title: 'x', bookIds: ['3'] },
        { id: 'b', title: '', bookIds: ['4'] },
      ],
    });
    expect(doc.groups).toEqual([
      { id: 'a', title: '신데렐라', kind: 'style', bookIds: ['1', '2'] },
    ]);
  });

  it('a book stays in only the first group of the same kind, but may be in a group of another kind', () => {
    const doc = sanitizeBookGroups({
      groups: [
        { id: 'a', title: 'A', kind: 'style', bookIds: ['1', '1', '2'] },
        { id: 'b', title: 'B', kind: 'style', bookIds: ['2', '3'] },
        { id: 'c', title: 'C', kind: 'series', bookIds: ['1'] },
      ],
    });
    expect(doc.groups.map((g) => g.bookIds)).toEqual([['1', '2'], ['3'], ['1']]);
  });

  it('survives garbage', () => {
    expect(sanitizeBookGroups(null).groups).toEqual([]);
    expect(sanitizeBookGroups({ groups: 'x' }).groups).toEqual([]);
  });
});

describe('suggestStyleGroups', () => {
  const books = [
    { id: '10', title: '신데렐라' },
    { id: '11', title: '신데렐라_그림체3' },
    { id: '12', title: '신데렐라_그림체1' },
    { id: '20', title: '피노키오' },
    { id: '30', title: '공룡' },
    { id: '31', title: '공룡' },
  ];

  it('groups a stem with its numbered siblings, ordered by number with the bare title at 2', () => {
    const [g] = suggestStyleGroups(books, []);
    expect(g).toMatchObject({ title: '신데렐라', kind: 'style', bookIds: ['12', '10', '11'] });
  });

  it('skips lone titles and same-title books with no numbered sibling', () => {
    expect(suggestStyleGroups(books, []).map((g) => g.title)).toEqual(['신데렐라']);
  });

  it('skips books already in a style group', () => {
    const existing = [
      { id: 'x', title: '신데렐라', kind: 'style' as const, bookIds: ['10', '11', '12'] },
    ];
    expect(suggestStyleGroups(books, existing)).toEqual([]);
  });
});

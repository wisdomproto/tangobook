import { describe, it, expect } from 'vitest';
import {
  sanitizeBookGroups,
  suggestStyleGroups,
  bookDisplayTitle,
  groupPrimaryId,
  collapseStyleGroups,
} from './book-groups';

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
    expect(g).toMatchObject({
      title: '신데렐라',
      kind: 'style',
      bookIds: ['12', '10', '11'],
      primaryId: '10',
    });
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

describe('bookDisplayTitle / groupPrimaryId', () => {
  it('strips the authoring suffix for Korean and prefers translations elsewhere', () => {
    expect(bookDisplayTitle({ title: '신데렐라_그림체2' })).toBe('신데렐라');
    expect(
      bookDisplayTitle({ title: '신데렐라_그림체2', titleTranslations: { en: 'Cinderella' } }, 'en')
    ).toBe('Cinderella');
    expect(bookDisplayTitle({ title: '신데렐라_그림체2' }, 'vi')).toBe('신데렐라');
    expect(bookDisplayTitle({ title: '그림체 이야기' })).toBe('그림체 이야기');
  });

  it('primary falls back to the first member when unset or stale', () => {
    expect(
      groupPrimaryId({ id: 'g', title: 't', kind: 'style', bookIds: ['a', 'b'], primaryId: 'b' })
    ).toBe('b');
    expect(
      groupPrimaryId({ id: 'g', title: 't', kind: 'style', bookIds: ['a', 'b'], primaryId: 'x' })
    ).toBe('a');
  });

  it('sanitize keeps a valid primaryId and drops a stale one', () => {
    const doc = sanitizeBookGroups({
      groups: [
        { id: 'a', title: 'A', bookIds: ['1', '2'], primaryId: '2' },
        { id: 'b', title: 'B', bookIds: ['3'], primaryId: '9' },
      ],
    });
    expect(doc.groups[0].primaryId).toBe('2');
    expect(doc.groups[1]).not.toHaveProperty('primaryId');
  });
});

describe('collapseStyleGroups', () => {
  const groups = [
    { id: 'g', title: 'A', kind: 'style' as const, bookIds: ['a1', 'a2', 'a3'], primaryId: 'a2' },
  ];
  const list = [{ id: 'x' }, { id: 'a3' }, { id: 'y' }, { id: 'a2' }, { id: 'a1' }];

  it('keeps one member at the first position of its group, primary by default', () => {
    expect(collapseStyleGroups(list, groups).map((b) => b.id)).toEqual(['x', 'a2', 'y']);
  });

  it('choose picks the member', () => {
    expect(
      collapseStyleGroups(list, groups, (m) => m.find((b) => b.id === 'a1')).map((b) => b.id)
    ).toEqual(['x', 'a1', 'y']);
  });

  it('falls back to a listed member when the primary is not in the list', () => {
    expect(collapseStyleGroups([{ id: 'a3' }, { id: 'a1' }], groups).map((b) => b.id)).toEqual([
      'a3',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import type { StorybookSummary, BookGroupsDoc } from '@tangobook/shared';
import { recommendBooks } from './home-recommendations';

const book = (
  id: string,
  category = '세계 명작',
  extra: Partial<StorybookSummary> = {}
): StorybookSummary => ({ id, title: id, isPublic: true, category, ...extra }) as StorybookSummary;
describe('daily book recommendations', () => {
  it('excludes private books and phonics, and collapses art-style editions', () => {
    const books = [
      book('a'),
      book('a2'),
      book('private', '세계 명작', { isPublic: false }),
      book('phonics', '한글', { type: 'phonics' }),
      book('b', '전래 동화'),
      book('c', '생활동화'),
    ];
    const groups = [
      { id: 'style-a', kind: 'style', bookIds: ['a', 'a2'], primaryId: 'a' },
    ] as BookGroupsDoc['groups'];
    const chosen = recommendBooks(books, groups, {}, '2026-10-12');
    expect(chosen).toHaveLength(3);
    expect(chosen.filter((b) => ['a', 'a2'].includes(b.id))).toHaveLength(1);
    expect(chosen.map((b) => b.category)).toEqual(['생활동화', '세계 명작', '전래 동화']);
  });
  it('is stable across input order and rotates by day without duplicate picks', () => {
    const books = ['a', 'b', 'c', 'd', 'e'].map((id) => book(id));
    const today = recommendBooks(books, [], {}, '2026-10-12');
    expect(recommendBooks([...books].reverse(), [], {}, '2026-10-12')).toEqual(today);
    expect(new Set(today.map((b) => b.id)).size).toBe(3);
    expect(recommendBooks(books, [], {}, '2026-10-13')).not.toEqual(today);
  });
  it('handles empty or short catalogues without fabricated books', () => {
    expect(recommendBooks([], [], {}, '2026-10-12')).toEqual([]);
    expect(recommendBooks([book('a')], [], {}, '2026-10-12')).toEqual([book('a')]);
  });
  it('excludes the whole previous set when at least three other public editions remain', () => {
    const books = Array.from({ length: 9 }, (_, i) => book(String(i)));
    const previous = recommendBooks(books, [], {}, 'today').map((book) => book.id);
    const next = recommendBooks(
      [...books, book('private', '기타', { isPublic: false })],
      [],
      {},
      'shuffle:1',
      previous
    );
    expect(next).toHaveLength(3);
    expect(next.every((book) => !previous.includes(book.id) && book.isPublic)).toBe(true);
  });
  it('uses every available new book before repeating any old choice in a short catalogue', () => {
    const books = ['a', 'b', 'c', 'd'].map((id) => book(id));
    const next = recommendBooks(books, [], {}, 'shuffle', ['a', 'b', 'c']);
    expect(next).toHaveLength(3);
    expect(next[0].id).toBe('d');
    expect(new Set(next.map((book) => book.id)).size).toBe(3);
    expect(recommendBooks([book('a')], [], {}, 'shuffle', ['a'])).toEqual([book('a')]);
  });
  it('does not reintroduce an alternate art edition of an excluded recommendation', () => {
    const books = ['a', 'a2', 'b', 'c', 'd', 'e', 'f'].map((id) => book(id));
    const groups = [
      { id: 'style-a', kind: 'style', bookIds: ['a', 'a2'], primaryId: 'a' },
    ] as BookGroupsDoc['groups'];
    const next = recommendBooks(books, groups, {}, 'shuffle', ['a', 'b', 'c']);
    expect(next.map((book) => book.id).sort()).toEqual(['d', 'e', 'f']);
  });
});

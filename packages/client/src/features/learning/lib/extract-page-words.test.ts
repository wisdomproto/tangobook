import { expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { extractPageWords } from './extract-page-words';
it('records translated page vocabulary without relabeling missing translations as Korean', () => {
  const book = {
    key_objects: [
      {
        name: 'duck',
        nameEn: 'duck',
        korean: '오리',
        pages: [1],
        nameTranslations: { vi: 'vịt', th: 'เป็ด', zh: '鸭子' },
      },
      { name: 'tree', korean: '나무', pages: [1] },
    ],
  } as Storybook;
  expect(extractPageWords(book, 1, 'ko').map((item) => item.word)).toEqual(['오리', '나무']);
  expect(extractPageWords(book, 1, 'vi').map((item) => item.word)).toEqual(['vịt']);
  expect(extractPageWords(book, 1, 'th').map((item) => item.word)).toEqual(['เป็ด']);
  expect(extractPageWords(book, 2, 'ko')).toEqual([]);
});

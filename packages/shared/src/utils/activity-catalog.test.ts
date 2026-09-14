import { describe, it, expect } from 'vitest';
import {
  slugify,
  parseActivityKey,
  worksheetItems,
  coloringItems,
  hiddenObjectItems,
  findActivity,
  nextInGroup,
  activityPageTitle,
} from './activity-catalog.js';

describe('slugify', () => {
  it('keeps hangul/latin/digits, joins the rest with one dash, max 40', () => {
    expect(slugify('01. 골고루 먹으면')).toBe('01-골고루-먹으면');
    expect(slugify('  ?!  ')).toBe('');
    expect(slugify('가'.repeat(50)).length).toBe(40);
  });
});

describe('parseActivityKey', () => {
  it('reads the leading key for sheets, whole id for worksheets', () => {
    expect(parseActivityKey('coloring', 'ph-0389-아이')).toBe('ph-0389');
    expect(parseActivityKey('coloring', 'bk-0001')).toBe('bk-0001');
    expect(parseActivityKey('coloring', 'ph-03891')).toBeNull();
    expect(parseActivityKey('hidden-object', 'jr-0034-팥죽-할멈')).toBe('jr-0034');
    expect(parseActivityKey('hangul', 'kr-h1-u02')).toBe('kr-h1-u02');
    expect(parseActivityKey('english', 'en-b1-u01')).toBe('en-b1-u01');
    expect(parseActivityKey('english', 'kr-h1-u02')).toBeNull();
  });
});

describe('items', () => {
  it('worksheet items come from the curriculum with app links', () => {
    const items = worksheetItems('hangul');
    expect(items.length).toBe(32);
    expect(items[0].path).toBe('/activity/hangul/kr-h1-u01');
    expect(items[0].sourceHref).toBe('/library/phonics/korean/kr-h1-u01');
    expect(worksheetItems('english').length).toBe(39);
  });

  it('coloring slug = key-word, book sheets add the book title and link to the book', () => {
    const [ph, bk] = coloringItems([
      {
        key: 'ph-0389',
        group: '한글 파닉스',
        section: 's',
        unitId: 'kr-h1-u01',
        word: '아이',
        language: 'korean',
        lineartUrl: '/a',
      },
      {
        key: 'bk-0001',
        group: '세계 명작',
        section: '개구리 왕자',
        bookId: '177',
        bookTitle: '개구리 왕자',
        word: '공',
        lineartUrl: '/b',
      },
    ]);
    expect(ph.slug).toBe('ph-0389-아이');
    expect(ph.sourceHref).toBe('/library/phonics/korean/kr-h1-u01');
    expect(bk.slug).toBe('bk-0001-공-개구리-왕자');
    expect(bk.sourceHref).toBe('/library/177');
    expect(bk.path).toBe('/activity/coloring/bk-0001-공-개구리-왕자');
  });

  it('coloring track comes from unitId prefix, not language', () => {
    const [en] = coloringItems([
      {
        key: 'ph-0500',
        group: '영어 파닉스',
        section: 's',
        unitId: 'en-b1-u01',
        word: 'apple',
        lineartUrl: '/c',
      },
    ]);
    expect(en.sourceHref).toBe('/library/phonics/english/en-b1-u01');
  });

  it('no bookId and no unitId links to the track learn base alone', () => {
    const [bare] = coloringItems([
      {
        key: 'ph-0600',
        group: '영어 파닉스',
        section: 's',
        unitId: undefined,
        word: 'apple',
        lineartUrl: '/d',
      },
    ]);
    expect(bare.sourceHref).toBe('/library/phonics/korean');
  });

  it('hidden-object slug = key-bookTitle', () => {
    const [h] = hiddenObjectItems([
      {
        key: 'jr-0034',
        bookId: '9',
        bookTitle: '팥죽 할멈과 호랑이',
        category: '전래 동화',
        sceneImageUrl: '/s',
        words: ['팥죽', '호랑이'],
      },
    ]);
    expect(h.slug).toBe('jr-0034-팥죽-할멈과-호랑이');
    expect(h.group).toBe('전래 동화');
  });
});

describe('activityPageTitle', () => {
  it('varies by kind, and coloring splits by book vs phonics sheet', () => {
    const [ph, bk] = coloringItems([
      {
        key: 'ph-0389',
        group: 'g',
        section: 's',
        unitId: 'kr-h1-u01',
        word: '아이',
        lineartUrl: '/a',
      },
      {
        key: 'bk-0001',
        group: 'g',
        section: '개구리 왕자',
        bookId: '177',
        bookTitle: '개구리 왕자',
        word: '공',
        lineartUrl: '/b',
      },
    ]);
    expect(activityPageTitle(ph)).toBe('아이 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북');
    expect(activityPageTitle(bk)).toBe('공 색칠도안 — 개구리 왕자 | 탱고북');

    const [ho] = hiddenObjectItems([
      {
        key: 'jr-0034',
        bookId: '9',
        bookTitle: '팥죽 할멈',
        category: '전래 동화',
        sceneImageUrl: '/s',
        words: ['팥죽'],
      },
    ]);
    expect(activityPageTitle(ho)).toBe(
      '팥죽 할멈 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북'
    );

    const [kr] = worksheetItems('hangul');
    expect(activityPageTitle(kr)).toBe(`${kr.title} 한글 학습지 무료 인쇄 | 탱고북`);
    const [en] = worksheetItems('english');
    expect(activityPageTitle(en)).toBe(`${en.title} 영어 파닉스 학습지 무료 인쇄 | 탱고북`);
  });
});

describe('findActivity', () => {
  const items = coloringItems([
    {
      key: 'ph-0389',
      group: 'g',
      section: 's',
      unitId: 'kr-h1-u01',
      word: '아이',
      language: 'korean',
      lineartUrl: '/a',
    },
    {
      key: 'ph-0390',
      group: 'g',
      section: 's',
      unitId: 'kr-h1-u01',
      word: '여우',
      language: 'korean',
      lineartUrl: '/b',
    },
  ]);
  it('finds by key, flags non-canonical slug, null when missing', () => {
    expect(findActivity('coloring', items, 'ph-0389-아이')).toMatchObject({ canonical: true });
    expect(findActivity('coloring', items, 'ph-0389')).toMatchObject({ canonical: false });
    expect(findActivity('coloring', items, 'ph-9999-x')).toBeNull();
  });
  it('nextInGroup wraps within the group', () => {
    expect(nextInGroup(items, 'ph-0389')?.key).toBe('ph-0390');
    expect(nextInGroup(items, 'ph-0390')?.key).toBe('ph-0389');
  });
});

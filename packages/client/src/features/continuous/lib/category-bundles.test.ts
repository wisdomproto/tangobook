import { describe, it, expect } from 'vitest';
import { buildCategoryBundles } from './category-bundles';

const b = (id: string, category: string, title: string, isPublic = true) => ({
  id,
  category,
  title,
  isPublic,
});

describe('buildCategoryBundles', () => {
  // 🔴 앞 3권만 담던 시절엔 10분 남짓이라 "틀어놓고 재우는" 쓰임에 못 미쳤다 — 카테고리 통째로.
  it('카테고리에 있는 책을 전부 묶는다', () => {
    const out = buildCategoryBundles([
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나'),
      b('3', '공룡', '03. 다'),
      b('4', '공룡', '04. 라'),
      b('5', '식물', '01. 마'),
      b('6', '식물', '02. 바'),
      b('7', '식물', '03. 사'),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ category: '공룡', bookIds: ['1', '2', '3', '4'] });
    expect(out[1]).toEqual({ category: '식물', bookIds: ['5', '6', '7'] });
  });

  it('제목의 앞 번호를 숫자로 정렬한다(문자열 정렬이면 10이 2보다 앞선다)', () => {
    const out = buildCategoryBundles([
      b('c', '생활', '10. 다'),
      b('a', '생활', '02. 가'),
      b('b', '생활', '03. 나'),
    ]);
    expect(out[0].bookIds).toEqual(['a', 'b', 'c']);
  });

  it('비공개 책은 제외한다', () => {
    const out = buildCategoryBundles([
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나', false),
      b('3', '공룡', '03. 다'),
      b('4', '공룡', '04. 라'),
    ]);
    expect(out[0].bookIds).toEqual(['1', '3', '4']);
  });

  it('2권 미만인 카테고리는 묶음을 만들지 않는다', () => {
    expect(buildCategoryBundles([b('1', '공룡', '01. 가')])).toEqual([]);
  });

  it('2권만 있으면 2권짜리 묶음을 만든다', () => {
    const out = buildCategoryBundles([b('1', '공룡', '01. 가'), b('2', '공룡', '02. 나')]);
    expect(out[0].bookIds).toEqual(['1', '2']);
  });

  it('카테고리가 없는 책은 제외한다', () => {
    const out = buildCategoryBundles([
      { id: 'x', title: '무카테고리', isPublic: true },
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나'),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('공룡');
  });

  it('번호 없는 제목은 제목순으로 정렬한다', () => {
    const out = buildCategoryBundles([
      b('c', '명작', '신데렐라'),
      b('a', '명작', '개구리 왕자'),
      b('b', '명작', '백설공주'),
    ]);
    expect(out[0].bookIds).toEqual(['a', 'b', 'c']);
  });

  it('빈 입력이면 빈 배열', () => {
    expect(buildCategoryBundles([])).toEqual([]);
  });

  // 🔴 라이브러리 동화책 페이지는 matchesType 으로 파닉스를 제외한다(파닉스는 별도 축·devOnly).
  // 묶음이 그 규칙을 어기면 동화책 화면에 파닉스 유닛 묶음이 튀어나온다.
  it('파닉스 책은 제외한다', () => {
    const out = buildCategoryBundles([
      { id: 'p1', category: '영어 파닉스', title: 'Unit 01', isPublic: true, type: 'phonics' },
      { id: 'p2', category: '영어 파닉스', title: 'Unit 02', isPublic: true, type: 'phonics' },
      { id: 'p3', category: '영어 파닉스', title: 'Unit 03', isPublic: true, type: 'phonics' },
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나'),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('공룡');
  });

  it('type 이 storybook 이거나 없으면 포함한다', () => {
    const out = buildCategoryBundles([
      { id: '1', category: '공룡', title: '01. 가', isPublic: true, type: 'storybook' },
      { id: '2', category: '공룡', title: '02. 나', isPublic: true },
    ]);
    expect(out[0].bookIds).toEqual(['1', '2']);
  });
});

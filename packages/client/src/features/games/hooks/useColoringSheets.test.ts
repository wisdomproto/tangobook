import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { coloringLabel, countColoringSheets, findSheetKeyObject } from './useColoringSheets';

/**
 * 색칠 카드 판정과 도안 라벨이 쓰는 규칙 — 실제 데이터 모양 그대로 옮겼다.
 * 개구리 왕자: `name` 이 한국어(`공`)라 작업판이 도안 낱말을 영어(`Ball`)로 구웠다.
 */
const frogPrince = {
  id: '1772009873865',
  key_objects: [
    {
      name: '공',
      korean: '공',
      nameEn: 'ball',
      nameTranslations: { vi: 'quả bóng', zh: '球', th: 'ลูกบอล' },
    },
    { name: 'Table', korean: '식탁', nameEn: 'table', nameTranslations: {} },
  ],
} as unknown as Storybook;

/** 전래동화: 영어 라벨이 로마자다 — 영어 화면이 원래 그렇게 보인다. */
const jeonrae = {
  id: '1785303656257',
  key_objects: [{ name: 'Buttumak', korean: '부뚜막', nameTranslations: { en: 'Buttumak' } }],
} as unknown as Storybook;

describe('findSheetKeyObject', () => {
  it('도안 낱말이 영어로 박혀 있어도 nameEn 으로 찾는다', () => {
    expect(findSheetKeyObject(frogPrince, 'Ball')?.korean).toBe('공');
  });
  it('korean 으로도 찾는다', () => {
    expect(findSheetKeyObject(frogPrince, '식탁')?.name).toBe('Table');
  });
  it('책에서 빠진 낱말은 없다고 한다', () => {
    expect(findSheetKeyObject(frogPrince, 'Door')).toBeUndefined();
  });
});

describe('coloringLabel', () => {
  const ball = findSheetKeyObject(frogPrince, 'Ball');
  it('한국어 화면에 영어 낱말을 내지 않는다', () => {
    expect(coloringLabel(ball, 'ko')).toBe('공');
  });
  it('번역 칸이 비어도 영어는 nameEn 을 쓴다', () => {
    expect(coloringLabel(ball, 'en')).toBe('ball');
  });
  it('번역이 있는 언어는 그 말로', () => {
    expect(coloringLabel(ball, 'vi')).toBe('quả bóng');
  });
  it('번역이 없는 언어는 null — 다른 언어로 때우지 않는다', () => {
    const table = findSheetKeyObject(frogPrince, 'Table');
    expect(coloringLabel(table, 'vi')).toBeNull();
    expect(coloringLabel(table, 'en')).toBe('table');
  });
  it('전래동화 영어는 로마자 번역을 쓴다', () => {
    expect(coloringLabel(findSheetKeyObject(jeonrae, '부뚜막'), 'en')).toBe('Buttumak');
  });
  it('한국어만 있는 이름은 영어 라벨이 되지 않는다', () => {
    const koOnly = { name: '종지', korean: '종지' } as unknown as Storybook['key_objects'][number];
    expect(coloringLabel(koOnly, 'en')).toBeNull();
  });
});

describe('countColoringSheets', () => {
  const words = ['Ball', '식탁', 'Door'];
  it('라벨을 붙일 수 있는 도안만 센다 — 카드를 내 놓고 빈 화면을 열지 않게', () => {
    expect(countColoringSheets(words, frogPrince, 'ko')).toBe(2);
    expect(countColoringSheets(words, frogPrince, 'en')).toBe(2);
    expect(countColoringSheets(words, frogPrince, 'vi')).toBe(1);
  });
  it('책이나 색인이 없으면 0', () => {
    expect(countColoringSheets(undefined, frogPrince, 'ko')).toBe(0);
    expect(countColoringSheets(words, undefined, 'ko')).toBe(0);
  });
});

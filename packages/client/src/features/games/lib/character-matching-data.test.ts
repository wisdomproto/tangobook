import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildCharacterMatchingData, displayCharacterName } from './character-matching-data';

const book = (characters: unknown[]): Storybook =>
  ({ id: 'b1', title: 't', pages: [], characters }) as unknown as Storybook;
const c = (name: string) => ({ name, referenceImage: `https://cdn/${name}.jpg` });
/** 레퍼런스 그림이 없는 인물 — 카드가 못 된다. */
const noRef = (name: string) => ({ name });

describe('displayCharacterName', () => {
  it('저작 식별자를 아이가 읽을 이름으로 줄인다', () => {
    expect(displayCharacterName('새선비(구렁이)')).toBe('새선비');
    expect(displayCharacterName('선화공주 (궁 안)')).toBe('선화공주');
    expect(displayCharacterName('난쟁이1')).toBe('난쟁이');
    expect(displayCharacterName('인어 언니 1')).toBe('인어 언니');
    expect(displayCharacterName('방앗간  할머니')).toBe('방앗간 할머니');
  });
});

describe('buildCharacterMatchingData', () => {
  it('레퍼런스 그림 있는 인물로 카드를 만든다', () => {
    const d = buildCharacterMatchingData(book([c('반쪽이'), c('어머니'), c('호랑이')]));
    expect(d?.type).toBe('korean-character-matching');
    expect(d?.items.map((i) => i.word).sort()).toEqual(['반쪽이', '어머니', '호랑이']);
  });

  it('정규화 후 같은 이름이면 첫 레퍼런스만 남긴다 (변신 캐릭터)', () => {
    const d = buildCharacterMatchingData(
      book([c('새선비(구렁이)'), c('새선비(선비)'), c('셋째 딸'), c('두 언니')])
    );
    expect(d!.items.filter((i) => i.word === '새선비')).toHaveLength(1);
    expect(d!.items[0].imageUrl).toBeTruthy();
  });

  it('그림 없는 인물·한글 아닌 이름은 뺀다', () => {
    expect(
      buildCharacterMatchingData(book([c('반쪽이'), c('어머니'), noRef('호랑이')]))
    ).toBeNull();
    expect(buildCharacterMatchingData(book([c('반쪽이'), c('어머니'), c('Gulliver')]))).toBeNull();
  });

  it('3명 미만이면 null — 둘이면 짝짓기가 성립하지 않는다', () => {
    expect(buildCharacterMatchingData(book([c('반쪽이'), c('어머니')]))).toBeNull();
    expect(buildCharacterMatchingData(undefined)).toBeNull();
  });

  it('많아도 4장까지', () => {
    const d = buildCharacterMatchingData(
      book(['가', '나', '다', '라', '마', '바'].map((n) => c(n + '돌이')))
    );
    expect(d?.items).toHaveLength(4);
  });
});

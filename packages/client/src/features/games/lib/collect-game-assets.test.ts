import { describe, it, expect } from 'vitest';
import {
  extractItemImages,
  extractItemWords,
  collectSyllableUrls,
  collectSceneAssets,
  buildTtsSpec,
} from './collect-game-assets';

const blockData = {
  type: 'korean-block',
  items: [
    { word: '나무', imageUrl: 'https://r2/a.webp' },
    { word: '숲', imageUrl: 'https://r2/b.webp' },
  ],
} as any;
const dotsData = {
  type: 'connect-the-dots',
  items: [{ objectName: 'tree', originalImageUrl: 'https://r2/c.webp' }],
} as any;

describe('extractItemImages', () => {
  it('블록 데이터에서 imageUrl 수집', () => {
    expect(extractItemImages(blockData)).toEqual(['https://r2/a.webp', 'https://r2/b.webp']);
  });
  it('점잇기는 originalImageUrl 수집', () => {
    expect(extractItemImages(dotsData)).toEqual(['https://r2/c.webp']);
  });
  it('빈 URL 은 제외', () => {
    expect(
      extractItemImages({ type: 'korean-block', items: [{ word: 'x', imageUrl: '' }] } as any)
    ).toEqual([]);
  });
});

describe('extractItemWords', () => {
  it('블록 데이터에서 word 수집', () => {
    expect(extractItemWords(blockData)).toEqual(['나무', '숲']);
  });
  it('점잇기는 objectName 수집', () => {
    expect(extractItemWords(dotsData)).toEqual(['tree']);
  });
});

describe('collectSyllableUrls', () => {
  const map = new Map<string, string>([
    ['나', 'u-na'],
    ['무', 'u-mu'],
    ['숲', 'u-sup'],
  ]);
  it('한글 음절만 맵에서 URL 수집, 중복 제거', () => {
    expect(collectSyllableUrls(['나무', '숲'], map).sort()).toEqual(['u-mu', 'u-na', 'u-sup']);
  });
  it('맵에 없는 음절은 건너뜀', () => {
    expect(collectSyllableUrls(['가'], map)).toEqual([]);
  });
  it('영어 단어는 무시', () => {
    expect(collectSyllableUrls(['tree'], map)).toEqual([]);
  });
  it('맵이 null 이면 빈 배열', () => {
    expect(collectSyllableUrls(['나무'], null)).toEqual([]);
  });
});

const book = {
  key_objects: [{ name: '나무', korean: '나무', pages: [1] }],
  pages: [
    {
      pageNumber: 1,
      text: '나무가 있다',
      illustrationUrl: 'https://r2/scene1.webp',
      ttsUrl: 'https://r2/narr1.mp3',
    },
  ],
} as any;

describe('collectSceneAssets', () => {
  it('블록 게임: 단어별 장면 삽화+나레이션 수집', () => {
    const r = collectSceneAssets(['나무'], 'ko', book, undefined, 'korean-block');
    expect(r.sceneImages).toEqual(['https://r2/scene1.webp']);
    expect(r.sceneNarrations).toEqual(['https://r2/narr1.mp3']);
  });
  it('비블록 게임은 빈 결과', () => {
    const r = collectSceneAssets(['나무'], 'ko', book, undefined, 'connect-the-dots');
    expect(r.sceneImages).toEqual([]);
    expect(r.sceneNarrations).toEqual([]);
  });
  it('book 없으면 빈 결과', () => {
    const r = collectSceneAssets(['나무'], 'ko', undefined, undefined, 'korean-block');
    expect(r.sceneImages).toEqual([]);
  });
});

describe('buildTtsSpec', () => {
  it('korean-block: language=korean, prefix=kblock, text+directUrl', () => {
    const spec = buildTtsSpec(
      { type: 'korean-block', items: [{ word: '나무', ttsUrl: 'https://r2/na.mp3' }] } as any,
      'korean-block'
    );
    expect(spec?.language).toBe('korean');
    expect(spec?.identifierPrefix).toBe('kblock');
    expect(spec?.items).toEqual([{ text: '나무', directUrl: 'https://r2/na.mp3' }]);
  });
  it('english-block: prefix=eblock, directUrl 포함', () => {
    const spec = buildTtsSpec(
      { type: 'english-block', items: [{ word: 'tree', ttsUrl: 'https://r2/t.mp3' }] } as any,
      'english-block'
    );
    expect(spec?.identifierPrefix).toBe('eblock');
    expect(spec?.items[0].directUrl).toBe('https://r2/t.mp3');
  });
  it('ttsUrl 없어도 text 는 수집(directUrl undefined)', () => {
    const spec = buildTtsSpec(
      { type: 'korean-block', items: [{ word: '숲' }] } as any,
      'korean-block'
    );
    expect(spec?.items).toEqual([{ text: '숲', directUrl: undefined }]);
  });
  it('line-matching / connect-the-dots 는 대상 아님(null)', () => {
    expect(
      buildTtsSpec({ type: 'korean-line-matching', items: [] } as any, 'korean-line-matching')
    ).toBeNull();
    expect(
      buildTtsSpec(
        { type: 'connect-the-dots', items: [{ objectName: 'x' }] } as any,
        'connect-the-dots'
      )
    ).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { firstClause, splitIntoBuckets, pickMorph, MORPH_LINES } from '../reel-props';

const styleWithPages = (id: string, pages: number[]) => ({
  coverImage: `https://r2/${id}/cover.png`,
  pageIllustrations: Object.fromEntries(
    pages.map((p) => [String(p), { illustrationUrl: `https://r2/${id}/page-${p}.png` }])
  ),
});

describe('firstClause', () => {
  it('첫 절을 자르고 최대 길이로 트림', () => {
    expect(
      firstClause(
        '막내 공주가 황금 공을 연못에 빠뜨리자, 개구리가 친구가 되어 함께 지내겠다는 약속을 받고 공을 찾아 줍니다.',
        24
      )
    ).toBe('막내 공주가 황금 공을 연못에 빠뜨리자');
  });
  it('짧으면 그대로(마침표 제거)', () => {
    expect(firstClause('약속은 소중한 거야.', 40)).toBe('약속은 소중한 거야');
  });
});
describe('splitIntoBuckets', () => {
  it('n개 버킷에 순서대로 균등 분배(나머지는 앞쪽)', () => {
    expect(splitIntoBuckets([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
      [6, 7],
    ]);
  });
  it('개수<버킷이면 앞부터 채우고 빈 버킷 허용', () => {
    expect(splitIntoBuckets([1, 2], 3)).toEqual([[1], [2], []]);
  });
});

describe('pickMorph', () => {
  it('3개 그림풍 → 공통 최대 페이지 사용, 콜라주→수채→페이퍼 순서', () => {
    const styleAssets = {
      A: styleWithPages('A', [1, 3]),
      B: styleWithPages('B', [1, 3]),
      C: styleWithPages('C', [1, 3]),
    };
    const genreMap = { A: 'collage', B: 'watercolor', C: 'paper3d' };
    const result = pickMorph(styleAssets, genreMap);
    expect(result).not.toBeNull();
    expect(result!.lines).toEqual(MORPH_LINES);
    expect(result!.styles.length).toBe(3);
    expect(result!.styles).toEqual([
      { url: encodeURI('https://r2/A/page-3.png'), label: '콜라주' },
      { url: encodeURI('https://r2/B/page-3.png'), label: '수채동화풍' },
      { url: encodeURI('https://r2/C/page-3.png'), label: '페이퍼 3D 아트' },
    ]);
  });
  it('매핑된 그림풍이 1개면 null', () => {
    const styleAssets = {
      A: styleWithPages('A', [1, 3]),
      X: styleWithPages('X', [1, 3]),
    };
    const genreMap = { A: 'collage', X: 'pixar-3d' };
    expect(pickMorph(styleAssets, genreMap)).toBeNull();
  });
});

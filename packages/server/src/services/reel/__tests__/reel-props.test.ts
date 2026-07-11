import { describe, it, expect } from 'vitest';
import {
  firstClause,
  splitIntoBuckets,
  pickMorph,
  pickMainStyle,
  MORPH_LINES,
  buildReelProps,
} from '../reel-props';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

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
  it('공통 페이지가 없으면 null', () => {
    const styleAssets = {
      A: styleWithPages('A', [1, 2]),
      B: styleWithPages('B', [3, 4]),
    };
    const genreMap = { A: 'collage', B: 'watercolor' };
    expect(pickMorph(styleAssets, genreMap)).toBeNull();
  });
});

describe('pickMainStyle', () => {
  const genreMap = { A: 'collage', B: 'watercolor', C: 'paper3d', X: 'pixar-3d' };
  const sa = {
    A: styleWithPages('A', [1, 2]),
    B: styleWithPages('B', [1, 2]),
    C: styleWithPages('C', [1, 2]),
    X: styleWithPages('X', [1, 2]), // 미매핑 → 제외
  };
  it('매핑된 3그림체 중 하나를 선택(미매핑 제외)', () => {
    const picked = pickMainStyle(sa, genreMap, 'book-1');
    expect(['A', 'B', 'C']).toContain(picked);
    expect(picked).not.toBe('X');
  });
  it('같은 seed면 항상 같은 선택(결정적)', () => {
    expect(pickMainStyle(sa, genreMap, 'seed-42')).toBe(pickMainStyle(sa, genreMap, 'seed-42'));
  });
  it('매핑된 그림체가 없으면 null', () => {
    expect(pickMainStyle({ X: sa.X }, genreMap, 's')).toBeNull();
  });
});

describe('buildReelProps', () => {
  const ACTIVE = 'style-1778824179240';
  const WATER = 'style-1778405374347';
  const PAPER = 'paper-craft';

  const makeStorybook = () => ({
    title: '개구리 왕자',
    artStyle: ACTIVE,
    styleAssets: {
      [ACTIVE]: styleWithPages(ACTIVE, range(1, 15)),
      [WATER]: styleWithPages(WATER, range(1, 15)),
      [PAPER]: styleWithPages(PAPER, range(1, 15)),
    },
  });

  const makeStoryboard = (nScenes = 5) => ({
    title: '개구리 왕자',
    scenes: ['훅', '원작·배경', '줄거리', '교훈', 'CTA'].slice(0, nScenes).map((label, i) => ({
      label,
      subtitle: `${label} 자막`,
      narration: `${label} 나레이션 문장입니다.`,
      imagePrompt: `${label} prompt`,
    })),
  });

  const genreMap = { [ACTIVE]: 'collage', [WATER]: 'watercolor', [PAPER]: 'paper3d' };

  it('4 씬 조립 + 훅 라벨=책 제목 + 모프', () => {
    const storybook = makeStorybook();
    const out = buildReelProps({ storybook, storyboard: makeStoryboard(), genreMap });
    expect(out).not.toBeNull();
    expect(out!.bookTitle).toBe('개구리 왕자');
    expect(out!.scenes.length).toBe(4);
    expect(out!.scenes[0].label).toBe('개구리 왕자');
    expect(out!.scenes[0].body).toBe('훅 자막'); // subtitle 우선
    // 메인 그림체는 3개 중 해시로 선택 → 그 그림체의 표지를 사용
    const mainId = pickMainStyle(storybook.styleAssets, genreMap, '개구리 왕자')!;
    expect(out!.scenes[0].imageUrls).toEqual([
      encodeURI((storybook.styleAssets as any)[mainId].coverImage),
    ]);
    expect(out!.scenes[1].label).toBe('원작·배경');
    for (const s of out!.scenes) {
      expect(s.imageUrls.length).toBeGreaterThanOrEqual(1);
    }
    expect(out!.styleMorph).not.toBeNull();
    expect(out!.styleMorph!.styles.length).toBe(3);
    expect(out!.styleMorph!.lines).toEqual(MORPH_LINES);
  });

  it('스토리보드가 5 씬 미만이면 null', () => {
    const out = buildReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(4),
      genreMap,
    });
    expect(out).toBeNull();
  });

  it('페이지<3이면 빈 버킷은 전체 페이지로 폴백(모든 씬 이미지≥1)', () => {
    // 3그림체 모두 2페이지 → 어느 그림체가 선택돼도 <3 폴백 트리거
    const storybook = {
      title: '개구리 왕자',
      artStyle: ACTIVE,
      styleAssets: {
        [ACTIVE]: styleWithPages(ACTIVE, [1, 2]),
        [WATER]: styleWithPages(WATER, [1, 2]),
        [PAPER]: styleWithPages(PAPER, [1, 2]),
      },
    };
    const out = buildReelProps({ storybook, storyboard: makeStoryboard(), genreMap });
    expect(out).not.toBeNull();
    expect(out!.scenes.length).toBe(4);
    for (const s of out!.scenes) expect(s.imageUrls.length).toBeGreaterThanOrEqual(1);
    // splitIntoBuckets([1,2],3) = [[1],[2],[]] → 3번째 본문 씬은 전체 페이지로 폴백
    expect(out!.scenes[3].imageUrls.length).toBe(2);
  });

  it('captions 오버라이드가 subtitle/narration보다 우선', () => {
    const out = buildReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(),
      genreMap,
      captions: ['훅캡션', '원작캡션', '줄거리캡션', '교훈캡션'],
    });
    expect(out!.scenes.map((s) => s.body)).toEqual([
      '훅캡션',
      '원작캡션',
      '줄거리캡션',
      '교훈캡션',
    ]);
  });
  it('captions 일부만 있으면 그 씬만 오버라이드(나머지는 subtitle 폴백)', () => {
    const out = buildReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(),
      genreMap,
      captions: ['훅캡션'], // 씬0만
    });
    expect(out!.scenes[0].body).toBe('훅캡션');
    expect(out!.scenes[1].body).toBe('원작·배경 자막'); // subtitle 폴백
  });

  it('활성 그림풍에 일러스트가 없으면 null', () => {
    const storybook = {
      title: '개구리 왕자',
      artStyle: ACTIVE,
      styleAssets: {
        [ACTIVE]: { coverImage: 'https://r2/x/cover.png', pageIllustrations: {} },
      },
    };
    const out = buildReelProps({ storybook, storyboard: makeStoryboard(), genreMap });
    expect(out).toBeNull();
  });
});

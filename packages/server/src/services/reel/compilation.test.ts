import { describe, it, expect } from 'vitest';
import {
  LIFE_TRACKS,
  episodeNumber,
  stripEpisodeNumber,
  groupByTrack,
  unassignedParts,
  buildTrackCompilationMeta,
  type CompilationPart,
} from './compilation.js';

const part = (n: number, sec = 200, title?: string): CompilationPart => ({
  bookId: `b${n}`,
  title: title ?? `${String(n).padStart(2, '0')}. 이야기 ${n}`,
  videoUrl: `https://r2/${n}.mp4`,
  durationSec: sec,
});

// 생활동화 45편(01~45)
const ALL = Array.from({ length: 45 }, (_, i) => part(i + 1));

describe('episodeNumber / stripEpisodeNumber', () => {
  it('선두 번호를 읽고 뗀다', () => {
    expect(episodeNumber('01. 골고루 먹으면 무지개 힘!')).toBe(1);
    expect(episodeNumber('45. 고마워, 자연아!')).toBe(45);
    expect(stripEpisodeNumber('01. 골고루 먹으면 무지개 힘!')).toBe('골고루 먹으면 무지개 힘!');
  });

  it('번호가 없으면 null, 제목은 보존', () => {
    expect(episodeNumber('헨젤과 그레텔')).toBeNull();
    expect(stripEpisodeNumber('헨젤과 그레텔')).toBe('헨젤과 그레텔');
  });

  it('제목 안의 숫자는 번호로 오인하지 않는다', () => {
    expect(episodeNumber('아기 돼지 3형제')).toBeNull();
  });
});

describe('groupByTrack', () => {
  const groups = groupByTrack(ALL, LIFE_TRACKS);

  it('커리큘럼 7트랙으로 나뉜다', () => {
    expect(groups).toHaveLength(7);
    expect(groups.map((g) => g.parts.length)).toEqual([8, 6, 8, 8, 8, 4, 3]);
  });

  it('45편이 빠짐없이 한 번씩만 들어간다', () => {
    const ids = groups.flatMap((g) => g.parts.map((p) => p.bookId));
    expect(ids).toHaveLength(45);
    expect(new Set(ids).size).toBe(45);
  });

  it('트랙 안에서 회차 순으로 정렬된다', () => {
    const safety = groups.find((g) => g.track.key === 'C')!;
    expect(safety.parts.map((p) => episodeNumber(p.title))).toEqual([
      15, 16, 17, 18, 19, 20, 21, 22,
    ]);
  });

  it('조각이 없는 트랙은 결과에서 빠진다', () => {
    const only = groupByTrack([part(1), part(2)], LIFE_TRACKS);
    expect(only).toHaveLength(1);
    expect(only[0].track.key).toBe('A');
  });

  it('길이를 합산한다', () => {
    const g = groupByTrack([part(1, 100), part(2, 150)], LIFE_TRACKS)[0];
    expect(g.totalSec).toBe(250);
  });
});

describe('unassignedParts', () => {
  it('번호 없는 편을 잡아낸다', () => {
    const odd = part(0, 200, '번호없는 이야기');
    expect(unassignedParts([part(1), odd], LIFE_TRACKS)).toEqual([odd]);
  });

  it('트랙 범위 밖 번호도 잡아낸다', () => {
    const over = part(46, 200, '46. 범위 밖');
    expect(unassignedParts([over], LIFE_TRACKS)).toEqual([over]);
  });
});

describe('buildTrackCompilationMeta', () => {
  const safety = groupByTrack(ALL, LIFE_TRACKS).find((g) => g.track.key === 'C')!;
  const meta = buildTrackCompilationMeta({
    seriesLabel: '호리네 생활동화',
    track: safety.track,
    parts: safety.parts,
    totalSec: safety.totalSec,
  });

  it('테마 라벨을 앞세운다', () => {
    expect(meta.title.startsWith('[안전 동화 모음]')).toBe(true);
  });

  it('연속듣기·분수·중간광고 없는 이 들어간다', () => {
    expect(meta.title).toContain('연속듣기');
    expect(meta.title).toContain('27분');
    expect(meta.title).toContain('중간광고 없는');
  });

  it('🔴 순번·Ep.N·개별 작품 나열이 제목에 없다(벤치마크 최하위 포맷)', () => {
    expect(meta.title).not.toMatch(/모음\s*\d+\s*편/);
    expect(meta.title).not.toMatch(/Ep\.?\s*\d/i);
    expect(meta.title).not.toContain('이야기 15'); // 개별 작품명 나열 금지
  });

  it('제목이 100자를 넘지 않는다', () => {
    expect(meta.title.length).toBeLessThanOrEqual(100);
  });

  it('수록 목록은 설명에만, 내부 번호는 제거된 채로', () => {
    expect(meta.description).toContain('1. 이야기 15');
    expect(meta.description).not.toContain('15. 이야기 15');
  });

  it('태그에 핵심 검색어가 있다', () => {
    expect(meta.tags).toContain('잠자리동화');
    expect(meta.tags).toContain('연속듣기');
  });
});

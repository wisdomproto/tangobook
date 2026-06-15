import { describe, it, expect } from 'vitest';
import { buildCandidates, MAIN_KEYWORDS } from './keyword-candidates.mjs';
import { selectKeywords } from './keyword-select.mjs';

describe('buildCandidates', () => {
  it('ko classic: 제목 단독 + 동화/줄거리/교훈 변형 포함', () => {
    const c = buildCandidates('신데렐라', 'classic', 'ko');
    expect(c).toContain('신데렐라');
    expect(c).toContain('신데렐라 동화');
    expect(c).toContain('신데렐라 줄거리');
    expect(c).toContain('신데렐라 교훈');
    expect(new Set(c).size).toBe(c.length);
  });
  it('en nature: 제목 + for kids 변형 포함', () => {
    const c = buildCandidates('Penguin', 'nature', 'en');
    expect(c).toContain('Penguin');
    expect(c).toContain('Penguin for kids');
  });
  it('vi/th 도 제목 단독을 포함하고 비어있지 않다', () => {
    expect(buildCandidates('Lọ Lem', 'classic', 'vi')).toContain('Lọ Lem');
    expect(buildCandidates('ซินเดอเรลล่า', 'classic', 'th')).toContain('ซินเดอเรลล่า');
  });
});

describe('MAIN_KEYWORDS', () => {
  it('4개 언어 모두 비어있지 않은 헤드 키워드 풀을 가진다', () => {
    for (const lang of ['ko', 'en', 'vi', 'th']) {
      expect(Array.isArray(MAIN_KEYWORDS[lang])).toBe(true);
      expect(MAIN_KEYWORDS[lang].length).toBeGreaterThan(0);
    }
  });
});

describe('selectKeywords', () => {
  const cands = [
    { keyword: '신데렐라', searchVolume: 800, competition: 0.3, cpc: 0.1 },
    { keyword: '신데렐라 동화', searchVolume: 1300, competition: 0.2, cpc: 0.1 },
    { keyword: '신데렐라 줄거리', searchVolume: 200, competition: 0.1, cpc: 0.05 },
    { keyword: '신데렐라 교훈', searchVolume: 90, competition: 0.1, cpc: 0.05 },
    { keyword: '동화책', searchVolume: 5000, competition: 0.6, cpc: 0.3 },
  ];
  it('primary = 제목 포함 + 최고 검색량', () => {
    expect(selectKeywords('신데렐라', cands).primary).toBe('신데렐라 동화');
  });
  it('secondary 는 primary 제외 + 최대 5개', () => {
    const r = selectKeywords('신데렐라', cands);
    expect(r.secondary).not.toContain(r.primary);
    expect(r.secondary.length).toBeLessThanOrEqual(5);
    expect(r.secondary).toContain('신데렐라');
  });
  it('검색량이 모두 0이어도 제목 기반 primary 반환(폴백)', () => {
    const zero = [
      { keyword: '두꺼비', searchVolume: 0, competition: 0, cpc: 0 },
      { keyword: '두꺼비 그림책', searchVolume: 0, competition: 0, cpc: 0 },
    ];
    const r = selectKeywords('두꺼비', zero);
    expect(['두꺼비', '두꺼비 그림책']).toContain(r.primary);
    expect(r.primary).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { firstClause, splitIntoBuckets } from '../reel-props';

describe('firstClause', () => {
  it('첫 절을 자르고 최대 길이로 트림', () => {
    expect(firstClause('막내 공주가 황금 공을 연못에 빠뜨리자, 개구리가 친구가 되어 함께 지내겠다는 약속을 받고 공을 찾아 줍니다.', 24))
      .toBe('막내 공주가 황금 공을 연못에 빠뜨리자');
  });
  it('짧으면 그대로(마침표 제거)', () => {
    expect(firstClause('약속은 소중한 거야.', 40)).toBe('약속은 소중한 거야');
  });
});
describe('splitIntoBuckets', () => {
  it('n개 버킷에 순서대로 균등 분배(나머지는 앞쪽)', () => {
    expect(splitIntoBuckets([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5], [6, 7]]);
  });
  it('개수<버킷이면 앞부터 채우고 빈 버킷 허용', () => {
    expect(splitIntoBuckets([1, 2], 3)).toEqual([[1], [2], []]);
  });
});

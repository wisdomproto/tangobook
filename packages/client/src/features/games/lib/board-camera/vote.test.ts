import { describe, it, expect } from 'vitest';
import { voteWord, VOTE_WINDOW } from './vote';

describe('voteWord', () => {
  it('한 번 튄 값은 이기지 못한다', () => {
    const steady = Array(6).fill('마');
    expect(voteWord(steady, '파', '마')).toBe('마');
  });

  it('새 낱말이 꾸준하면 넘어간다', () => {
    let hist: string[] = Array(VOTE_WINDOW).fill('마');
    const seen: string[] = [];
    for (let i = 0; i < VOTE_WINDOW; i++) {
      seen.push(voteWord(hist, '무', seen.at(-1) ?? '마'));
      hist = [...hist, '무'].slice(-VOTE_WINDOW);
    }
    expect(seen[0]).toBe('마');
    expect(seen[seen.length - 1]).toBe('무');
  });

  it('창 밖으로 나간 값은 안 센다', () => {
    const old = Array(VOTE_WINDOW).fill('가');
    expect(voteWord([...old, ...Array(VOTE_WINDOW).fill('나')], '나')).toBe('나');
  });

  it('빈 판(빈 문자열)도 하나의 값이다 — 블록을 다 치우면 빈 판으로 돌아가야 한다', () => {
    expect(voteWord(Array(6).fill(''), '')).toBe('');
  });

  it('기록이 덜 찬 시작 순간에는 한 프레임만으로 결과를 노출하지 않는다', () => {
    expect(voteWord([], '손오인식')).toBe('');
    expect(voteWord(['손오인식', '다른값'], '손오인식')).toBe('');
  });

  it('과반수가 없으면 직전의 안정된 결과를 유지한다', () => {
    const noisy = ['마', '마', '손', '파', '손', '가'];
    expect(voteWord(noisy, '다', '마')).toBe('마');
  });

  it('새 값이 네 번 관측되면 안정된 결과를 바꾼다', () => {
    expect(voteWord(['마', '마', '무', '무', '무', '무'], '마', '마')).toBe('무');
  });

  it('빈 판도 네 번 관측된 뒤에만 기존 결과를 지운다', () => {
    expect(voteWord(['마', '마', '', '', '', ''], '마', '마')).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { buildHuntBoard, lookalikesOf } from './letter-lookalikes';

describe('lookalikesOf', () => {
  it('한글 자모의 헷갈리는 짝을 준다', () => {
    expect(lookalikesOf('ㄱ')).toContain('ㅋ');
    expect(lookalikesOf('ㅁ')).toContain('ㅂ');
    expect(lookalikesOf('ㅗ')).toContain('ㅜ');
  });

  it('영어는 대문자 카드에 대문자 방해꾼을 준다 — 판에 소문자만 깔리면 다른 글자로 보인다', () => {
    expect(lookalikesOf('b')).toContain('d');
    expect(lookalikesOf('B')).toContain('D');
    expect(lookalikesOf('B').every((c) => c === c.toUpperCase())).toBe(true);
  });

  it('word family 는 모음·끝소리를 갈아 끼운 것이 곧 혼동 대상이다', () => {
    const at = lookalikesOf('at');
    expect(at).toContain('et'); // 모음 교체
    expect(at).toContain('an'); // 끝소리 교체
    expect(at).not.toContain('at');
  });
});

describe('buildHuntBoard', () => {
  const target = 'ㄱ';

  it('판 크기와 목표 개수를 지킨다', () => {
    const board = buildHuntBoard({ target, others: ['ㄴ', 'ㄷ'], size: 18, targets: 5 });
    expect(board).toHaveLength(18);
    expect(board.filter((c) => c === target)).toHaveLength(5);
  });

  it('방해꾼에 목표 글자가 섞이지 않는다 — 세어야 할 개수가 어긋난다', () => {
    for (let i = 0; i < 30; i++) {
      const board = buildHuntBoard({ target, others: [target, 'ㄴ'], size: 12, targets: 3 });
      expect(board.filter((c) => c === target)).toHaveLength(3);
    }
  });

  it('헷갈리는 짝을 실제로 깐다 — 아무 글자면 찾기가 아니라 훑기가 된다', () => {
    const board = buildHuntBoard({ target, others: [], size: 18, targets: 5 });
    expect(board.some((c) => lookalikesOf(target).includes(c))).toBe(true);
  });

  it('사전에 없는 글자도 빈 칸 없이 채운다', () => {
    const board = buildHuntBoard({ target: '※', others: ['ㄱ'], size: 9, targets: 2 });
    expect(board).toHaveLength(9);
    expect(board.every((c) => c.length > 0)).toBe(true);
  });
});

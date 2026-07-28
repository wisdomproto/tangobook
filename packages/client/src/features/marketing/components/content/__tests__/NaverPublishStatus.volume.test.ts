import { describe, it, expect } from 'vitest';
import { volumeOf } from '../NaverPublishStatus';

describe('volumeOf — 책 제목으로 검색량 찾기', () => {
  it('블로그 제목 앞머리로 책을 찾는다', () => {
    expect(volumeOf('장수풍뎅이 특징과 뿔의 비밀 — 자연관찰 그림책')?.book).toBe('장수풍뎅이');
  });

  // 🔴 회귀: 「강아지풀 …」 글이 책 「강아지」로 잡혔었다(부분문자열 충돌).
  //    긴 제목부터 대조해야 구체적인 쪽이 이긴다.
  it('더 긴 책 제목이 이긴다 — 강아지풀이 강아지로 잡히면 안 된다', () => {
    expect(volumeOf('강아지풀 특징과 비밀 — 자연관찰 그림책')?.book).toBe('강아지풀');
    expect(volumeOf('강아지 그림책 — 특징과 감각의 비밀')?.book).toBe('강아지');
  });

  it('모르는 책이면 null', () => {
    expect(volumeOf('있을 리 없는 제목입니다')).toBeNull();
  });
});

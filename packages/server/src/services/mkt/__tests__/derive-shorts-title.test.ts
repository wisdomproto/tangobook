import { describe, it, expect } from 'vitest';
import { deriveShortsTitle } from '../publish-executor.service.js';

// 쇼츠 제목은 원래 mkt_contents.title 원본("치카치카 쓱쓱, 반짝반짝!")을 그대로 써서
// 검색 키워드가 0이었다(조회수 0~9회). 롱폼 메타에는 키워드가 있는데
// "… | 호리네 생활동화 오디오북" 접미사 때문에 통째로 버려지고 있었다.
// → 접미사만 떼고 키워드는 살린다는 규칙을 테스트로 못박는다.
describe('deriveShortsTitle', () => {
  it('시리즈 접미사를 떼고 #Shorts 를 붙인다', () => {
    expect(
      deriveShortsTitle(
        '치카치카 쓱쓱, 반짝반짝! 🪥✨ | 양치 안 하는 아이를 위한 동화 | 호리네 생활동화 오디오북'
      )
    ).toBe('치카치카 쓱쓱, 반짝반짝! 🪥✨ | 양치 안 하는 아이를 위한 동화 #Shorts');
  });

  it('검색 키워드 구간은 반드시 보존한다', () => {
    const out = deriveShortsTitle(
      '쉬야 쑥, 참 잘했어요! 🚽🌟 | 기저귀 떼기 배변훈련 동화 | 호리네 생활동화 오디오북'
    );
    expect(out).toContain('기저귀 떼기 배변훈련 동화');
    expect(out).not.toContain('오디오북');
  });

  it('선두 번호도 함께 뗀다', () => {
    expect(
      deriveShortsTitle('01. 골고루 먹으면 무지개 힘! | 편식하는 아이 | 호리네 생활동화 오디오북')
    ).toBe('골고루 먹으면 무지개 힘! | 편식하는 아이 #Shorts');
  });

  it('접미사가 없으면 모든 구간을 보존한다', () => {
    expect(deriveShortsTitle('게 🦀 | 옆으로 걷는 집게발 친구')).toBe(
      '게 🦀 | 옆으로 걷는 집게발 친구 #Shorts'
    );
  });

  it('파이프가 없는 단일 제목도 처리한다', () => {
    expect(deriveShortsTitle('라푼젤')).toBe('라푼젤 #Shorts');
  });

  it('이미 #Shorts 가 있으면 중복해서 붙이지 않는다', () => {
    const out = deriveShortsTitle('람포린쿠스를 아나요? 🦖 #Shorts | 자연 관찰 오디오북');
    expect(out.match(/#Shorts/gi)).toHaveLength(1);
  });

  it('구간이 접미사 하나뿐이면 지우지 않는다(빈 제목 방지)', () => {
    expect(deriveShortsTitle('호리네 생활동화 오디오북')).toBe('호리네 생활동화 오디오북 #Shorts');
  });

  it('100자를 넘지 않는다', () => {
    const long = `${'가'.repeat(120)} | 어떤 키워드 | 세계 명작 잠자리 오디오북`;
    expect(deriveShortsTitle(long).length).toBeLessThanOrEqual(100);
  });
});

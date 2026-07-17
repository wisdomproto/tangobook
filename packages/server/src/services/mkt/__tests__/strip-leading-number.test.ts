import { describe, it, expect } from 'vitest';
import { stripLeadingNumber } from '../publish-executor.service.js';

// 호리네 생활동화 제목의 선두 번호("01. ")는 회차 정렬용 내부 표기다.
// 이게 유튜브 제목에 그대로 나간 적이 있어(https://youtu.be/h5Vsn5gX_KA — "01. 골고루 먹으면
// 무지개 힘!") 규칙을 테스트로 못박는다.
describe('stripLeadingNumber', () => {
  it('생활동화 선두 번호를 뗀다', () => {
    expect(stripLeadingNumber('01. 골고루 먹으면 무지개 힘!')).toBe('골고루 먹으면 무지개 힘!');
    expect(stripLeadingNumber('45. 고마워, 자연아!')).toBe('고마워, 자연아!');
  });

  it('번호가 없는 제목은 그대로 둔다', () => {
    expect(stripLeadingNumber('헨젤과 그레텔')).toBe('헨젤과 그레텔');
    expect(stripLeadingNumber('티라노사우루스 렉스')).toBe('티라노사우루스 렉스');
  });

  it('제목 안의 숫자는 건드리지 않는다', () => {
    expect(stripLeadingNumber('아기 돼지 3형제')).toBe('아기 돼지 3형제');
    expect(stripLeadingNumber('101마리 달마시안')).toBe('101마리 달마시안');
  });

  it('선두 번호만 떼고 뒤쪽 숫자·마침표는 남긴다', () => {
    expect(stripLeadingNumber('07. 첨벙첨벙 보글보글!')).toBe('첨벙첨벙 보글보글!');
    expect(stripLeadingNumber('12. 하나 둘, 준비 끝!')).toBe('하나 둘, 준비 끝!');
  });

  it('번호만 있는 제목은 원본을 지킨다(빈 제목 방지)', () => {
    expect(stripLeadingNumber('01. ')).toBe('01. ');
  });

  it('앞뒤 공백을 정리한다', () => {
    expect(stripLeadingNumber('  03.  보글보글 뽀득뽀득!  ')).toBe('보글보글 뽀득뽀득!');
  });
});

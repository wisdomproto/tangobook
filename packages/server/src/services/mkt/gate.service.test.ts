import { describe, it, expect } from 'vitest';
import { isValidGateCode } from './gate.service';

describe('isValidGateCode', () => {
  it('정확히 일치할 때만 true', () => {
    expect(isValidGateCode('8054', '8054')).toBe(true);
  });
  it('공백 트림 후 비교', () => {
    expect(isValidGateCode(' 8054 ', '8054')).toBe(true);
  });
  it('불일치/빈값/미설정은 false', () => {
    expect(isValidGateCode('0000', '8054')).toBe(false);
    expect(isValidGateCode('', '8054')).toBe(false);
    expect(isValidGateCode('8054', '')).toBe(false);
    expect(isValidGateCode(undefined, '8054')).toBe(false);
  });
});

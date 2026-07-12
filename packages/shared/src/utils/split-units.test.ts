import { describe, it, expect } from 'vitest';
import { splitUnits } from './split-units.js';

describe('splitUnits', () => {
  it('zh: 한자 1자씩', () => {
    expect(splitUnits('猫', 'zh')).toEqual(['猫']);
    expect(splitUnits('灰姑娘', 'zh')).toEqual(['灰', '姑', '娘']);
    expect(splitUnits('苹果', 'zh')).toEqual(['苹', '果']);
  });

  it('vi: 성조 붙은 글자를 단일 유닛으로 (NFC)', () => {
    expect(splitUnits('mèo', 'vi')).toEqual(['m', 'è', 'o']);
    expect(splitUnits('táo', 'vi')).toEqual(['t', 'á', 'o']);
    // 확장 글자(ư) + 성조(ớ) 각각 단일 유닛
    expect(splitUnits('bướm', 'vi')).toEqual(['b', 'ư', 'ớ', 'm']);
  });

  it('th: 결합 단위 — 성조/모음이 자음에 붙은 채 한 유닛', () => {
    expect(splitUnits('แมว', 'th')).toEqual(['แ', 'ม', 'ว']);
    // 성조 ่ 가 자음 ก 에 결합 → ก่ 한 유닛 (◌ 로 안 깨짐)
    expect(splitUnits('ไก่', 'th')).toEqual(['ไ', 'ก่']);
    expect(splitUnits('ช้าง', 'th')).toEqual(['ช้', 'า', 'ง']);
  });

  it('vi: 공백 있는 구는 어절 단위 (빈 타일 방지)', () => {
    expect(splitUnits('cây đũa thần', 'vi')).toEqual(['cây', 'đũa', 'thần']);
    expect(splitUnits('quả bí ngô', 'vi')).toEqual(['quả', 'bí', 'ngô']);
    // 공백 없는 단일 단어는 낱자 그대로
    expect(splitUnits('mèo', 'vi')).toEqual(['m', 'è', 'o']);
  });

  it('빈 문자열/공백은 빈 배열', () => {
    expect(splitUnits('', 'zh')).toEqual([]);
    expect(splitUnits('   ', 'vi')).toEqual([]);
  });
});

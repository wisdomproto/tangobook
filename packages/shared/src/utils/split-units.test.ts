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

  it('병음(拼音): 성조 부호는 모음에 합쳐진 채 한 유닛 (NFC) — 성조 축 보존', () => {
    // 병음은 라틴 문자열이라 코드포인트 분해. 🔴 성조 부호(ā á ǎ à)가 **합자(precomposed)**로
    // 남아야 성조가 모음에서 안 떨어진다(vi 선례). combining 마크로 쪼개지면 타일이 깨진다.
    expect(splitUnits('mā', 'zh')).toEqual(['m', 'ā']);
    expect(splitUnits('mǎ', 'zh')).toEqual(['m', 'ǎ']);
    // 성조 글자는 길이 1(합자) — 'a' + combining caron(2 코드포인트)이 아니다.
    expect(splitUnits('mǎ', 'zh')[1]).toBe('ǎ'); // ǎ precomposed
    expect(splitUnits('mǎ', 'zh')[1]!.length).toBe(1);
  });

  it('빈 문자열/공백은 빈 배열', () => {
    expect(splitUnits('', 'zh')).toEqual([]);
    expect(splitUnits('   ', 'vi')).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';

/**
 * 🔴 **칭찬은 UI 언어여야 한다 — 호출부까지 잠근다.**
 *
 * `praiseLang()` 함수만 테스트하던 시절, 정작 **호출부 9곳이 콘텐츠 언어를 넘기고 있었는데도**
 * 테스트가 통과했다(2026-08-11 검수에서 발견: 베트남 아이가 한글을 배우고 한국어 칭찬을 들었다).
 * 함수가 맞는 것과 화면이 그걸 쓰는 것은 다른 문제다 — 그래서 **소스를 정적으로** 검사한다
 * (이 집의 기존 관행: `english-phonics-warm.test.ts`).
 */
const sources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** 칭찬 호출에서 언어를 어떻게 정하는지 — 리터럴·삼항 둘 다 금지(둘 다 실제로 새 나갔다). */
const BAD = [
  /playCorrectSequence\(\{[^}]*language:\s*'(ko|en|vi|zh|th)'/s,
  /playCorrectSequence\(\{[^}]*language:\s*language\s*===/s,
];

describe('칭찬 언어 = UI 언어 (호출부 가드)', () => {
  it('파닉스 어디서도 칭찬 언어를 하드코딩하거나 콘텐츠 언어로 계산하지 않는다', () => {
    const offenders: string[] = [];
    for (const [path, src] of Object.entries(sources)) {
      if (path.includes('.test.')) continue;
      if (!src.includes('playCorrectSequence(')) continue;
      if (BAD.some((re) => re.test(src))) offenders.push(path);
    }
    expect(offenders, `칭찬 언어는 praiseLang() 이어야 한다: ${offenders.join(', ')}`).toEqual([]);
  });

  it('칭찬을 부르는 파일은 praiseLang 을 쓴다', () => {
    const missing: string[] = [];
    for (const [path, src] of Object.entries(sources)) {
      if (path.includes('.test.')) continue;
      // language 를 아예 안 넘기는 호출(전체 pool 폴백)은 허용 — 언어를 정한다면 praiseLang 이어야 한다.
      if (!/playCorrectSequence\(\{[^}]*language:/s.test(src)) continue;
      if (!src.includes('praiseLang')) missing.push(path);
    }
    expect(missing, `praiseLang 미사용: ${missing.join(', ')}`).toEqual([]);
  });
});

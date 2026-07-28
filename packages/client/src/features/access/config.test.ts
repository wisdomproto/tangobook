import { describe, it, expect } from 'vitest';
import { isAlwaysFreePath, PHONICS_ALWAYS_FREE } from './config';

/**
 * 🔴 파닉스는 **획득 채널이라 잠그지 않는다**(2026-07-28 결정). 광고·검색으로 들어온 사람이
 *    가입도 게스트 창 만료도 없이 끝까지 쓸 수 있어야 한다 — 이 규칙이 조용히 뒤집히면
 *    광고비가 벽 앞에서 샌다.
 */
describe('파닉스는 언제나 무료', () => {
  it('결정이 켜져 있다', () => {
    expect(PHONICS_ALWAYS_FREE).toBe(true);
  });

  it('랜딩·한글·영어 모두 잠금 밖', () => {
    for (const p of [
      '/library/phonics',
      '/library/phonics/korean',
      '/library/phonics/korean/kr-h1-u02',
      '/library/phonics/english/en-b1-u01/game-english-block',
    ]) {
      expect(isAlwaysFreePath(p), p).toBe(true);
    }
  });

  it('동화책은 그대로 게이팅 대상', () => {
    for (const p of ['/library', '/library/abc-123', '/games/vocab', '/parent/reports']) {
      expect(isAlwaysFreePath(p), p).toBe(false);
    }
  });
});

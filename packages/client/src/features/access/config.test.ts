import { describe, it, expect } from 'vitest';
import { isAlwaysFreePath, PHONICS_ALWAYS_FREE } from './config';

/**
 * 🔴 파닉스도 **동화책과 같은 규칙**으로 간다(2026-07-29 결정, 07-28 의 "언제나 무료"를 뒤집음).
 *    게스트 30일 / 로그인 한 가지 규칙만 두고, 광고는 가입 자체를 판다.
 *
 * 🔴 이 상수를 끄는 것만으로는 반쪽이다 — 학습 화면(`/library/phonics/{korean,english}/*`)은
 *    AppShell 밖이라 상수와 무관하게 열린다. 라우터에서 `<GuestGate>` 로 감싸야 URL 직행이 막힌다.
 */
describe('파닉스 접근 규칙', () => {
  it('동화책과 같은 규칙 — 따로 열어두지 않는다', () => {
    expect(PHONICS_ALWAYS_FREE).toBe(false);
  });

  it('파닉스 경로도 잠금 대상', () => {
    for (const p of [
      '/library/phonics',
      '/library/phonics/korean',
      '/library/phonics/korean/kr-h1-u02',
      '/library/phonics/english/en-b1-u01/game-english-block',
    ]) {
      expect(isAlwaysFreePath(p), p).toBe(false);
    }
  });

  it('동화책도 그대로 게이팅 대상', () => {
    for (const p of ['/library', '/library/abc-123', '/games/vocab', '/parent/reports']) {
      expect(isAlwaysFreePath(p), p).toBe(false);
    }
  });
});

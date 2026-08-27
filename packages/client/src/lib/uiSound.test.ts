import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 🔴 이 테스트가 지키는 것: **효과음 하나를 파일 하나만 받는다.**
 *    풀 4장을 전부 `preload='auto'` 로 두면 `/sounds/ui/*.mp3` 의
 *    `Cache-Control: max-age=0` 탓에 사본마다 네트워크를 타서, PSI 모바일에서
 *    13종 × 4 = 요청 52건 596KB 가 실제로 잡혔다(고유 용량은 149KB).
 */
describe('uiSound 풀 프리로드', () => {
  beforeEach(() => vi.resetModules());

  it('효과음마다 프리로드하는 오디오는 딱 하나다', async () => {
    const created: Array<{ src: string; preload: string }> = [];
    vi.stubGlobal(
      'Audio',
      class {
        preload = '';
        constructor(public src: string) {
          created.push(this as unknown as { src: string; preload: string });
        }
        load() {}
        play() {
          return Promise.resolve();
        }
        pause() {}
      }
    );

    const { preloadUiSounds } = await import('./uiSound');
    preloadUiSounds();

    expect(created.length).toBeGreaterThan(0);
    const bySrc = new Map<string, number>();
    for (const a of created) {
      if (a.preload === 'auto') bySrc.set(a.src, (bySrc.get(a.src) ?? 0) + 1);
    }
    // 소리 종류만큼만 'auto' 여야 한다 — 풀 크기만큼이면 안 된다.
    expect([...bySrc.values()].every((n) => n === 1)).toBe(true);
    expect(bySrc.size).toBeLessThan(created.length);
  });
});

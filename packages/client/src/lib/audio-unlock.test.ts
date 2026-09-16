import { describe, it, expect, vi } from 'vitest';

/** 모듈 상태(등록 목록·리스너·공용 요소)가 테스트 사이에 새지 않게 매번 새로 읽는다. */
async function freshModule() {
  vi.resetModules();
  return import('./audio-unlock');
}

/**
 * 열렸는지는 **그 요소 자신**에서 본다 — 무음 wav 가 물렸으면 제스처 안에서 `play()` 까지 간 것이다.
 * 🔴 `play` mock 의 호출 수로 세면 안 된다: 프로토타입에 깔린 공용 mock 이라 다른 요소(모듈이
 *    앱 시작 때 만드는 공용 요소)가 열리는 것까지 함께 세어 진다.
 */
function opened(el: HTMLAudioElement): boolean {
  return el.src.startsWith('data:audio/wav');
}

function tap() {
  window.dispatchEvent(new Event('pointerdown'));
}

describe('audio-unlock', () => {
  it('첫 탭에 등록된 요소를 무음으로 열어 둔다', async () => {
    const { registerAudio } = await freshModule();
    const el = new Audio();
    registerAudio(el);

    expect(opened(el)).toBe(false);
    tap();
    expect(opened(el)).toBe(true);
  });

  it('🔴 해금 뒤에 생긴 요소도 다음 탭에 연다 — 게임은 탭이 끝난 뒤에 마운트한다', async () => {
    const { registerAudio } = await freshModule();
    tap(); // 첫 탭은 이 요소가 생기기 전에 지나간다

    const late = new Audio();
    registerAudio(late);
    expect(opened(late)).toBe(false);

    tap();
    expect(opened(late)).toBe(true);
  });

  it('말소리 공용 요소는 앱 시작 때 만들어져 첫 탭에 열린다', async () => {
    const { getSharedAudio } = await freshModule();
    const shared = getSharedAudio();
    tap();
    expect(opened(shared)).toBe(true);
    expect(getSharedAudio()).toBe(shared);
  });

  it('소리를 내는 중인 요소는 건드리지 않는다', async () => {
    const { registerAudio } = await freshModule();
    const el = new Audio();
    Object.defineProperty(el, 'paused', { value: false });
    registerAudio(el);
    tap();
    expect(opened(el)).toBe(false);
  });
});

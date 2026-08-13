import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { resolveSceneFromWord } from './resolve-scene';

/**
 * 파닉스 단원에서 맞힌 낱말 → 예문 장면.
 *
 * 🔴 이 파일은 원래 「파닉스 단원은 뜨지 않는다」를 지키던 가드였다(2026-07-29). 2026-08-12 에
 *    **뒤집혔다** — 그때 오류처럼 보인 건 호리 동화가 뜬 것이 아니라 **나레이션이 0개라 소리 없이
 *    스쳐 지나갔기** 때문이고, 256쪽을 구운 뒤로는 읽어 준다. 낡은 기대를 낮춰 통과시키지 않고
 *    **바뀐 의도**에 맞춰 다시 썼다.
 *
 * 지금 지켜야 할 것은 **순서**다 — ①다른 동화책 → ②그 단원 자체 동화 → ③없으면 null.
 * (①은 미리 받아 둔 책이 있어야 해서 여기선 검증 불가 — `phonics-word-scene.test.ts` 가 맡는다.)
 */
const base = {
  id: 'kr-h1-u01',
  title: '모음',
  pages: [{ pageNumber: 1, text: '아이가 우유를 마셔요', illustrationUrl: 'https://x/p1.png' }],
  key_objects: [{ name: 'child', korean: '아이', pages: [1] }],
} as unknown as Storybook;

describe('장면 리빌', () => {
  it('파닉스 단원 — 다른 책이 없으면 그 단원 자체 동화로 폴백한다', () => {
    const sb = { ...base, type: 'phonics' } as Storybook;
    expect(resolveSceneFromWord('아이', 'ko', sb)?.pageNumber).toBe(1);
  });

  it('파닉스 단원 — 삽화 없는 쪽뿐이면 아무것도 안 띄운다(낱말만 읽는다)', () => {
    const sb = {
      ...base,
      type: 'phonics',
      pages: [{ pageNumber: 1, text: '아이가 우유를 마셔요' }],
    } as unknown as Storybook;
    expect(resolveSceneFromWord('아이', 'ko', sb)).toBeNull();
  });

  it('동화책은 그대로 뜬다', () => {
    const sb = { ...base, type: 'storybook' } as Storybook;
    expect(resolveSceneFromWord('아이', 'ko', sb)).not.toBeNull();
  });
});

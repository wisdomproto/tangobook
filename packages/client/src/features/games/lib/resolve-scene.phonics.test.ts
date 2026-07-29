import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { resolveSceneFromWord } from './resolve-scene';

/**
 * 🔴 파닉스 단원에선 장면 리빌이 뜨면 안 된다 — 학습 도중 동화가 스치면 아이 눈엔 오류다.
 *    한글 나무 삽화가 들어오면서 조건이 저절로 채워졌던 자리라, 가드가 없으면 조용히 되살아난다.
 */
const base = {
  id: 'kr-h1-u01',
  title: '모음',
  pages: [{ pageNumber: 1, text: '아이가 우유를 마셔요', illustrationUrl: 'https://x/p1.png' }],
  key_objects: [{ name: 'child', korean: '아이', pages: [1] }],
} as unknown as Storybook;

describe('장면 리빌', () => {
  it('파닉스 단원은 뜨지 않는다', () => {
    const sb = { ...base, type: 'phonics' } as Storybook;
    expect(resolveSceneFromWord('아이', 'ko', sb)).toBeNull();
  });

  it('동화책은 그대로 뜬다', () => {
    const sb = { ...base, type: 'storybook' } as Storybook;
    expect(resolveSceneFromWord('아이', 'ko', sb)).not.toBeNull();
  });
});

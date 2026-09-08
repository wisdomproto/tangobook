import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildHiddenObjectSceneData } from './hidden-object-data';

const scene = (id: string, names: string[]) => ({
  id,
  sceneImageUrl: `https://x/${id}.jpg`,
  hotspots: names.map((objectName, i) => ({ objectName, x: 0.1 * i, y: 0.1, w: 0.2, h: 0.2 })),
});

const book = (over: Partial<Storybook> = {}): Storybook =>
  ({
    id: 'b1',
    title: '책',
    key_objects: [
      { name: 'Crown', korean: '왕관', ttsUrl: 'https://x/crown.mp3' },
      { name: '공', korean: '공' },
    ],
    keyObjectImages: [{ objectName: 'Crown', success: true, imageUrl: 'https://x/crown.webp' }],
    ...over,
  }) as unknown as Storybook;

describe('숨은그림 데이터', () => {
  it('그림체 자산에서 씬을 읽고 라벨·카드·음원을 붙인다', () => {
    const data = buildHiddenObjectSceneData(
      book({
        styleAssets: { paper: { hiddenObjectScenes: [scene('s1', ['Crown', '공'])] } },
      } as never),
      'paper'
    );
    expect(data?.scenes).toHaveLength(1);
    const [crown, ball] = data!.scenes[0].targets;
    expect(crown.label).toBe('왕관');
    expect(crown.thumbnailUrl).toBe('https://x/crown.webp');
    expect(crown.ttsUrl).toBe('https://x/crown.mp3');
    // 카드 그림이 없어도 낱말은 나온다 — 그림이 없다고 못 찾게 하면 안 된다.
    expect(ball.label).toBe('공');
    expect(ball.thumbnailUrl).toBeUndefined();
  });

  /**
   * 🔴 정본은 그림체 자산이고 top-level 은 활성 그림체 거울이다. 아이가 고른 그림체에 씬이 있으면
   *    그걸 쓰고, 없을 때만 거울로 내려간다 — 반대로 하면 늘 활성 그림체 씬만 나온다.
   */
  it('고른 그림체에 없으면 top-level 거울을 쓴다', () => {
    const data = buildHiddenObjectSceneData(
      book({ hiddenObjectScenes: [scene('mirror', ['Crown', '공'])] } as never),
      'other'
    );
    expect(data?.scenes[0].sceneImageUrl).toBe('https://x/mirror.jpg');
  });

  it('찾을 게 하나뿐인 씬은 내지 않는다 — 한 번 누르면 끝난다', () => {
    const data = buildHiddenObjectSceneData(
      book({ styleAssets: { paper: { hiddenObjectScenes: [scene('s1', ['Crown'])] } } } as never),
      'paper'
    );
    expect(data).toBeNull();
  });

  it('씬이 없으면 null — 카드 자체를 안 낸다', () => {
    expect(buildHiddenObjectSceneData(book(), 'paper')).toBeNull();
    expect(buildHiddenObjectSceneData(undefined, 'paper')).toBeNull();
  });
});

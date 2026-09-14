import { describe, it, expect, vi, afterEach } from 'vitest';
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
  afterEach(() => vi.restoreAllMocks());

  it('sceneKey 를 주면 그 씬만 쓴다', () => {
    // 무작위를 0 으로 고정 — 안 고친 코드는 늘 첫 씬(a)을 골라 이 테스트가 확실히 실패한다.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const data = buildHiddenObjectSceneData(
      book({
        hiddenObjectScenes: [
          { ...scene('a', ['Crown', '공']), id: 'hobj_ho-0001', sceneImageUrl: 'https://x/a.jpg' },
          { ...scene('b', ['Crown', '공']), id: 'hobj_ho-0002', sceneImageUrl: 'https://x/b.jpg' },
        ],
      } as never),
      undefined,
      'ho-0002'
    );
    expect(data?.scenes[0].sceneImageUrl).toBe('https://x/b.jpg');
  });

  it('박스가 둘이어도 이름이 하나면 게임이 아니다', () => {
    const one = scene('s1', ['Crown']);
    const twoBoxes = { ...one, hotspots: [...one.hotspots, ...one.hotspots] };
    expect(
      buildHiddenObjectSceneData(book({ hiddenObjectScenes: [twoBoxes] } as never))
    ).toBeNull();
  });

  it('책의 씬을 읽고 라벨·카드·음원을 붙인다', () => {
    const data = buildHiddenObjectSceneData(
      book({ hiddenObjectScenes: [scene('s1', ['Crown', '공'])] } as never),
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

  it('찾을 게 하나뿐인 씬은 내지 않는다 — 한 번 누르면 끝난다', () => {
    const data = buildHiddenObjectSceneData(
      book({ hiddenObjectScenes: [scene('s1', ['Crown'])] } as never),
      'paper'
    );
    expect(data).toBeNull();
  });

  it('씬이 없으면 null — 카드 자체를 안 낸다', () => {
    expect(buildHiddenObjectSceneData(book(), 'paper')).toBeNull();
    expect(buildHiddenObjectSceneData(undefined, 'paper')).toBeNull();
  });
});

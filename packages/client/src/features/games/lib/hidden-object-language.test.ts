import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildHiddenObjectSceneData } from './hidden-object-data';

const book = {
  id: 'reviewed-story',
  key_objects: [
    {
      name: '나비',
      korean: '나비',
      nameEn: 'Nabi',
      ttsUrl: '/ko-nabi.mp3',
      ttsUrls: { en: '/en-nabi.mp3' },
    },
    { name: '가지', korean: '가지', nameEn: 'branch' },
    { name: '이불', korean: '이불' },
  ],
  keyObjectImages: [{ objectName: '나비', imageUrl: '/cat.webp', success: true }],
  hiddenObjectScenes: [
    {
      id: 'hobj_scene',
      sceneImageUrl: '/approved.webp',
      hotspots: [
        { objectName: '나비', x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { objectName: '가지', x: 0.5, y: 0.1, w: 0.2, h: 0.2 },
        { objectName: '이불', x: 0.1, y: 0.5, w: 0.2, h: 0.2 },
      ],
    },
  ],
} as unknown as Storybook;

describe('hidden object language uses the same reviewed scene and canonical targets', () => {
  it('keeps Korean default labels and narration', () => {
    const data = buildHiddenObjectSceneData(book)!;
    expect(data.scenes[0].targets.map((t) => t.label)).toEqual(['나비', '가지', '이불']);
    expect(data.scenes[0].targets[0].ttsUrl).toBe('/ko-nabi.mp3');
  });
  it('uses contextual English labels and audio while preserving identity and boxes', () => {
    const targets = buildHiddenObjectSceneData(book, undefined, undefined, 'en')!.scenes[0].targets;
    expect(targets.map((t) => t.label)).toEqual(['Nabi', 'branch']);
    expect(targets[0]).toMatchObject({
      objectName: '나비',
      thumbnailUrl: '/cat.webp',
      ttsUrl: '/en-nabi.mp3',
      x: 0.1,
    });
    expect(targets[1].ttsUrl).toBeUndefined();
  });
  it('does not expose a scene with fewer than two translated distinct targets', () => {
    const missing = structuredClone(book);
    missing.key_objects![1].nameEn = '';
    expect(buildHiddenObjectSceneData(missing, undefined, undefined, 'en')).toBeNull();
  });
  it('supports reviewed scene-only objects without adding unrelated vocabulary', () => {
    const sceneOnly = structuredClone(book);
    sceneOnly.key_objects = sceneOnly.key_objects!.slice(0, 1);
    sceneOnly.hiddenObjectScenes![0].hotspots = [
      sceneOnly.hiddenObjectScenes![0].hotspots[0],
      {
        objectName: 'scene-lantern',
        labels: { ko: '등불', en: 'lantern' },
        x: 0.5,
        y: 0.5,
        w: 0.1,
        h: 0.2,
      },
    ];
    expect(buildHiddenObjectSceneData(sceneOnly)!.scenes[0].targets.map((t) => t.label)).toEqual([
      '나비',
      '등불',
    ]);
    const targets = buildHiddenObjectSceneData(sceneOnly, undefined, undefined, 'en')!.scenes[0]
      .targets;
    expect(targets.map((t) => t.label)).toEqual(['Nabi', 'lantern']);
    expect(targets[1].thumbnailUrl).toBeUndefined();
    expect(sceneOnly.key_objects).toHaveLength(1);
    delete sceneOnly.hiddenObjectScenes![0].hotspots[1].labels!.en;
    expect(buildHiddenObjectSceneData(sceneOnly, undefined, undefined, 'en')).toBeNull();
  });
});

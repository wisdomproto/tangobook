import { describe, it, expect } from 'vitest';
import { switchStyleAssets } from './style-assets';
import type { Storybook, HiddenObjectScene } from '@tangobook/shared';

function baseBook(): Storybook {
  return {
    id: 'b1',
    title: 't',
    targetAge: '4-5',
    artStyle: 'styleA',
  } as Storybook;
}

const sceneA: HiddenObjectScene = {
  id: 'hobj_1',
  sceneImageUrl: 'https://r2/a.png',
  hotspots: [{ objectName: 'fox', x: 0.1, y: 0.1, w: 0.2, h: 0.2 }],
};

describe('switchStyleAssets — hiddenObjectScenes', () => {
  it('현재 그림체의 씬을 스냅샷하고, 새 그림체로 전환 시 top-level 을 비운다', () => {
    const book = baseBook();
    book.hiddenObjectScenes = [sceneA];

    switchStyleAssets(book, 'styleB');

    expect(book.artStyle).toBe('styleB');
    expect(book.styleAssets?.styleA?.hiddenObjectScenes).toEqual([sceneA]);
    expect(book.hiddenObjectScenes).toBeUndefined();
  });

  it('왕복 전환 시 원래 씬이 복원된다', () => {
    const book = baseBook();
    book.hiddenObjectScenes = [sceneA];

    switchStyleAssets(book, 'styleB'); // A→B
    switchStyleAssets(book, 'styleA'); // B→A

    expect(book.artStyle).toBe('styleA');
    expect(book.hiddenObjectScenes).toEqual([sceneA]);
  });
});

import { describe, it, expect } from 'vitest';
import { hiddenObjectLabelOf, playableHiddenWords } from './hidden-object.js';

describe('hidden-object rules', () => {
  const keyObjects = [{ name: 'Crown', korean: '왕관' }, { name: 'Ball' }] as never;

  it('label = korean, then name, then objectName', () => {
    expect(hiddenObjectLabelOf(keyObjects, 'Crown')).toBe('왕관');
    expect(hiddenObjectLabelOf(keyObjects, 'Ball')).toBe('Ball');
    expect(hiddenObjectLabelOf(keyObjects, 'Nope')).toBe('Nope');
  });

  it('playable words = distinct objectName in hotspot order', () => {
    const scene = {
      id: 'hobj_ho-0001',
      sceneImageUrl: 'x',
      hotspots: [
        { objectName: 'Wing', x: 0, y: 0, w: 1, h: 1 },
        { objectName: 'Wing', x: 0, y: 0, w: 1, h: 1 },
        { objectName: 'Crown', x: 0, y: 0, w: 1, h: 1 },
      ],
    } as never;
    expect(playableHiddenWords(scene)).toEqual(['Wing', 'Crown']);
  });
});

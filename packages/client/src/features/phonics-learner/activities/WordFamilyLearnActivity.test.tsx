import { expect, it } from 'vitest';
import { splitRow } from './WordFamilyLearnActivity';
import { writeStepRead } from '../lib/english-phonics-units';

it.each(['dragon', 'whisper', 'cherry', 'elephant'])(
  'preserves %s without fabricated spoken chunks in family learning or writing',
  (word) => {
    expect(splitRow(word, 'picture.webp', 'dr_')).toMatchObject({
      cells: [word],
      segs: [],
      wholeWordOnly: true,
    });
    for (let i = 0; i < word.length; i++)
      expect(
        writeStepRead(
          word,
          'dr_',
          Array.from({ length: i + 1 }, (_, j) => j),
          i,
          'en-b4-u04'
        )
      ).toBeNull();
  }
);
it('keeps normal family blending and magic-e contrasts', () => {
  expect(splitRow('ship', undefined, 'sh_').cells).toEqual(['sh', 'ip', 'ship']);
  expect(splitRow('bake', undefined, '_ake').cells).toEqual(['ak', 'ake', 'bake']);
});

import { describe, it, expect } from 'vitest';
import { matchYoutubeRow } from './longform-publish';

const rows = [
  { id: 'r1', video_settings: { artStyle: 'paper-craft', language: 'ko' } },
  { id: 'r2', video_settings: { artStyle: 'pixar-3d', language: 'ko' } },
  { id: 'r3', video_settings: null },
];

describe('matchYoutubeRow', () => {
  it('artStyle+language 동일 행 반환', () => {
    expect(matchYoutubeRow(rows, 'paper-craft', 'ko')?.id).toBe('r1');
    expect(matchYoutubeRow(rows, 'pixar-3d', 'ko')?.id).toBe('r2');
  });

  it('없으면 null (조합 불일치 / video_settings null)', () => {
    expect(matchYoutubeRow(rows, 'paper-craft', 'en')).toBeNull();
    expect(matchYoutubeRow(rows, 'collage', 'ko')).toBeNull();
  });
});

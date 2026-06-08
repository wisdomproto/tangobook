import { describe, it, expect } from 'vitest';
import { formatViews, mergeYoutube } from '../ideas.service';

describe('formatViews', () => {
  it('formats 억 / 만 / raw', () => {
    expect(formatViews(123_000_000)).toBe('1.2억');
    expect(formatViews(45_000)).toBe('4.5만');
    expect(formatViews(1_500)).toBe('1,500');
    expect(formatViews(999)).toBe('999');
  });
});

describe('mergeYoutube', () => {
  it('joins snippet+stats by videoId and sorts by viewCount desc', () => {
    const snippets = [
      {
        videoId: 'a',
        title: 'A',
        channelTitle: 'ca',
        publishedAt: 'p',
        thumbnailUrl: 't',
        description: '',
      },
      {
        videoId: 'b',
        title: 'B',
        channelTitle: 'cb',
        publishedAt: 'p',
        thumbnailUrl: 't',
        description: '',
      },
    ];
    const stats = [
      { videoId: 'a', viewCount: 100, likeCount: 1, commentCount: 0 },
      { videoId: 'b', viewCount: 9000, likeCount: 9, commentCount: 1 },
    ];
    const out = mergeYoutube(snippets, stats, 'kw');
    expect(out.map((v) => v.id)).toEqual(['b', 'a']); // sorted desc
    expect(out[0].views).toBe('9,000');
    expect(out[0].keyword).toBe('kw');
  });
});

import { describe, it, expect } from 'vitest';
import { buildSeoFeedback, SEO_THRESHOLD } from '../seo-feedback';
import type { SeoDetail } from '../seo-scorer';

const d = (over: Partial<SeoDetail>): SeoDetail => ({
  category: 'structure',
  label: '구조',
  score: 5,
  maxScore: 15,
  message: 'm',
  ...over,
});

describe('buildSeoFeedback', () => {
  it('excludes image + title categories and only includes items below the 90% threshold', () => {
    const fb = buildSeoFeedback([
      d({ category: 'image', score: 0, maxScore: 10 }), // excluded (image)
      d({ category: 'title', score: 0, maxScore: 15 }), // excluded (title)
      d({ category: 'structure', score: 5, maxScore: 15 }), // included (5 < 13.5)
      d({ category: 'meta', score: 5, maxScore: 5 }), // excluded (full marks)
    ]);
    expect(fb).toContain('구조');
    expect(fb).not.toContain('이미지');
    // 3 of 4 excluded → exactly one line
    expect(fb!.split('\n')).toHaveLength(1);
  });

  it('returns null when nothing is below threshold', () => {
    expect(buildSeoFeedback([d({ category: 'structure', score: 15, maxScore: 15 })])).toBeNull();
  });

  it('SEO_THRESHOLD is 0.9', () => {
    expect(SEO_THRESHOLD).toBe(0.9);
  });
});

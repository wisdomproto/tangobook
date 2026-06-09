import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (declared before importing the SUT) ---
vi.mock('../../../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from '../../../providers/supabase-admin.provider.js';
import {
  mapInstagramInsights,
  mapFacebookInsights,
  formatNumber,
  resolveMetaCredentials,
} from '../analytics.service.js';

// ─── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats 억 (100M+)', () => {
    expect(formatNumber(123_000_000)).toBe('1.2억');
    expect(formatNumber(100_000_000)).toBe('1.0억');
    expect(formatNumber(2_300_000_000)).toBe('23.0억');
  });

  it('formats 만 (10K+)', () => {
    expect(formatNumber(45_000)).toBe('4.5만');
    expect(formatNumber(10_000)).toBe('1.0만');
    expect(formatNumber(99_999)).toBe('10.0만');
  });

  it('uses toLocaleString for 1000–9999', () => {
    // CF: n >= 1000 → n.toLocaleString(); not exactly '1,234' on all locales,
    // but must be truthy string. Test the return type at least.
    const r = formatNumber(1_234);
    expect(typeof r).toBe('string');
    expect(r).toMatch(/\d/); // contains a digit
  });

  it('returns raw string for < 1000', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
  });
});

// ─── mapInstagramInsights ──────────────────────────────────────────────────────

describe('mapInstagramInsights', () => {
  it('maps IG data with engagement = likes + comments', () => {
    const out = mapInstagramInsights({
      followers_count: 1000,
      media_count: 3,
      media: {
        data: [
          {
            id: '1',
            caption: 'hello world',
            media_type: 'IMAGE',
            like_count: 10,
            comments_count: 5,
          },
          { id: '2', caption: 'post 2', media_type: 'VIDEO', like_count: 20, comments_count: 2 },
        ],
      },
    });

    expect(out.overview.followers).toBe(1000);
    expect(out.overview.postsCount).toBe(3);
    expect(out.contents[0].engagement).toBe(15); // 10 + 5
    expect(out.contents[0].likes).toBe(10);
    expect(out.contents[0].comments).toBe(5);
    expect(out.contents[0].type).toBe('IMAGE');
    expect(out.contents[0].title).toBe('hello world');
    expect(out.contents[1].engagement).toBe(22); // 20 + 2

    // totalEngagement
    expect(out.overview.totalEngagement).toBe(37); // 15 + 22

    // avgEngagementRate = totalEng / count / followers * 100
    const expected = parseFloat(((37 / 2 / 1000) * 100).toFixed(1));
    expect(out.overview.avgEngagementRate).toBe(expected);
  });

  it('handles 0-follower guard (no divide by zero)', () => {
    const out = mapInstagramInsights({
      followers_count: 0,
      media_count: 2,
      media: {
        data: [{ id: '1', caption: 'hi', media_type: 'IMAGE', like_count: 10, comments_count: 5 }],
      },
    });
    expect(out.overview.avgEngagementRate).toBe(0);
    expect(out.overview.totalEngagement).toBe(15);
  });

  it('caps contents at 20 items (.slice(0,20))', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      caption: `post ${i}`,
      media_type: 'IMAGE',
      like_count: 1,
      comments_count: 0,
    }));
    const out = mapInstagramInsights({
      followers_count: 100,
      media_count: 25,
      media: { data: items },
    });
    expect(out.contents.length).toBe(20);
  });

  it('handles missing media gracefully', () => {
    const out = mapInstagramInsights({ followers_count: 500, media_count: 0 });
    expect(out.contents).toEqual([]);
    expect(out.overview.totalEngagement).toBe(0);
    expect(out.overview.avgEngagementRate).toBe(0);
  });

  it('truncates title to 60 chars', () => {
    const longCaption = 'A'.repeat(100);
    const out = mapInstagramInsights({
      followers_count: 100,
      media_count: 1,
      media: {
        data: [
          { id: '1', caption: longCaption, media_type: 'IMAGE', like_count: 1, comments_count: 0 },
        ],
      },
    });
    expect(out.contents[0].title.length).toBe(60);
  });
});

// ─── mapFacebookInsights ──────────────────────────────────────────────────────

describe('mapFacebookInsights', () => {
  it('maps FB page with fan_count and post engagement', () => {
    const out = mapFacebookInsights({
      fan_count: 2000,
      posts: {
        data: [
          {
            id: 'p1',
            message: 'My post',
            created_time: '2024-01-01T00:00:00Z',
            likes: { summary: { total_count: 30 } },
            comments: { summary: { total_count: 5 } },
            shares: { count: 2 },
          },
          {
            id: 'p2',
            message: 'Another post',
            created_time: '2024-01-02T00:00:00Z',
            likes: { summary: { total_count: 10 } },
            comments: { summary: { total_count: 2 } },
          },
        ],
      },
    });

    expect(out.overview.followers).toBe(2000);
    expect(out.overview.postsCount).toBe(2);

    expect(out.contents[0].likes).toBe(30);
    expect(out.contents[0].comments).toBe(5);
    expect(out.contents[0].shares).toBe(2);
    expect(out.contents[0].engagement).toBe(35); // 30 + 5
    expect(out.contents[0].type).toBe('POST');
    expect(out.contents[0].title).toBe('My post');

    expect(out.contents[1].shares).toBe(0); // missing shares → 0
    expect(out.overview.totalEngagement).toBe(47); // 35 + 12
    const expectedRate = parseFloat(((47 / 2 / 2000) * 100).toFixed(1));
    expect(out.overview.avgEngagementRate).toBe(expectedRate);
  });

  it('handles 0-follower guard', () => {
    const out = mapFacebookInsights({
      fan_count: 0,
      posts: {
        data: [
          {
            id: 'p1',
            message: 'x',
            likes: { summary: { total_count: 5 } },
            comments: { summary: { total_count: 1 } },
          },
        ],
      },
    });
    expect(out.overview.avgEngagementRate).toBe(0);
  });

  it('caps at 20 posts', () => {
    const posts = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      message: `msg ${i}`,
      likes: { summary: { total_count: 1 } },
      comments: { summary: { total_count: 0 } },
    }));
    const out = mapFacebookInsights({ fan_count: 100, posts: { data: posts } });
    expect(out.contents.length).toBe(20);
  });

  it('handles missing posts gracefully', () => {
    const out = mapFacebookInsights({ fan_count: 100 });
    expect(out.contents).toEqual([]);
    expect(out.overview.totalEngagement).toBe(0);
  });
});

// ─── resolveMetaCredentials ────────────────────────────────────────────────────

describe('resolveMetaCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fakePage = { id: 'p1', pageAccessToken: 'tok123', instagram: { id: 'ig1' } };

  const fakeAdmin = (data: unknown) => {
    const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    return { from } as unknown as ReturnType<typeof getSupabaseAdmin>;
  };

  it('returns pages array from project row when present', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeAdmin({ meta_credentials: { pages: [fakePage] } })
    );
    const result = await resolveMetaCredentials('proj-1');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].id).toBe('p1');
    // The page access token must NOT appear in logs — we just verify it's accessible
    // server-side (the test is on the server); it must not be echoed in responses.
    expect(result.pages[0].pageAccessToken).toBe('tok123');
  });

  it('throws AppError(501) when meta_credentials is null/absent', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeAdmin({ meta_credentials: null })
    );
    await expect(resolveMetaCredentials('proj-1')).rejects.toMatchObject({
      statusCode: 501,
    });
  });

  it('throws AppError(501) when pages array is empty', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeAdmin({ meta_credentials: { pages: [] } })
    );
    await expect(resolveMetaCredentials('proj-1')).rejects.toMatchObject({
      statusCode: 501,
    });
  });

  it('throws AppError(501) when admin client is null (no Supabase config)', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(resolveMetaCredentials('proj-1')).rejects.toMatchObject({
      statusCode: 501,
    });
  });
});

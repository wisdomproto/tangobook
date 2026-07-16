import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (declared before importing the SUT so the module picks them up) ---
// getSupabaseAdmin → fake admin client whose query chain returns a canned row.
vi.mock('../../../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));
// config → mutable ga4 env fallback so we can exercise row/env/neither branches.
vi.mock('../../../config/index.js', () => ({
  config: { ga4: { propertyId: '', clientEmail: '', privateKey: '' } },
}));

import { getSupabaseAdmin } from '../../../providers/supabase-admin.provider.js';
import { config } from '../../../config/index.js';
import {
  mapOverviewSummary,
  mapDaily,
  mapTraffic,
  mapTopPages,
  mapCountry,
  mapContent,
  extractBookId,
  mapTopBooks,
  resolveGa4Config,
} from '../analytics.service.js';
import type { GA4Report } from '../external/ga4.js';

// Build a GA4Report from compact {d, m} rows (dimensionValues/metricValues = {value}[]).
const ga4Report = (rows: { d: string[]; m: string[] }[]): GA4Report => ({
  dimensionHeaders: [],
  metricHeaders: [],
  rowCount: rows.length,
  rows: rows.map((r) => ({
    dimensionValues: r.d.map((value) => ({ value })),
    metricValues: r.m.map((value) => ({ value })),
  })),
});

// A mutable env config we can rewrite per-test.
const setEnvGa4 = (g: { propertyId?: string; clientEmail?: string; privateKey?: string }) => {
  (config as { ga4: { propertyId: string; clientEmail: string; privateKey: string } }).ga4 = {
    propertyId: g.propertyId ?? '',
    clientEmail: g.clientEmail ?? '',
    privateKey: g.privateKey ?? '',
  };
};

// Fake admin whose .from(...).select(...).eq(...).maybeSingle() resolves to { data }.
const fakeAdmin = (data: unknown) => {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, _select: select, _eq: eq };
};

describe('GA4 row → viewmodel mappers', () => {
  it('mapOverviewSummary reads rows[0] metrics with parse + fallback', () => {
    const out = mapOverviewSummary(
      ga4Report([{ d: [], m: ['1200', '900', '3400', '42.5', '65.2'] }])
    );
    expect(out).toEqual({
      totalSessions: 1200,
      totalUsers: 900,
      totalPageviews: 3400,
      bounceRate: 42.5,
      avgSessionDuration: 65.2,
    });
  });

  it('mapOverviewSummary returns zeros when there are no rows', () => {
    expect(mapOverviewSummary(ga4Report([]))).toEqual({
      totalSessions: 0,
      totalUsers: 0,
      totalPageviews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
    });
  });

  it('mapDaily maps date dimension + views metric', () => {
    const out = mapDaily(
      ga4Report([
        { d: ['20260601'], m: ['10'] },
        { d: ['20260602'], m: ['25'] },
      ])
    );
    expect(out).toEqual([
      { date: '20260601', views: 10 },
      { date: '20260602', views: 25 },
    ]);
  });

  it('mapTraffic computes percentage with a 0-total guard', () => {
    const out = mapTraffic(
      ga4Report([
        { d: ['Organic Search'], m: ['80', '50'] },
        { d: ['Direct'], m: ['20', '15'] },
      ])
    );
    expect(out[0]).toEqual({ channel: 'Organic Search', sessions: 80, users: 50, percentage: 80 });
    expect(out[1]).toEqual({ channel: 'Direct', sessions: 20, users: 15, percentage: 20 });
  });

  it('mapTraffic returns [] (no divide-by-zero) for an empty report', () => {
    expect(mapTraffic(ga4Report([]))).toEqual([]);
  });

  it('mapTraffic falls back channel to "Unknown" when the dimension is missing', () => {
    const report: GA4Report = {
      dimensionHeaders: [],
      metricHeaders: [],
      rowCount: 1,
      rows: [{ dimensionValues: [{}], metricValues: [{ value: '5' }, { value: '3' }] }],
    };
    expect(mapTraffic(report)[0]).toEqual({
      channel: 'Unknown',
      sessions: 5,
      users: 3,
      percentage: 100,
    });
  });

  it('mapTopPages maps path/title/views/users', () => {
    const out = mapTopPages(
      ga4Report([
        { d: ['/home', 'Home'], m: ['300', '210'] },
        { d: ['/about', 'About'], m: ['120', '90'] },
      ])
    );
    expect(out).toEqual([
      { path: '/home', title: 'Home', views: 300, users: 210 },
      { path: '/about', title: 'About', views: 120, users: 90 },
    ]);
  });

  it('mapCountry maps country/sessions/users', () => {
    const out = mapCountry(
      ga4Report([
        { d: ['South Korea'], m: ['500', '400'] },
        { d: ['United States'], m: ['200', '150'] },
      ])
    );
    expect(out).toEqual([
      { country: 'South Korea', sessions: 500, users: 400 },
      { country: 'United States', sessions: 200, users: 150 },
    ]);
  });

  it('mapContent maps path/sessions/avgDuration/bounceRate (float)', () => {
    const out = mapContent(
      ga4Report([
        { d: ['/blog/a'], m: ['150', '88.4', '33.3'] },
        { d: ['/blog/b'], m: ['60', '42.1', '55.5'] },
      ])
    );
    expect(out).toEqual([
      { path: '/blog/a', sessions: 150, avgDuration: 88.4, bounceRate: 33.3 },
      { path: '/blog/b', sessions: 60, avgDuration: 42.1, bounceRate: 55.5 },
    ]);
  });
});

describe('extractBookId (pagePath → storybook id | null)', () => {
  it('extracts id from the book detail path', () => {
    expect(extractBookId('/library/100')).toBe('100');
  });
  it('extracts id from the SEO about path', () => {
    expect(extractBookId('/library/100/about')).toBe('100');
  });
  it('extracts id from a lang-prefixed about path', () => {
    expect(extractBookId('/en/library/100/about')).toBe('100');
    expect(extractBookId('/vi/library/1772510956605/about')).toBe('1772510956605');
  });
  it('extracts id from the viewer path', () => {
    expect(extractBookId('/viewer/200')).toBe('200');
  });
  it('strips a trailing slash and query/hash before matching', () => {
    expect(extractBookId('/library/100/')).toBe('100');
    expect(extractBookId('/library/100?ref=x')).toBe('100');
  });
  it('returns null for non-book paths', () => {
    expect(extractBookId('/')).toBeNull();
    expect(extractBookId('/library')).toBeNull();
    expect(extractBookId('/library/phonics')).toBeNull();
    expect(extractBookId('/library/phonics/korean')).toBeNull();
    expect(extractBookId('/library-master')).toBeNull();
    expect(extractBookId('/games/vocab')).toBeNull();
    expect(extractBookId('')).toBeNull();
  });
});

describe('mapTopBooks (group GA4 page rows by book + split non-book pages)', () => {
  // dims [pagePath, pageTitle], metrics [screenPageViews, activeUsers, sessions, averageSessionDuration]
  const report = ga4Report([
    { d: ['/library/100', '신데렐라 | 탱고북'], m: ['300', '200', '250', '120'] },
    { d: ['/viewer/100', '신데렐라'], m: ['100', '80', '90', '200'] },
    { d: ['/library/100/about', '신데렐라 소개'], m: ['20', '15', '18', '30'] },
    { d: ['/library/200', '인어공주 | 탱고북'], m: ['150', '100', '120', '90'] },
    { d: ['/', '탱고북'], m: ['80', '60', '70', '15'] },
    { d: ['/library', '라이브러리'], m: ['50', '40', '45', '20'] },
  ]);

  it('aggregates all paths of a book (views/users/sessions summed, duration session-weighted)', () => {
    const { books } = mapTopBooks(report);
    expect(books[0].bookId).toBe('100');
    expect(books[0].views).toBe(420); // 300+100+20
    expect(books[0].users).toBe(295); // 200+80+15
    expect(books[0].sessions).toBe(358); // 250+90+18
    // weighted avg = (120*250 + 200*90 + 30*18) / 358 = 48540 / 358
    expect(books[0].avgDuration).toBeCloseTo(48540 / 358, 3);
    // representative title = the highest-view row's title
    expect(books[0].title).toBe('신데렐라 | 탱고북');
  });

  it('sorts books by views desc', () => {
    const { books } = mapTopBooks(report);
    expect(books.map((b) => b.bookId)).toEqual(['100', '200']);
  });

  it('collects non-book paths into others (as GA4TopPage), sorted by views desc', () => {
    const { others } = mapTopBooks(report);
    expect(others.map((o) => o.path)).toEqual(['/', '/library']);
    expect(others[0]).toEqual({ path: '/', title: '탱고북', views: 80, users: 60 });
  });

  it('respects the book/other limits', () => {
    const { books, others } = mapTopBooks(report, 1, 1);
    expect(books).toHaveLength(1);
    expect(books[0].bookId).toBe('100');
    expect(others).toHaveLength(1);
    expect(others[0].path).toBe('/');
  });
});

describe('resolveGa4Config (row → env → 501, \\n un-escape) [R-1/R-6]', () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdmin).mockReset();
    setEnvGa4({}); // clear env fallback
  });

  it('uses the project row ga4_config when present (and un-escapes the PEM \\n)', async () => {
    const admin = fakeAdmin({
      ga4_config: {
        propertyId: '999',
        clientEmail: 'svc@row.iam.gserviceaccount.com',
        // literal "\n" as stored in JSONB
        privateKey: '-----BEGIN-----\\nLINE1\\nLINE2\\n-----END-----',
      },
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(admin as never);

    const cfg = await resolveGa4Config('proj-1');
    expect(cfg.propertyId).toBe('999');
    expect(cfg.clientEmail).toBe('svc@row.iam.gserviceaccount.com');
    // un-escaped to REAL newlines (no literal backslash-n remains)
    expect(cfg.privateKey).toBe('-----BEGIN-----\nLINE1\nLINE2\n-----END-----');
    expect(cfg.privateKey).not.toContain('\\n');
    // queried the right table/column/id
    expect(admin.from).toHaveBeenCalledWith('mkt_projects');
    expect(admin._select).toHaveBeenCalledWith('ga4_config');
    expect(admin._eq).toHaveBeenCalledWith('id', 'proj-1');
  });

  it('falls back to config.ga4 env when the row has no ga4_config', async () => {
    const admin = fakeAdmin({ ga4_config: null });
    vi.mocked(getSupabaseAdmin).mockReturnValue(admin as never);
    setEnvGa4({
      propertyId: 'ENV-PROP',
      clientEmail: 'env@iam.gserviceaccount.com',
      privateKey: '-----BEGIN-----\nENVKEY\n-----END-----',
    });

    const cfg = await resolveGa4Config('proj-2');
    expect(cfg.propertyId).toBe('ENV-PROP');
    expect(cfg.clientEmail).toBe('env@iam.gserviceaccount.com');
    expect(cfg.privateKey).toBe('-----BEGIN-----\nENVKEY\n-----END-----');
  });

  it('falls back to env when the admin client is null (no Supabase configured)', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
    setEnvGa4({
      propertyId: 'ENV-PROP',
      clientEmail: 'env@iam.gserviceaccount.com',
      privateKey: 'ENVKEY',
    });
    const cfg = await resolveGa4Config('proj-3');
    expect(cfg.propertyId).toBe('ENV-PROP');
    expect(cfg.clientEmail).toBe('env@iam.gserviceaccount.com');
    expect(cfg.privateKey).toBe('ENVKEY');
  });

  it('throws AppError(501) when neither the row nor env provides creds', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
    setEnvGa4({}); // nothing
    await expect(resolveGa4Config('proj-4')).rejects.toMatchObject({ statusCode: 501 });
  });

  it('throws AppError(501) when the row is partial (privateKey missing, no env)', async () => {
    const admin = fakeAdmin({
      ga4_config: { propertyId: '123', clientEmail: 'svc@row.iam.gserviceaccount.com' },
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(admin as never);
    setEnvGa4({});
    await expect(resolveGa4Config('proj-5')).rejects.toMatchObject({ statusCode: 501 });
  });
});

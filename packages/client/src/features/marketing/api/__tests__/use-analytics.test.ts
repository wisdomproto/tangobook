/**
 * use-analytics.test.ts
 *
 * Light render-tests covering:
 *  - query key contract (mktKeys.analyticsXxx)
 *  - `enabled` gating (disabled → no fetch)
 *  - data unwrap (success envelope → .data from the hook)
 *  - 501 → null (not connected, NOT an error)
 *  - SEO mutations fire correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useGa4Overview,
  useGa4Traffic,
  useGa4TopPages,
  useGa4Country,
  useGa4Content,
  useSeoAudit,
  useSeoCrawl,
  useSchemaGenerate,
} from '../use-analytics';
import { mktKeys } from '../queries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockFetchSuccess<T>(data: T) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  } as unknown as Response);
}

function mockFetch501() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 501,
    json: async () => ({ success: false, error: 'GA4가 연동되지 않았습니다.' }),
  } as unknown as Response);
}

function mockFetchError(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ success: false, error: '서버 오류' }),
  } as unknown as Response);
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ─── useGa4Overview ───────────────────────────────────────────────────────────

describe('useGa4Overview', () => {
  it('uses the correct mktKeys query key', () => {
    const expected = mktKeys.analyticsOverview('proj-1', '7d');
    expect(expected).toEqual(['mkt', 'analytics', 'overview', 'proj-1', '7d']);
  });

  it('does NOT fetch when enabled=false', () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess({ totalSessions: 100 });
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Overview('proj-1', '7d', false), { wrapper: wrapper(qc) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does NOT fetch when projectId is empty', () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess({});
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Overview('', '7d'), { wrapper: wrapper(qc) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and unwraps data from the { success, data } envelope', async () => {
    const qc = makeQueryClient();
    const mockOverview = {
      period: '7d',
      totalSessions: 500,
      totalUsers: 300,
      totalPageviews: 1200,
      bounceRate: 42,
      avgSessionDuration: 120,
      dailyPageviews: [],
    };
    globalThis.fetch = mockFetchSuccess(mockOverview);

    const { result } = renderHook(() => useGa4Overview('proj-1', '7d', true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ totalSessions: 500 });
  });

  it('resolves to null (not an error) when server returns 501', async () => {
    const qc = makeQueryClient();
    globalThis.fetch = mockFetch501();

    const { result } = renderHook(() => useGa4Overview('proj-1', '7d', true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // 501 → null sentinel, not an error
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('enters error state on non-501 server errors', async () => {
    const qc = makeQueryClient();
    globalThis.fetch = mockFetchError(500);

    const { result } = renderHook(() => useGa4Overview('proj-1', '7d', true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('POSTs to /api/mkt/analytics/overview with { projectId, period }', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess({ totalSessions: 10, dailyPageviews: [] });
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Overview('proj-abc', '30d', true), { wrapper: wrapper(qc) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/analytics/overview');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body) as { projectId: string; period: string };
    expect(body).toEqual({ projectId: 'proj-abc', period: '30d' });
  });
});

// ─── useGa4Traffic ────────────────────────────────────────────────────────────

describe('useGa4Traffic', () => {
  it('uses the correct mktKeys query key', () => {
    expect(mktKeys.analyticsTraffic('p', '30d')).toEqual([
      'mkt',
      'analytics',
      'traffic',
      'p',
      '30d',
    ]);
  });

  it('POSTs to /api/mkt/analytics/traffic', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess([
      { channel: 'Organic', sessions: 100, users: 80, percentage: 60 },
    ]);
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Traffic('proj-1', '30d', true), { wrapper: wrapper(qc) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/analytics/traffic');
  });

  it('resolves null on 501 without error', async () => {
    const qc = makeQueryClient();
    globalThis.fetch = mockFetch501();

    const { result } = renderHook(() => useGa4Traffic('proj-1', '30d', true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});

// ─── useGa4TopPages ───────────────────────────────────────────────────────────

describe('useGa4TopPages', () => {
  it('uses the correct mktKeys query key', () => {
    expect(mktKeys.analyticsTopPages('p', '7d')).toEqual([
      'mkt',
      'analytics',
      'top-pages',
      'p',
      '7d',
    ]);
  });

  it('POSTs to /api/mkt/analytics/top-pages', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess([{ path: '/blog', title: 'Blog', views: 500, users: 300 }]);
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4TopPages('proj-1', '30d', true), { wrapper: wrapper(qc) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/analytics/top-pages');
  });
});

// ─── useGa4Country ────────────────────────────────────────────────────────────

describe('useGa4Country', () => {
  it('uses the correct mktKeys query key', () => {
    expect(mktKeys.analyticsCountry('p', '30d')).toEqual([
      'mkt',
      'analytics',
      'country',
      'p',
      '30d',
    ]);
  });

  it('POSTs to /api/mkt/analytics/country-traffic', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess([{ country: 'South Korea', sessions: 200, users: 150 }]);
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Country('proj-1', '30d', true), { wrapper: wrapper(qc) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/analytics/country-traffic');
  });
});

// ─── useGa4Content ────────────────────────────────────────────────────────────

describe('useGa4Content', () => {
  it('uses the correct mktKeys query key', () => {
    expect(mktKeys.analyticsContent('p', '30d')).toEqual([
      'mkt',
      'analytics',
      'content',
      'p',
      '30d',
    ]);
  });

  it('POSTs to /api/mkt/analytics/content-performance', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess([
      { path: '/page', sessions: 50, avgDuration: 120, bounceRate: 40 },
    ]);
    globalThis.fetch = fetchMock;

    renderHook(() => useGa4Content('proj-1', '30d', true), { wrapper: wrapper(qc) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/analytics/content-performance');
  });

  it('resolves null on 501 without error', async () => {
    const qc = makeQueryClient();
    globalThis.fetch = mockFetch501();

    const { result } = renderHook(() => useGa4Content('proj-1', '30d', true), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});

// ─── SEO mutations ────────────────────────────────────────────────────────────

describe('useSeoAudit', () => {
  it('POSTs { url } to /api/mkt/seo/audit and returns the result', async () => {
    const qc = makeQueryClient();
    const mockResult = {
      url: 'https://example.com',
      title: 'Test',
      metaDescription: 'Desc',
      scores: { google: 80, naver: 70, geo: 60, tech: 90 },
      issues: [],
      meta: {},
    };
    const fetchMock = mockFetchSuccess(mockResult);
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useSeoAudit(), { wrapper: wrapper(qc) });
    await act(async () => {
      result.current.mutate('https://example.com');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/seo/audit');
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://example.com' });
    expect(result.current.data).toMatchObject({ scores: { google: 80 } });
  });
});

describe('useSeoCrawl', () => {
  it('POSTs { url } to /api/mkt/seo/crawl', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess({ text: 'page text content', analysis: {} });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useSeoCrawl(), { wrapper: wrapper(qc) });
    await act(async () => {
      result.current.mutate('https://example.com/page');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/seo/crawl');
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://example.com/page' });
  });
});

describe('useSchemaGenerate', () => {
  it('POSTs { content, schemaType, language? } to /api/mkt/seo/schema-generate', async () => {
    const qc = makeQueryClient();
    const fetchMock = mockFetchSuccess({ schema: '{"@type":"Article"}' });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useSchemaGenerate(), { wrapper: wrapper(qc) });
    await act(async () => {
      result.current.mutate({ content: 'Hello world', schemaType: 'Article', language: 'ko' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; headers: Record<string, string> },
    ];
    expect(url).toBe('/api/mkt/seo/schema-generate');
    const body = JSON.parse(init.body as string);
    expect(body.schemaType).toBe('Article');
    expect(body.language).toBe('ko');
    expect(result.current.data).toMatchObject({ schema: '{"@type":"Article"}' });
  });
});

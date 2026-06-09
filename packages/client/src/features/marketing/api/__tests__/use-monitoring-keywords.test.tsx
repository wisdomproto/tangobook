import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock the supabase-direct lane (../supabase) ──────────────────────────────
// getCurrentUserId() → 'u1' (deterministic) so the test can assert the user_id
// stamp on every insert (the single-owner RLS invariant for mkt_monitoring_keywords).
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
  getCurrentUserId: vi.fn().mockResolvedValue('u1'),
}));

// Import AFTER the mock is registered.
import { supabase, getCurrentUserId } from '../supabase';
import {
  useMonitoringKeywords,
  useAddMonitoringKeyword,
  useRemoveMonitoringKeyword,
} from '../use-monitoring-keywords';
import { mktKeys } from '../queries';
import type { MonitoringKeyword } from '../../types/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockFrom = vi.mocked(supabase.from);

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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('use-monitoring-keywords', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(getCurrentUserId).mockResolvedValue('u1');
  });

  // ─── useAddMonitoringKeyword — RLS user_id stamp ────────────────────────────

  it('stamps user_id from getCurrentUserId on insert (RLS invariant)', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);

    const { result } = renderHook(() => useAddMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ projectId: 'p1', keyword: 'k' });
    });

    expect(mockFrom).toHaveBeenCalledWith('mkt_monitoring_keywords');
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    // THE invariant this chunk must prove: every insert carries the owner stamp.
    expect(row.user_id).toBe('u1');
    expect(row.project_id).toBe('p1');
    expect(row.keyword).toBe('k');
    expect(row.search_engine).toBe('naver'); // default
    expect(row.is_golden).toBe(false);
  });

  it('honors an explicit searchEngine override', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);

    const { result } = renderHook(() => useAddMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ projectId: 'p1', keyword: 'k', searchEngine: 'google' });
    });

    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.search_engine).toBe('google');
    expect(row.user_id).toBe('u1');
  });

  it('swallows the unique-violation (23505) as a no-op success', async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    mockFrom.mockReturnValue({ insert: insertMock } as any);

    const { result } = renderHook(() => useAddMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ projectId: 'p1', keyword: 'dup' });
    });

    // Does not throw → mutation resolved (not rejected).
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('throws on a non-duplicate insert error', async () => {
    const insertMock = vi
      .fn()
      .mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });
    mockFrom.mockReturnValue({ insert: insertMock } as any);

    const { result } = renderHook(() => useAddMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await expect(result.current.mutateAsync({ projectId: 'p1', keyword: 'k' })).rejects.toThrow(
        'permission denied'
      );
    });
  });

  it('invalidates the monitoringKeywords query on success', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ projectId: 'p1', keyword: 'k' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.monitoringKeywords('p1'),
    });
  });

  // ─── useMonitoringKeywords — list query ─────────────────────────────────────

  it('selects/eq/orders and unwraps the keyword list', async () => {
    const rows: MonitoringKeyword[] = [
      {
        id: 'kw1',
        user_id: 'u1',
        project_id: 'p1',
        keyword: 'k',
        search_engine: 'naver',
        is_golden: false,
        category: null,
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
    ];
    const orderMock = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock } as any);

    const { result } = renderHook(() => useMonitoringKeywords('p1'), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('mkt_monitoring_keywords');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('project_id', 'p1');
    expect(orderMock).toHaveBeenCalledWith('sort_order');
    expect(result.current.data).toEqual(rows);
  });

  // ─── useRemoveMonitoringKeyword — delete ────────────────────────────────────

  it('deletes by id and invalidates', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ delete: deleteMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveMonitoringKeyword(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'kw1', projectId: 'p1' });
    });

    expect(mockFrom).toHaveBeenCalledWith('mkt_monitoring_keywords');
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'kw1');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.monitoringKeywords('p1'),
    });
  });
});

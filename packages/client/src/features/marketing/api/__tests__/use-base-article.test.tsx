import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock supabase ────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-test-id' } },
      }),
    },
  },
}));

// Import AFTER mock is registered
import { supabase } from '@/lib/supabase';
import { useUpsertBaseArticle } from '../use-base-article';
import { mktKeys } from '../queries';

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useUpsertBaseArticle', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts a new base article when none exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'mkt_base_articles') throw new Error('unexpected table');
      return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        insert: insertMock,
      } as any;
    });
    const { result } = renderHook(() => useUpsertBaseArticle(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({
        contentId: 'c-1',
        data: { body: '<p>hi</p>', word_count: 1 },
      });
    });
    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.content_id).toBe('c-1');
    expect(inserted.user_id).toBe('user-test-id');
    expect(inserted.body).toBe('<p>hi</p>');
  });

  it('updates the existing row when one exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'ba-1' }, error: null });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqUpdate });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      update: updateMock,
    } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertBaseArticle(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ contentId: 'c-1', data: { word_count: 5 } });
    });
    expect(updateMock).toHaveBeenCalled();
    expect(eqUpdate).toHaveBeenCalledWith('content_id', 'c-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });
});

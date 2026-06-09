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
import { useCreateThreadsContent, useSetThreadsCards } from '../use-threads-contents';
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

describe('useCreateThreadsContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts thread_type:single + user_id and returns the new id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useCreateThreadsContent(), {
      wrapper: wrapper(queryClient),
    });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({ contentId: 'c-1' });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.content_id).toBe('c-1');
    expect(row.thread_type).toBe('single');
    expect(row.status).toBe('draft');
    expect(row.user_id).toBe('user-test-id');
    expect(typeof newId).toBe('string');
    expect(row.id).toBe(newId);
  });
});

describe('useSetThreadsCards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('deletes all then bulk-inserts and invalidates', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const cards = [
      {
        id: 'k1',
        threads_content_id: 'th-1',
        user_id: 'user-test-id',
        text_content: 'hello',
        media_url: null,
        media_type: null,
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
    ] as any;
    const { result } = renderHook(() => useSetThreadsCards(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ threadsContentId: 'th-1', contentId: 'c-1', cards });
    });
    expect(eqDelete).toHaveBeenCalledWith('threads_content_id', 'th-1');
    expect(insertMock).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });

  it('skips insert when cards is empty', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn();
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const { result } = renderHook(() => useSetThreadsCards(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ threadsContentId: 'th-1', contentId: 'c-1', cards: [] });
    });
    expect(eqDelete).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });
});

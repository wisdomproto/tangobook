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
import { useCreateBlogContent, useSetBlogCards } from '../use-blog-contents';
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

describe('useCreateBlogContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts with channel + user_id and returns the new id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useCreateBlogContent(), { wrapper: wrapper(queryClient) });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({ contentId: 'c-1', channel: 'naver_blog' });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.content_id).toBe('c-1');
    expect(row.channel).toBe('naver_blog');
    expect(row.user_id).toBe('user-test-id');
    expect(typeof newId).toBe('string');
    expect(row.id).toBe(newId);
  });
});

describe('useSetBlogCards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('deletes all then bulk-inserts', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const cards = [
      {
        id: 'k1',
        blog_content_id: 'b-1',
        card_type: 'text',
        content: {},
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
    ] as any;
    const { result } = renderHook(() => useSetBlogCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ blogContentId: 'b-1', contentId: 'c-1', cards });
    });
    expect(eqDelete).toHaveBeenCalledWith('blog_content_id', 'b-1');
    expect(insertMock).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });

  it('skips insert when cards is empty', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn();
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const { result } = renderHook(() => useSetBlogCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ blogContentId: 'b-1', contentId: 'c-1', cards: [] });
    });
    expect(eqDelete).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });
});

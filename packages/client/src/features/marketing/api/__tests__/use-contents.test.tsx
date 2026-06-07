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
import { useUpdateContent } from '../use-contents';
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

describe('useUpdateContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('updates a content row and invalidates content + contents queries', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContent(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'c-1',
        projectId: 'p-1',
        updates: { confirmed: true },
      });
    });

    expect(updateMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'c-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });

  it('also invalidates the contents list for the project', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContent(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'c-1',
        projectId: 'p-1',
        updates: { topic: 'new topic' },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.contents('p-1') });
  });
});

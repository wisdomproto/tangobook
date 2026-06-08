import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  },
}));
import { supabase } from '@/lib/supabase';
import { useAddSavedKeyword, useRemoveSavedKeyword } from '../use-saved-keywords';

const mockFrom = vi.mocked(supabase.from);

function qc() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrap(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useAddSavedKeyword', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = qc();
    vi.clearAllMocks();
  });

  it('appends the keyword and writes saved_keywords via update', async () => {
    // seed the project cache so the hook can read existing saved_keywords
    client.setQueryData(['mkt', 'project', 'p1'], {
      id: 'p1',
      saved_keywords: [{ keyword: 'old' }],
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);

    const { result } = renderHook(() => useAddSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync({
        keyword: 'new',
        category: '🏆 황금 키워드',
        priority: 'high',
      });
    });

    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['old', 'new']);
    expect(eqMock).toHaveBeenCalledWith('id', 'p1');
  });

  it('does not duplicate an already-saved keyword', async () => {
    client.setQueryData(['mkt', 'project', 'p1'], {
      id: 'p1',
      saved_keywords: [{ keyword: 'dup' }],
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);

    const { result } = renderHook(() => useAddSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync({ keyword: 'dup', priority: 'low' });
    });

    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['dup']); // unchanged
  });
});

describe('useRemoveSavedKeyword', () => {
  it('filters the keyword out and writes the rest', async () => {
    const client = qc();
    client.setQueryData(['mkt', 'project', 'p1'], {
      id: 'p1',
      saved_keywords: [{ keyword: 'a' }, { keyword: 'b' }],
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);

    const { result } = renderHook(() => useRemoveSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync('a');
    });

    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['b']);
  });
});

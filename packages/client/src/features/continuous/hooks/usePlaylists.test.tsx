/**
 * usePlaylists hooks — list/create/delete against Supabase `playlists` table.
 * Supabase is mocked; we assert the right table/columns are hit and that
 * create/delete invalidate the list query.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';

// ---- mocks ----
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const mockAccount = { id: 'acc-1' };
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ account: mockAccount }),
}));

import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from './usePlaylists';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    Wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePlaylists (list)', () => {
  it('reads own rows and maps snake_case → camelCase', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'p1',
          account_id: 'acc-1',
          name: '밤 세트',
          book_ids: ['b1', 'b2'],
          language: 'ko',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-01T00:00:00Z',
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => usePlaylists(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockFrom).toHaveBeenCalledWith('playlists');
    expect(mockEq).toHaveBeenCalledWith('account_id', 'acc-1');
    expect(result.current.data).toEqual([
      {
        id: 'p1',
        accountId: 'acc-1',
        name: '밤 세트',
        bookIds: ['b1', 'b2'],
        language: 'ko',
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      },
    ]);
  });
});

describe('useCreatePlaylist', () => {
  it('inserts a row and invalidates the list', async () => {
    // list query (initial)
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    // insert chain: from().insert().select().single()
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'p2',
        account_id: 'acc-1',
        name: '새 세트',
        book_ids: ['b1'],
        language: 'ko',
        created_at: 'now',
        updated_at: 'now',
      },
      error: null,
    });
    mockSelect.mockImplementation(() => ({ eq: mockEq, single }));
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });

    const { qc, Wrapper } = wrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreatePlaylist(), { wrapper: Wrapper });

    await result.current.mutateAsync({
      accountId: 'acc-1',
      name: '새 세트',
      bookIds: ['b1'],
      language: 'ko',
    });

    expect(mockFrom).toHaveBeenCalledWith('playlists');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: 'acc-1',
        name: '새 세트',
        book_ids: ['b1'],
        language: 'ko',
      })
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['playlists', 'acc-1'] })
      )
    );
  });
});

describe('useDeletePlaylist', () => {
  it('deletes by id and invalidates the list', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: eqDelete });
    mockFrom.mockReturnValue({ delete: mockDelete });

    const { qc, Wrapper } = wrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeletePlaylist(), { wrapper: Wrapper });

    await result.current.mutateAsync('p1');

    expect(mockFrom).toHaveBeenCalledWith('playlists');
    expect(eqDelete).toHaveBeenCalledWith('id', 'p1');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['playlists', 'acc-1'] })
      )
    );
  });
});

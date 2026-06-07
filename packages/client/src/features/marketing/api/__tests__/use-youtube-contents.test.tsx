import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock supabase (api/supabase.ts re-exports @/lib/supabase) ─────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-test-id' } } }),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import {
  useCreateYoutubeContent,
  useSetYoutubeCards,
  useAddYoutubeCard,
} from '../use-youtube-contents';
import { mktKeys } from '../queries';

const mockFrom = vi.mocked(supabase.from);

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCreateYoutubeContent', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts target_duration:mid + user_id and returns the new id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useCreateYoutubeContent(), {
      wrapper: wrapper(queryClient),
    });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({ contentId: 'c-1' });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.content_id).toBe('c-1');
    expect(row.target_duration).toBe('mid');
    expect(row.status).toBe('draft');
    expect(row.user_id).toBe('user-test-id');
    expect(typeof newId).toBe('string');
    expect(row.id).toBe(newId);
  });
});

describe('useSetYoutubeCards', () => {
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
        user_id: 'user-test-id',
        youtube_content_id: 'yt-1',
        section_type: 'hook',
        narration_text: 'hi',
        screen_direction: '',
        subtitle_text: null,
        image_url: null,
        image_prompt: 'p',
        video_prompt: 'v',
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
    ] as any;
    const { result } = renderHook(() => useSetYoutubeCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ youtubeContentId: 'yt-1', contentId: 'c-1', cards });
    });
    expect(eqDelete).toHaveBeenCalledWith('youtube_content_id', 'yt-1');
    expect(insertMock).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });

  it('skips insert when cards is empty', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn();
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const { result } = renderHook(() => useSetYoutubeCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ youtubeContentId: 'yt-1', contentId: 'c-1', cards: [] });
    });
    expect(eqDelete).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('useAddYoutubeCard', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts a blank card with user_id + section_type:main and returns the id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useAddYoutubeCard(), { wrapper: wrapper(queryClient) });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({
        youtubeContentId: 'yt-1',
        contentId: 'c-1',
        sortOrder: 3,
      });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.youtube_content_id).toBe('yt-1');
    expect(row.section_type).toBe('main');
    expect(row.sort_order).toBe(3);
    expect(row.user_id).toBe('user-test-id');
    expect(row.id).toBe(newId);
  });
});

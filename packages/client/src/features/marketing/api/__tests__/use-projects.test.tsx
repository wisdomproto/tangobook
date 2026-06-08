import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock supabase ────────────────────────────────────────────────────────────
// vi.mock is hoisted — do NOT reference top-level variables inside the factory.

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
import { useProjects, useCreateProject, useUpdateProject } from '../use-projects';
import { mktKeys } from '../queries';
import type { Project } from '../../types/database';

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

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    user_id: 'user-test-id',
    name: '테스트 프로젝트',
    description: null,
    cover_image_url: null,
    industry: null,
    brand_name: null,
    brand_description: null,
    target_audience: null,
    usp: null,
    brand_tone: null,
    banned_keywords: null,
    brand_logo_url: null,
    marketer_name: null,
    marketer_expertise: null,
    marketer_style: null,
    marketer_phrases: null,
    sns_goal: null,
    blog_tone_prompt: null,
    blog_image_style_prompt: null,
    instagram_tone_prompt: null,
    instagram_image_style_prompt: null,
    threads_tone_prompt: null,
    youtube_tone_prompt: null,
    youtube_image_style_prompt: null,
    ai_model_settings: null,
    writing_guide_global: null,
    writing_guide_blog: null,
    writing_guide_instagram: null,
    writing_guide_threads: null,
    writing_guide_youtube: null,
    api_keys: null,
    target_languages: [],
    saved_keywords: null,
    reference_files: null,
    bgm_files: null,
    reference_summary: null,
    funnel_config: null,
    ga4_config: null,
    imported_strategy: null,
    wp_credentials: null,
    meta_credentials: null,
    published_site: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useProjects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    // Re-configure auth mock after clearAllMocks
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('returns projects from supabase', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: MOCK_PROJECTS, error: null }),
      }),
    } as any);

    const { result } = renderHook(() => useProjects(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_PROJECTS);
  });

  it('throws when supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    } as any);

    const { result } = renderHook(() => useProjects(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain('DB error');
  });
});

describe('useCreateProject', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
    // Pre-seed project list so sort_order is deterministic
    queryClient.setQueryData(mktKeys.projects(), []);
  });

  it('inserts a new project and invalidates the projects query', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: '새 프로젝트' });
    });

    expect(insertMock).toHaveBeenCalledOnce();
    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.name).toBe('새 프로젝트');
    expect(inserted.user_id).toBe('user-test-id');
    expect(inserted.sort_order).toBe(0);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.projects(),
    });
  });

  it('throws if supabase insert fails', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'insert error' } }),
    } as any);

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: wrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: 'fail' });
      })
    ).rejects.toThrow('insert error');
  });
});

describe('useUpdateProject', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('updates a project and invalidates queries', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as any);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'proj-1',
        updates: { name: '변경된 이름' },
      });
    });

    expect(eqMock).toHaveBeenCalledWith('id', 'proj-1');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.projects(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.project('proj-1'),
    });
  });
});

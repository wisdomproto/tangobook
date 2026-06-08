import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys, fetchProjects, fetchProject } from './queries';
import { generateId } from '../lib/utils';
import type { Project } from '../types/database';

// ─── Read Queries ────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: mktKeys.projects(),
    queryFn: fetchProjects,
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: mktKeys.project(id ?? ''),
    queryFn: () => fetchProject(id!),
    enabled: Boolean(id),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');

      // Determine sort_order from existing projects count
      const existing = queryClient.getQueryData<Project[]>(mktKeys.projects());
      const sortOrder = existing?.length ?? 0;

      const now = new Date().toISOString();
      const newProject: Omit<Project, 'wp_credentials' | 'meta_credentials' | 'published_site'> & {
        wp_credentials: null;
        meta_credentials: null;
        published_site: null;
      } = {
        id: generateId(),
        user_id: user.id,
        name: data.name,
        description: data.description ?? null,
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
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase
        .from('mkt_projects')
        .insert(newProject as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return newProject as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mktKeys.projects() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const updatedData = { ...updates, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('mkt_projects')
        .update(updatedData as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
      return { id, updates: updatedData };
    },
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.projects() });
      queryClient.invalidateQueries({ queryKey: mktKeys.project(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mkt_projects').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.projects() });
      queryClient.removeQueries({ queryKey: mktKeys.project(id) });
    },
  });
}

import type { Storybook } from '@tangobook/shared';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { loadApprovals } from './content-pipeline/approval-store.js';

export type MarketingSourceState = 'approved' | 'unapproved' | 'archived';

export interface StorybookSourceSnapshot {
  title: string;
  category: string | null;
  coverImageUrl: string | null;
  languages: string[];
  sourceUpdatedAt: string | null;
  payload: {
    artStyle: string | null;
    readingLevel: string | null;
    pageCount: number;
    isPublic: boolean;
    titleTranslations: Record<string, string>;
    coversByLanguage: Record<string, string>;
  };
}

interface MarketingProject {
  id: string;
  user_id: string;
}

function uniqueLanguages(storybook: Storybook): string[] {
  const languages = new Set<string>(['ko']);
  for (const language of storybook.languages ?? []) languages.add(language);
  for (const language of Object.keys(storybook.titleTranslations ?? {})) languages.add(language);
  for (const page of storybook.pages ?? []) {
    for (const language of Object.keys(page.translations ?? {})) languages.add(language);
  }
  return [...languages].sort((a, b) => (a === 'ko' ? -1 : b === 'ko' ? 1 : a.localeCompare(b)));
}

export function buildStorybookSourceSnapshot(storybook: Storybook): StorybookSourceSnapshot {
  const coverImageUrl =
    storybook.coverImage ??
    storybook.coverImages?.find((cover) => Boolean(cover.imageUrl))?.imageUrl ??
    null;
  return {
    title: storybook.title?.trim() || String(storybook.id),
    category: storybook.category?.trim() || null,
    coverImageUrl,
    languages: uniqueLanguages(storybook),
    sourceUpdatedAt: storybook.updatedAt ?? storybook.createdAt ?? null,
    payload: {
      artStyle: storybook.artStyle || null,
      readingLevel: storybook.readingLevel || null,
      pageCount: storybook.pages?.length ?? 0,
      isPublic: storybook.isPublic !== false,
      titleTranslations: storybook.titleTranslations ?? {},
      coversByLanguage: storybook.primaryCoverByLang ?? {},
    },
  };
}

async function resolveMarketingProject(): Promise<MarketingProject | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  let query = supabase.from('mkt_projects').select('id, user_id');
  query = config.mkt.projectId
    ? query.eq('id', config.mkt.projectId)
    : query.eq('name', config.mkt.projectName);
  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new AppError(502, `마케팅 프로젝트 조회 실패: ${error.message}`);
  if (!data) {
    throw new AppError(
      409,
      config.mkt.projectId
        ? `마케팅 프로젝트를 찾을 수 없습니다: ${config.mkt.projectId}`
        : `마케팅 프로젝트를 찾을 수 없습니다: ${config.mkt.projectName}`
    );
  }
  return data as MarketingProject;
}

export async function syncStorybookMarketingSource(
  storybook: Storybook,
  sourceState: MarketingSourceState = 'approved'
): Promise<{ synced: boolean; sourceId?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { synced: false };
  const project = await resolveMarketingProject();
  if (!project) return { synced: false };

  const snapshot = buildStorybookSourceSnapshot(storybook);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('mkt_content_sources')
    .upsert(
      {
        user_id: project.user_id,
        project_id: project.id,
        source_type: 'storybook',
        source_id: String(storybook.id),
        source_state: sourceState,
        title: snapshot.title,
        category: snapshot.category,
        cover_image_url: snapshot.coverImageUrl,
        languages: snapshot.languages,
        source_snapshot: snapshot.payload,
        source_updated_at: snapshot.sourceUpdatedAt,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: 'project_id,source_type,source_id' }
    )
    .select('id')
    .single();
  if (error) throw new AppError(502, `마케팅 책 원본 동기화 실패: ${error.message}`);
  return { synced: true, sourceId: data.id as string };
}

export async function syncStorybookMarketingSourceIfApproved(
  storybook: Storybook
): Promise<{ synced: boolean; sourceId?: string }> {
  const approvals = await loadApprovals();
  if (!approvals[String(storybook.id)]) return { synced: false };
  return syncStorybookMarketingSource(storybook, 'approved');
}

export async function updateStorybookMarketingSourceState(
  storybookId: string,
  sourceState: Exclude<MarketingSourceState, 'approved'>
): Promise<{ updated: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { updated: false };
  const project = await resolveMarketingProject();
  if (!project) return { updated: false };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('mkt_content_sources')
    .update({ source_state: sourceState, last_synced_at: now, updated_at: now })
    .eq('project_id', project.id)
    .eq('source_type', 'storybook')
    .eq('source_id', storybookId);
  if (error) throw new AppError(502, `마케팅 책 원본 상태 변경 실패: ${error.message}`);
  return { updated: true };
}

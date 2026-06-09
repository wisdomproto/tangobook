import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { AppError } from '../../middleware/error.middleware.js';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

export interface MetaPublishInput {
  platform: 'instagram' | 'facebook' | 'threads';
  accessToken: string;
  pageId: string;
  caption?: string;
  imageUrl?: string;
  scheduledAt?: string | null;
  projectId?: string;
  contentId?: string;
  title?: string;
  language?: string;
  userId: string; // required — stamped onto mkt_publish_records (RLS NOT NULL)
}

export interface SaveMetaRecordArgs {
  userId: string;
  projectId?: string;
  contentId?: string;
  channel: string;
  postId: string;
  title?: string;
  caption?: string;
  language?: string;
  scheduledAt?: string | null;
}

/**
 * Inserts a row into mkt_publish_records using the canonical column names:
 *   platform_post_id  (NOT external_id)
 *   published_url     (NOT url)
 *   metadata.title    (NOT a top-level title column)
 *
 * Stamps user_id from args.userId (no server-side auth cookie).
 * Early-returns silently when projectId is absent (un-wired callers).
 */
export async function saveMetaRecord(
  admin: SupabaseClient,
  args: SaveMetaRecordArgs
): Promise<void> {
  if (!args.projectId) return;

  await admin.from('mkt_publish_records').insert({
    user_id: args.userId,
    project_id: args.projectId,
    content_id: args.contentId ?? null,
    channel: args.channel,
    status: args.scheduledAt ? 'scheduled' : 'published',
    language: args.language ?? 'ko',
    platform_post_id: args.postId,
    published_url: '', // Graph returns an id, not a URL
    metadata: { title: args.title ?? args.caption?.slice(0, 100) ?? '' },
    published_at: args.scheduledAt ?? new Date().toISOString(),
    scheduled_at: args.scheduledAt ?? null,
  });
}

/**
 * Publishes to Meta (Instagram / Facebook / Threads) via Graph API v21.0.
 * Graph calls are ported verbatim from CF's /api/publish/meta/route.ts.
 * Record insert routes through saveMetaRecord (canonical columns + user_id stamp).
 */
export async function publishToMeta(input: MetaPublishInput): Promise<{ postId: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(502, 'Supabase 서비스 키가 설정되지 않았습니다.');

  if (!input.accessToken || !input.pageId) {
    throw new AppError(400, 'Meta access token and page ID required');
  }

  const { platform, accessToken, pageId, caption, imageUrl, scheduledAt } = input;

  if (platform === 'instagram') {
    const containerRes = await fetch(`${GRAPH_URL}/${pageId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    const container = (await containerRes.json()) as { id?: string; error?: { message: string } };
    if (container.error) throw new AppError(400, container.error.message);

    const publishRes = await fetch(`${GRAPH_URL}/${pageId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
    });
    const result = (await publishRes.json()) as { id?: string; error?: { message: string } };
    if (result.error) throw new AppError(400, result.error.message);

    await saveMetaRecord(admin, {
      userId: input.userId,
      projectId: input.projectId,
      contentId: input.contentId,
      channel: 'instagram',
      postId: result.id!,
      title: input.title,
      caption,
      language: input.language,
      scheduledAt,
    });
    return { postId: result.id! };
  }

  if (platform === 'facebook') {
    const body: Record<string, unknown> = { message: caption, access_token: accessToken };
    if (scheduledAt) {
      body.scheduled_publish_time = Math.floor(new Date(scheduledAt).getTime() / 1000);
      body.published = false;
    }
    const res = await fetch(`${GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await res.json()) as { id?: string; error?: { message: string } };
    if (result.error) throw new AppError(400, result.error.message);

    await saveMetaRecord(admin, {
      userId: input.userId,
      projectId: input.projectId,
      contentId: input.contentId,
      channel: 'facebook',
      postId: result.id!,
      title: input.title,
      caption,
      language: input.language,
      scheduledAt,
    });
    return { postId: result.id! };
  }

  if (platform === 'threads') {
    const containerRes = await fetch(`${GRAPH_URL}/${pageId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: imageUrl ? 'IMAGE' : 'TEXT',
        text: caption,
        ...(imageUrl && { image_url: imageUrl }),
        access_token: accessToken,
      }),
    });
    const container = (await containerRes.json()) as { id?: string; error?: { message: string } };
    if (container.error) throw new AppError(400, container.error.message);

    const publishRes = await fetch(`${GRAPH_URL}/${pageId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
    });
    const result = (await publishRes.json()) as { id?: string; error?: { message: string } };
    if (result.error) throw new AppError(400, result.error.message);

    await saveMetaRecord(admin, {
      userId: input.userId,
      projectId: input.projectId,
      contentId: input.contentId,
      channel: 'threads',
      postId: result.id!,
      title: input.title,
      caption,
      language: input.language,
      scheduledAt,
    });
    return { postId: result.id! };
  }

  throw new AppError(400, 'Invalid platform. Use: instagram, facebook, or threads');
}

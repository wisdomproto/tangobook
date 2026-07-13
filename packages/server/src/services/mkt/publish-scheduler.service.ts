import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publishRecord } from './publish-executor.service.js';

/**
 * Publish scheduler — the only real automation in the marketing port.
 *
 * ONE module-level `setInterval(tick, 60_000)` (overlap-guarded), started once from
 * `server.ts`'s `app.listen` callback (NOT `app.ts` — `createApp` is shared with the
 * test process, so an interval there would leak a timer). Each tick is CF's two
 * automation mechanisms collapsed into one in-process loop:
 *   Step A — flip due `self_hosted` `scheduled`→`published` + enqueue the deploy webhook
 *            (CF pg_cron `UPDATE … RETURNING` + queue upsert).
 *   Step B — fire the debounced deploy webhooks, retry ≤ 3 (CF Vercel cron loop).
 * Graceful no-op when the service-role admin client is unconfigured (typical dev).
 */

const TICK_MS = 60_000;
const MAX_RETRY = 3;

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

/** Minimal shape we read off `mkt_projects.published_site`. */
interface PublishedSiteLite {
  deploy_webhook_url?: string;
}

/**
 * Start the per-minute tick. No-ops when the admin client is null (env unset) or
 * when already started. Fires once on boot so a restart doesn't wait a full minute.
 */
export function startPublishScheduler(): void {
  const admin = getSupabaseAdmin();
  if (!admin) return; // graceful no-op (env unset) — the provider already logged
  if (timer) return; // already started
  timer = setInterval(() => {
    void tick();
  }, TICK_MS);
  void tick(); // boot tick
  console.warn('[mkt] publish scheduler started (60s tick).');
}

/**
 * One scheduler cycle: Step A then Step B. Overlap-guarded — a slow webhook fan-out
 * must not stack on the next interval. Re-reads `getSupabaseAdmin()` each tick.
 */
export async function tick(): Promise<void> {
  if (running) return; // overlap guard
  running = true;
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await flipDueSelfHosted(admin);
    await fireDeployWebhooks(admin);
    await publishDueMeta(admin);
    await publishDueYoutube(admin);
  } catch (err) {
    console.error('[mkt] publish tick error:', (err as Error).message);
  } finally {
    running = false;
  }
}

/**
 * Step A — flip due `self_hosted` `scheduled` records to `published`, then enqueue
 * their projects into the deploy-webhook queue.
 *
 * supabase-js can't do CF's single CTE (`UPDATE … RETURNING` + `INSERT … ON CONFLICT`),
 * so it's two statements with the same effect: the queue upsert is idempotent and the
 * next tick re-converges if interrupted between them.
 */
export async function flipDueSelfHosted(admin: SupabaseClient): Promise<void> {
  const nowIso = new Date().toISOString();

  // The returned set is exactly the rows the WHERE matched (CF's `RETURNING project_id`).
  const { data: flipped, error } = await admin
    .from('mkt_publish_records')
    .update({ status: 'published', published_at: nowIso, updated_at: nowIso })
    .eq('status', 'scheduled')
    .eq('channel', 'self_hosted')
    .lte('scheduled_at', nowIso)
    .select('project_id, user_id');

  if (error) throw new Error(error.message);
  if (!flipped?.length) return;

  // DISTINCT project_id, carrying one user_id per project (single-owner → all records
  // of a project share the owner). `user_id` stamp is required (NOT NULL).
  const byProject = new Map<string, string>();
  for (const r of flipped as Array<{ project_id: string; user_id: string }>) {
    if (!byProject.has(r.project_id)) byProject.set(r.project_id, r.user_id);
  }

  const rows = [...byProject].map(([project_id, user_id]) => ({
    project_id,
    user_id,
    enqueued_at: nowIso, // bumps enqueued_at → re-fire even if recently fired
  }));

  const { error: upsertError } = await admin
    .from('mkt_deploy_webhook_queue')
    .upsert(rows, { onConflict: 'project_id' });

  if (upsertError) throw new Error(upsertError.message);
}

/**
 * Step C — publish due Meta (instagram/facebook/threads) scheduled records.
 *
 * Unlike self_hosted (which only flips a status + pings a webhook), Meta records must be
 * actively pushed to the Graph API at their scheduled time (IG/Threads have no native
 * scheduling). Each due record is handed to `publishRecord` (the shared executor), which
 * extracts the content, publishes, and records success/failure/backoff-retry itself.
 *
 * Batched (limit per tick) so a slow IG carousel poll can't starve the loop — the overlap
 * guard already serialises ticks, and remaining due rows are picked up next minute.
 */
const META_BATCH = 5;

export async function publishDueMeta(admin: SupabaseClient): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from('mkt_publish_records')
    .select('id')
    .eq('status', 'scheduled')
    .in('channel', ['instagram', 'facebook', 'threads'])
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(META_BATCH);

  if (error) throw new Error(error.message);
  if (!due?.length) return;

  // Sequential: each publish drives multiple Graph calls (+polling) — parallel would spike
  // rate limits. Executor is self-contained (updates each record's terminal/retry state).
  for (const row of due as Array<{ id: string }>) {
    await publishRecord(row.id);
  }
}

/**
 * Step D — publish due `youtube` scheduled records, one per tick.
 *
 * YouTube uploads are heavy (download reel mp4 from R2 → resumable upload) and quota-capped
 * (default 6 uploads/day: each `videos.insert` costs 1600 of 10k units). We cap at ONE per
 * tick so a daily-spaced queue drains 1/day without ever bursting the quota, and a single
 * multi-minute upload can't stall the IG/meta path (it runs after `publishDueMeta`). The
 * shared executor (`publishRecord` → `publishYouTube`) handles upload + terminal/retry state;
 * new uploads default to `public` (metadata.privacy).
 */
const YT_BATCH = 1;

export async function publishDueYoutube(admin: SupabaseClient): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from('mkt_publish_records')
    .select('id')
    .eq('status', 'scheduled')
    .eq('channel', 'youtube')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(YT_BATCH);

  if (error) throw new Error(error.message);
  if (!due?.length) return;

  for (const row of due as Array<{ id: string }>) {
    await publishRecord(row.id);
  }
}

/**
 * Step B — fire the deploy webhook for each pending queue row (debounced, retry ≤ 3).
 *
 * `fetch` is global on Node ≥ 18 (server runs tsx/Node 20) — no import.
 */
export async function fireDeployWebhooks(admin: SupabaseClient): Promise<void> {
  const { data: all, error } = await admin
    .from('mkt_deploy_webhook_queue')
    .select('project_id, enqueued_at, last_fired_at, retry_count, last_error');

  if (error) throw new Error(error.message);

  // PostgREST can't compare two columns → filter in JS (CF does the same).
  const pending = (
    (all ?? []) as Array<{
      project_id: string;
      enqueued_at: string;
      last_fired_at: string | null;
      retry_count: number;
      last_error: string | null;
    }>
  ).filter(
    (r) =>
      r.last_fired_at === null ||
      new Date(r.enqueued_at).getTime() > new Date(r.last_fired_at).getTime()
  );
  if (!pending.length) return;

  for (const row of pending) {
    if (row.retry_count >= MAX_RETRY) continue; // give up after 3

    // Snapshot the enqueue time we read. Setting last_fired_at to this (NOT "now")
    // means a fresh enqueue during the fetch+POST window advances enqueued_at past the
    // snapshot → next tick re-fires (no lost rebuild).
    const snapshotFiredAt = row.enqueued_at;

    const { data: project } = await admin
      .from('mkt_projects')
      .select('published_site')
      .eq('id', row.project_id)
      .maybeSingle();

    const url = (project?.published_site as PublishedSiteLite | null)?.deploy_webhook_url;

    if (!url) {
      await admin
        .from('mkt_deploy_webhook_queue')
        .update({ last_fired_at: snapshotFiredAt, last_error: 'deploy_webhook_url not configured' })
        .eq('project_id', row.project_id);
      continue;
    }

    try {
      const res = await fetch(url, { method: 'POST', body: JSON.stringify({}) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await admin
        .from('mkt_deploy_webhook_queue')
        .update({ last_fired_at: snapshotFiredAt, retry_count: 0, last_error: null })
        .eq('project_id', row.project_id);
    } catch (err) {
      // Leave last_fired_at unchanged → still pending → retried next tick.
      await admin
        .from('mkt_deploy_webhook_queue')
        .update({ retry_count: row.retry_count + 1, last_error: (err as Error).message })
        .eq('project_id', row.project_id);
    }
  }
}

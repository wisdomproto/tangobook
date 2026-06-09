# Marketing Phase 3 — 발행 (Publish Management) — Design Spec

| | |
|---|---|
| **Date** | 2026‑06‑09 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Status** | Spec (no implementation) |

> **Status: COMPLETE** (implemented 2026-06-09, branch feat/marketing-phase0; see plan + commits 5706ac7→7af8504).
| **Predecessor** | Phase 0 Foundation + Phase 1a–1d (full content area) + Phase 2 (keywords/ideas) — all COMPLETE & committed. |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` |
| **Roadmap slot** | Master‑plan **Phase 3 발행**. The `/marketing/publish` page + the `self_hosted` auto‑publish scheduler. Analytics/strategy = Phase 4/5 (OUT of scope). |
| **Primary CF source** | `src/components/publish/{publish-dashboard,channel-cards,self-hosted-card,bulk-schedule-dialog,publish-queue,naver-copy-section}.tsx`, `src/stores/project-store.ts:1727‑1816`, `supabase/migrations/{005_publish_records.sql,2026-05-18-self-hosted-channel.sql}`, `src/app/api/cron/fire-deploy-webhooks/route.ts`, `src/app/api/publish/{meta,schedule,queue,youtube}/route.ts` |

---

## 1. Overview

ContentFlow's publish feature is a **발행 관리** screen (`/publish`) with: channel cards (one truly‑automated `self_hosted` card + three static placeholder cards), a publish queue (list + month‑calendar) with per‑row quick‑scheduling and channel previews, and a 5‑step bulk‑schedule wizard. Behind it sits the **only real automation in the whole app**: a per‑minute job that flips due `self_hosted` scheduled records to `published` and (debounced) fires the project's static‑site **deploy webhook** so the external site rebuilds and serves the now‑published posts.

Phase 3 is a **faithful port** of this into Tangobook's `/marketing/publish` route. The stack adapts exactly as in earlier phases: Next.js → Vite/React‑Router, Zustand `project-store` → TanStack Query hooks + marketing Supabase client, CF `/api/*` → Express `/api/mkt/*` (only where a server is genuinely required), `project_members` RLS → single‑owner `user_id = auth.uid()`, and **CF's two automation mechanisms (pg_cron + a Vercel cron route) → ONE Express `setInterval` tick** (Tangobook has no pg_cron / no Vercel).

**This phase is cheaper on the data + settings axes than expected** — the Phase 0 schema already provisioned most of it:

- `mkt_publish_records` **already exists** (`2026-06-07-marketing-schema.sql:309`) — but with the **wrong status default/CHECK, wrong channel CHECK (none), and the wrong partial unique index**. Phase 3 **ALTERs** it to CF's `self_hosted` design (it does NOT re‑create it).
- `mkt_projects.published_site jsonb` **already exists** (`:67`); `meta_credentials`/`wp_credentials` JSONB **already exist** (`:64‑65`).
- The `PublishedSite`, `MetaCredentials`, `WpCredentials`, `PublishRecord` TS interfaces **already exist** (`types/database.ts:111,135,99,467`).
- **`PublishedSiteSection` is already built AND wired** into `ProjectSettings` (tab "발행사이트", `ProjectSettings.tsx:91/130` → `components/project/sections/PublishedSiteSection.tsx`) → `onUpdate({ published_site })` → `useUpdateProject`. **Decision #6 is effectively DONE** (Phase 3 only verifies it).
- `BlogPreviewDialog` **already exists** (`components/content/BlogPreviewDialog.tsx`, props `{ open, onOpenChange, cards, title }`) — reuse it for naver/wordpress previews.
- The sidebar nav item `{ to: '/marketing/publish', icon: '🚀', label: '발행' }` **already exists** (`Sidebar.tsx:18`); the route `{ path: 'publish', element: <PlaceholderPage title="발행 관리" /> }` **already exists** (`router/index.tsx:316`) — Phase 3 just **swaps the element**.
- `distributeSchedule` is **already ported with passing tests** (`lib/schedule-distribution.ts`). Reuse; do NOT re‑port.

So Phase 3's real work is: **(1)** a migration that ALTERs `mkt_publish_records` to the `self_hosted` shape + CREATEs `mkt_deploy_webhook_queue`; **(2)** a server **service‑role Supabase admin provider** + a **publish scheduler `setInterval`** (the heart); **(3)** the client publish UI (dashboard / channel cards / bulk‑schedule wizard / queue list+calendar / naver copy section); **(4)** the publish data hooks; **(5)** route swap. Meta‑publish is ported as a **secondary, un‑wired** endpoint; YouTube‑publish is **deferred**.

---

## 2. CF → Tangobook mapping

| ContentFlow | Tangobook (Phase 3) | Why |
|---|---|---|
| **pg_cron job `publish-self-hosted`** (every minute, flip + enqueue) | **Express `setInterval(tick, 60_000)` Step A** (`publish-scheduler.service.ts`) | No pg_cron available; Tangobook runs the loop in‑process (pattern: module‑level `setInterval` in `storybook.service.ts:35`). |
| **Vercel cron `/api/cron/fire-deploy-webhooks`** (every minute, Bearer `CRON_SECRET`) | **same Express tick, Step B** (no HTTP route, no `CRON_SECRET` needed for self‑trigger) | One process owns both halves; no external scheduler/route. (A manual `POST /api/mkt/publish/tick` guarded by `CRON_SECRET` is an **optional** debugging affordance — see §4.5.) |
| `@supabase/supabase-js` admin client from `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (in the route module) | **`providers/supabase-admin.provider.ts`** singleton from `SUPABASE_URL`/`VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Server needs to flip rows across **all owners** (bypass RLS). No such client exists today (verified — grep empty). Graceful‑null when env missing. |
| `project_members` + `is_project_member()` RLS on `publish_records` | **single‑owner** `user_id = auth.uid()` RLS on `mkt_publish_records` (+ `user_id NOT NULL`) | House model (no multi‑tenancy). Client reads/writes are owner‑scoped; the scheduler uses the **service‑role** client to cross owners. |
| Zustand `project-store` publish methods (`schedulePublish`, `bulkSchedulePublish`, `cancelPublish`, `fetchPublishCountsByLanguage`, …) writing Supabase **directly** (REST routes bypassed) | **TanStack Query hooks** (`api/use-publish-records.ts`) writing the marketing Supabase client **directly** | Mirrors CF (which also bypasses its own `/api/publish/{schedule,queue}` routes). House rule: server data = TanStack, no REST→server for plain CRUD. |
| CF `/api/publish/{schedule,queue}` REST routes | **NOT ported** (vestigial — CF UI never calls them) | Dead in CF; the store writes Supabase directly. |
| CF `/api/publish/meta` (Meta Graph IG/FB/threads), called from `language-selector.tsx:102` | **`POST /api/mkt/publish/meta`** ported but **un‑wired** (its CF caller — the publish bar in `language-selector` — was NOT ported; the worktree `LanguageSelector` is the simplified 1d translate‑only version) | Needs live Meta OAuth tokens not configured; no callsite in the port. Expose + document; keep `handlePublishNow` no‑op. (§8) |
| CF `/api/publish/youtube` | **NOT ported** (deferred) | Dead code (no caller); needs resumable upload + OAuth. (§8) |
| Next.js `/publish` page (App Router) | React‑Router `{ path: 'publish' }` → `pages/PublishPage.tsx` | — |
| CF kebab filenames (`self-hosted-card.tsx`) | **PascalCase** (`SelfHostedCard.tsx`) | Tangobook convention; matches existing marketing components (`IdeasDashboard.tsx`). |
| `useProjectStore().selectedProjectId` | `ui-store.selectedProjectId` | Existing UI store. |

---

## 3. Data model

### 3.1 The existing `mkt_publish_records` is WRONG for `self_hosted` — ALTER it

The Phase 0 schema (`2026-06-07-marketing-schema.sql:309‑331`) created `mkt_publish_records` from the `PublishRecord` interface but **guessed the status lifecycle**. It currently has:

- `status text not null default 'pending'` with **no CHECK** (CF lifecycle = `draft/scheduled/publishing/published/failed`).
- `channel text not null` with **no CHECK** (CF channel enum = `self_hosted/naver_blog/instagram/facebook/threads/youtube`).
- partial unique index `mkt_publish_records_pending_unique on (content_id, channel, language) WHERE status in ('pending','uploading')` — **does not match** CF's `self_hosted`‑scoped index.
- indexes on `project_id` + `status` are **absent** entirely (the Phase 0 file added neither); only the pending index exists.

Phase 3 reconciles it to CF's `005_publish_records.sql` + `2026-05-18-self-hosted-channel.sql` shape. Because the table already exists (and may hold rows), this is an **idempotent ALTER**, not a CREATE.

### 3.2 Migration `supabase/migrations/2026-06-09-marketing-phase3-publish.sql`

Match the existing migration's style (lowercase SQL, `create policy … for all using(...) with check(...)`, `mkt_` prefix, single‑owner RLS).

```sql
-- =============================================================================
-- Marketing Phase 3 — publish (self_hosted scheduler)
-- Reconciles mkt_publish_records to CF's self_hosted shape + adds
-- mkt_deploy_webhook_queue. Idempotent ALTERs (table already exists, Phase 0).
-- Project: tangobook (fxzwigjkbsptvsjraqwa)
-- Safety: ALTER/CREATE only; no DROP of data.
-- =============================================================================

-- ── (a) mkt_publish_records: status + channel CHECK enums ───────────────────
-- Drop the Phase-0 "pending/uploading" assumptions; adopt CF's lifecycle.
alter table mkt_publish_records alter column status set default 'draft';

-- Migrate any legacy rows to the CF lifecycle BEFORE adding the constraints.
update mkt_publish_records set status = 'draft'
  where status not in ('draft','scheduled','publishing','published','failed');
update mkt_publish_records set channel = 'self_hosted'
  where channel not in ('self_hosted','naver_blog','instagram','facebook','threads','youtube');

alter table mkt_publish_records drop constraint if exists mkt_publish_records_status_check;
alter table mkt_publish_records add constraint mkt_publish_records_status_check
  check (status in ('draft','scheduled','publishing','published','failed'));

alter table mkt_publish_records drop constraint if exists mkt_publish_records_channel_check;
alter table mkt_publish_records add constraint mkt_publish_records_channel_check
  check (channel in ('self_hosted','naver_blog','instagram','facebook','threads','youtube'));

-- ── (b) Indexes (Phase 0 created none of these) ─────────────────────────────
create index if not exists idx_mkt_publish_records_project   on mkt_publish_records (project_id);
create index if not exists idx_mkt_publish_records_status    on mkt_publish_records (status);
create index if not exists idx_mkt_publish_records_scheduled on mkt_publish_records (scheduled_at)
  where status = 'scheduled';

-- ── (c) Swap the partial unique index → CF's self_hosted scope ──────────────
drop index if exists mkt_publish_records_pending_unique;
create unique index if not exists uniq_mkt_publish_self_hosted
  on mkt_publish_records (content_id, language, channel)
  where channel = 'self_hosted' and status in ('scheduled','published');

-- ── (d) mkt_deploy_webhook_queue (debounce) ─────────────────────────────────
-- CF keeps RLS DISABLED (service-role only). Tangobook adds user_id NOT NULL for
-- single-owner consistency (keyed off an owned project) + an owner RLS policy;
-- the scheduler uses the service-role client which bypasses RLS regardless.
create table if not exists mkt_deploy_webhook_queue (
  project_id     uuid primary key references mkt_projects(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  enqueued_at    timestamptz not null,
  last_fired_at  timestamptz,
  retry_count    int not null default 0,
  last_error     text
);

alter table mkt_deploy_webhook_queue enable row level security;
create policy mkt_deploy_webhook_queue_owner on mkt_deploy_webhook_queue
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Notes:
- **`mkt_projects.published_site jsonb` already exists** → no column add. (CF's `2026-05-18` migration adds the column to `projects`; ours is already present from Phase 0.)
- **No pg_cron, no `cron.schedule`** — the per‑minute logic is the Express tick (§4). The migration intentionally omits CF's `(e)` pg_cron block.
- The unique index is `(content_id, language, channel)` (CF's column order) scoped to `channel='self_hosted' AND status IN ('scheduled','published')`. This is what makes re‑scheduling / bulk skip‑on‑conflict safe (one live self_hosted record per content+language). **Gotcha R‑6**: the scheduler's flip from `scheduled`→`published` stays inside this predicate, so no conflict is introduced by the flip; but a `schedulePublish` upsert onto an already‑`published` row must `onConflict (content_id,language,channel)` (the upsert key) — see §6.3.

### 3.3 TS types (mostly EXISTING)

`PublishRecord`, `PublishedSite`, `MetaCredentials`, `WpCredentials` already exist in `types/database.ts`. Only additions:

```ts
// types/database.ts — NEW (mkt_deploy_webhook_queue row)
export interface DeployWebhookQueueRow {
  project_id: string;
  user_id: string;
  enqueued_at: string;
  last_fired_at: string | null;
  retry_count: number;
  last_error: string | null;
}

// PublishRecord already present (database.ts:467) — confirm `channel`/`status` stay `string`
// (UI narrows them); no change required. PublishedSite already present (database.ts:111).
```

`Project.published_site?: PublishedSite | null` is **already** on the interface (`database.ts:165`) — no change.

### 3.4 New query keys (`api/queries.ts`)

```ts
// extend mktKeys (flat object, matches existing shape)
publishRecords: (projectId: string) => ['mkt', 'publish-records', projectId] as const,
publishCounts:  (projectId: string) => ['mkt', 'publish-counts', projectId] as const,
```

`publishRecords(projectId)` backs the queue (project‑wide list). `publishCounts(projectId)` backs the `SelfHostedCard` per‑language counts. Both are server state (live in TanStack cache). The bulk‑schedule **preview** rows are transient (component state) until confirmed.

---

## 4. Server — scheduler (the heart)

### 4.1 `providers/supabase-admin.provider.ts` [NEW] — service‑role singleton

Mirrors the existing provider‑singleton pattern (`gemini.provider.ts` / `r2.provider.ts`) + Tangobook's guest‑mode graceful degradation.

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let _admin: SupabaseClient | null | undefined;

/** Service-role Supabase client (bypasses RLS). null when env is unset. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin !== undefined) return _admin;
  const url = config.supabase.url;          // SUPABASE_URL ?? VITE_SUPABASE_URL
  const key = config.supabase.serviceRoleKey; // SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('[mkt] Supabase admin client not configured — publish scheduler disabled.');
    _admin = null;
    return null;
  }
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}
```

- **`@supabase/supabase-js` must be a server dependency** — verify it is in `packages/server/package.json` (the client already depends on it; add to server if absent). Flag in the plan.
- **config additions** (`config/index.ts`, new `supabase` block; all default `''`):
  ```ts
  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  cron: { secret: process.env.CRON_SECRET ?? '' }, // optional manual-tick guard (§4.5)
  ```
- **`.env.example`** — append (after the Naver Datalab block):
  ```
  # Supabase service-role (marketing publish scheduler — server-only, NEVER expose to client)
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  # Optional: guards the manual publish-tick debug endpoint
  CRON_SECRET=
  ```

### 4.2 `services/mkt/publish-scheduler.service.ts` [NEW] — the tick

ONE module‑level `setInterval(tick, 60_000)` with an **overlap guard** (`running` flag), started once from bootstrap (§4.4), **only when the admin client is present**. Idempotent, safe to run forever. Each tick = Step A (flip + enqueue) then Step B (fire webhooks).

```ts
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';

const TICK_MS = 60_000;
const MAX_RETRY = 3;
let running = false;
let timer: NodeJS.Timeout | null = null;

export function startPublishScheduler(): void {
  const admin = getSupabaseAdmin();
  if (!admin) return; // graceful no-op (env unset) — logged by the provider
  if (timer) return;  // already started
  timer = setInterval(() => { void tick(); }, TICK_MS);
  // Optional: fire once on boot so a server restart doesn't wait a full minute.
  void tick();
  console.warn('[mkt] publish scheduler started (60s tick).');
}

async function tick(): Promise<void> {
  if (running) return;       // overlap guard — a slow webhook fan-out must not stack
  running = true;
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await flipDueSelfHosted(admin);   // Step A
    await fireDeployWebhooks(admin);  // Step B
  } catch (err) {
    console.error('[mkt] publish tick error:', (err as Error).message);
  } finally {
    running = false;
  }
}
```

#### Step A — `flipDueSelfHosted(admin)` (faithful translation of the pg_cron SQL)

CF's pg_cron does an atomic `UPDATE … RETURNING project_id` then an `INSERT … ON CONFLICT DO UPDATE` into the queue. supabase‑js can't do a single CTE, so split into two statements (same effect — the queue upsert is idempotent and the next tick re‑converges if interrupted):

```
1. const nowIso = new Date().toISOString();
2. const { data: flipped, error } = await admin
     .from('mkt_publish_records')
     .update({ status: 'published', published_at: nowIso, updated_at: nowIso })
     .eq('status', 'scheduled')
     .eq('channel', 'self_hosted')
     .lte('scheduled_at', nowIso)
     .select('project_id, user_id');         // need user_id to stamp the queue row
   // returns the rows transitioned this tick (PostgREST returns the updated set)
3. if (!flipped?.length) return;
4. // DISTINCT project_id (+ carry a user_id per project for the queue stamp)
   const byProject = new Map<string, string>(); // project_id -> user_id
   for (const r of flipped) if (!byProject.has(r.project_id)) byProject.set(r.project_id, r.user_id);
5. // Upsert each project into the queue with enqueued_at = now (ON CONFLICT updates enqueued_at)
   const rows = [...byProject].map(([project_id, user_id]) => ({
     project_id, user_id, enqueued_at: nowIso,
   }));
   await admin.from('mkt_deploy_webhook_queue')
     .upsert(rows, { onConflict: 'project_id' });  // bumps enqueued_at → re-fire even if recently fired
```

- The `update().select()` returns exactly the rows the WHERE matched (the "transitioned" set), so this faithfully reproduces CF's `RETURNING project_id`.
- **Idempotency**: if Step A runs but Step B is interrupted, the queue row's `enqueued_at > last_fired_at` keeps it "pending" → next tick fires it. Re‑running the UPDATE matches nothing (rows are now `published`), so no double‑enqueue.
- **`user_id` stamp** on the queue insert is required (single‑owner RLS / NOT NULL). We carry it from the flipped record (any record for that project — they share the owner under the single‑owner model). The service‑role client bypasses RLS, but the NOT NULL column must still be filled.

#### Step B — `fireDeployWebhooks(admin)` (faithful translation of the Vercel cron loop)

```
1. const { data: all } = await admin.from('mkt_deploy_webhook_queue')
     .select('project_id, enqueued_at, last_fired_at, retry_count, last_error');
2. // PostgREST cannot compare two columns → filter in JS (CF does the same)
   const pending = (all ?? []).filter(r =>
     r.last_fired_at === null ||
     new Date(r.enqueued_at).getTime() > new Date(r.last_fired_at).getTime());
   if (!pending.length) return;
3. for (const row of pending) {
     if (row.retry_count >= MAX_RETRY) continue;           // give up after 3
     const snapshotFiredAt = row.enqueued_at;              // snapshot → fresh enqueue during fire re-fires next cycle
     const { data: project } = await admin.from('mkt_projects')
       .select('published_site').eq('id', row.project_id).maybeSingle();
     const url = (project?.published_site as PublishedSite | null)?.deploy_webhook_url;
     if (!url) {
       await admin.from('mkt_deploy_webhook_queue')
         .update({ last_fired_at: snapshotFiredAt, last_error: 'deploy_webhook_url not configured' })
         .eq('project_id', row.project_id);
       continue;
     }
     try {
       const r = await fetch(url, { method: 'POST', body: JSON.stringify({}) });
       if (!r.ok) throw new Error(`HTTP ${r.status}`);
       await admin.from('mkt_deploy_webhook_queue')
         .update({ last_fired_at: snapshotFiredAt, retry_count: 0, last_error: null })
         .eq('project_id', row.project_id);
     } catch (err) {
       await admin.from('mkt_deploy_webhook_queue')
         .update({ retry_count: row.retry_count + 1, last_error: (err as Error).message })
         .eq('project_id', row.project_id);
     }
   }
```

- **Debounce semantics** (faithful): a row fires only while `enqueued_at > last_fired_at` (or never fired). Setting `last_fired_at = snapshotFiredAt` (the enqueue time we read, **not** "now") means if a *new* enqueue lands during the fetch+POST window, `enqueued_at` advances past the snapshot and the next tick re‑fires — no lost rebuild.
- **Retry ≤ 3**: on failure, bump `retry_count` (leave `last_fired_at` unchanged → still pending → retried next tick) until it hits `MAX_RETRY`, then skipped. Success resets `retry_count=0`.
- `fetch` is global in Node ≥ 18 (Express server runs on tsx/Node 20) — no import needed.

### 4.3 `published` vs the unique index (no conflict)

The flip keeps `channel='self_hosted'` and moves `scheduled`→`published` — both inside the `uniq_mkt_publish_self_hosted` predicate `status IN ('scheduled','published')`. Since the index key is `(content_id, language, channel)` and there was exactly one live row, the UPDATE does not create a duplicate. (A second `schedule` for the same content+language while one is already `published` is prevented at insert time by the same index — the bulk path skips it; the single‑schedule upsert resolves on the conflict key. §6.3.)

### 4.4 Bootstrap wiring

Start the scheduler **once**, after `app.listen`, alongside the existing prewarms in `server.ts:10‑18`:

```ts
// server.ts — inside app.listen callback, after prewarms
import { startPublishScheduler } from './services/mkt/publish-scheduler.service.js';
...
  prewarmStorybookListCache();
  prewarmPhonicsLibraryCache();
  startPublishScheduler();   // no-op when SUPABASE_SERVICE_ROLE_KEY unset
```

`startPublishScheduler()` self‑guards on the admin client, so dev machines without the service‑role key simply log + do nothing (no crash, no firing). Place it in `server.ts` (the listen entrypoint), NOT `app.ts` (which `createApp()` is also used by tests — starting an interval there would leak timers into the test process).

### 4.5 (Optional) manual tick endpoint — debugging only

A `POST /api/mkt/publish/tick` (Bearer `config.cron.secret`, 401 otherwise) that calls `tick()` once and returns `{ flipped, fired, skipped }`. **Optional**; lets ops force a cycle without waiting 60s and gives an external scheduler a hook if the in‑process interval is ever undesirable (e.g. multi‑replica deploy — see Risk R‑3). Mark as a stretch; default to omit.

---

## 5. Client — component tree

All under `packages/client/src/features/marketing/components/publish/` (new dir), `.marketing-scope`, reusing Phase 0 UI primitives (`ui/button`, `ui/badge`, `ui/select`, `ui/dialog`, …) + `lib/utils.cn`. PascalCase filenames.

```
components/publish/                 NEW directory
  PublishDashboard.tsx     NEW  — wrapper: header "발행 관리" + <ChannelCards/> + <PublishQueue/> + <NaverCopySection/> (port of publish-dashboard.tsx)
  ChannelCards.tsx         NEW  — grid: <SelfHostedCard/> + 3 static cards (Instagram / YouTube / Facebook·Threads); "connected" = !!project.meta_credentials (port of channel-cards.tsx)
  SelfHostedCard.tsx       NEW  — reads project.published_site; dashed "프로젝트 설정에서 사이트 등록·활성화 필요" when !enabled; else per-language 예약/발행 counts (usefetchPublishCountsByLanguage) + "일괄 예약 +" → <BulkScheduleDialog/> (port of self-hosted-card.tsx)
  BulkScheduleDialog.tsx   NEW  — 5-stage wizard (content multi-select w/ A–E filter → language → schedule params → preview via distributeSchedule → confirm via bulkSchedulePublish) (port of bulk-schedule-dialog.tsx)
  PublishQueue.tsx         NEW  — list+calendar toggle, status/channel/language filters, per-scheduled-row datetime-local + quick-pick + "즉시 발행"(no-op) + delete; calendar = month grid w/ per-day chips; per-channel preview dialogs (port of publish-queue.tsx, 469 lines)
  PublishCalendar.tsx      NEW  — (extracted) month grid + day-cell chips; pure date-cell math testable in isolation (CF inlines this in publish-queue; extract for testability)
  NaverCopySection.tsx     NEW  — static "네이버 블로그 (수동 업로드)" placeholder card (port of naver-copy-section.tsx)
pages/
  PublishPage.tsx          NEW  — project guard (like IdeasPage) → <PublishDashboard projectId={selectedProjectId}/>
index.ts                   EDIT — export PublishPage
```

### 5.1 `PublishDashboard.tsx` (port of `publish-dashboard.tsx`)
- Header "발행 관리" + stacked `<ChannelCards/>`, `<PublishQueue/>`, `<NaverCopySection/>`.
- Props `{ projectId }` (from `PublishPage`); reads `useProject(projectId)`.

### 5.2 `ChannelCards.tsx` (port of `channel-cards.tsx`)
- Responsive grid. First cell = `<SelfHostedCard/>`. Then 3 **static** cards (Instagram, YouTube, Facebook/Threads) showing a "연동됨"/"미연동" badge from `!!project.meta_credentials` (the CF "connected" check — confirmed: `meta_credentials` JSONB exists on `mkt_projects`). These three are display‑only (no actions) — faithful to CF (publishing through them is the un‑wired meta endpoint, §8).

### 5.3 `SelfHostedCard.tsx` (port of `self-hosted-card.tsx`)
- `const site = project.published_site; const enabled = !!site?.enabled;`
- `!enabled` → dashed muted card "프로젝트 설정에서 사이트 등록·활성화 필요" (Globe icon).
- `enabled` → header `내 사이트 ({new URL(site.domain).hostname})` + green ● 활성 + per‑`active_languages` row `예약 {n} · 발행 {m}` (from `useFetchPublishCountsByLanguage(project.id)`, defaulting missing langs to `{0,0}`) + a full‑width "일괄 예약 +" button → opens `<BulkScheduleDialog/>`.
- **Korean** labels in the narrow card carry `break-keep` (project RULE).

### 5.4 `BulkScheduleDialog.tsx` (port of `bulk-schedule-dialog.tsx`) — 5‑stage wizard
Stage state machine (CF parity), reusing the **already‑ported** `distributeSchedule`:
1. **콘텐츠 선택** — multi‑select list of the project's `mkt_contents` with category A–E filter (`useContents(projectId)`); checkbox per content.
2. **언어 선택** — from `published_site.active_languages` (checkbox set; default all active).
3. **일정 파라미터** — `startDate` (date input), `perWeek` (number), `weekdays` (0–6 toggles), `timeSlots` (CSV `'09:00,14:00'` → string[]), `langOffsetDays` (number). Map 1:1 to `DistributeInput`.
4. **미리보기** — call `distributeSchedule({ contentIds, languages, startDate, perWeek, weekdays, timeSlots, languageOffsetDays })` → render the `DistributedSlot[]` as a table (content title × language × scheduledAt). No DB writes yet.
5. **확정** — build rows `{ contentId, projectId, language, scheduledAt }` from the preview → `bulkSchedulePublish(rows)` (channel `self_hosted`) → `alert('{inserted}건 예약 완료 · {skipped}건 스킵')` → close + invalidate `publishRecords`/`publishCounts`.
- Wizard nav: 이전/다음 buttons gated by per‑stage validity (≥1 content, ≥1 language, valid params).

### 5.5 `PublishQueue.tsx` (port of `publish-queue.tsx`, 469 lines) — the big one
- **Data**: `usePublishRecords(projectId)` → all records for the project.
- **View toggle**: 목록(list) ⇄ 달력(calendar).
- **Filters**: status (`all|draft|scheduled|publishing|published|failed`), channel, language — client‑side over the fetched records.
- **List rows**: channel icon, `metadata.title` (the canonical title field — see §8 delta), language flag, scheduled/published time, status pill. For `status==='scheduled'` rows: a `datetime-local` input (→ `updateScheduledAt(id, isoFromLocal)`), a **quick‑pick** dropdown (`오늘 저녁 7시` / `내일 오전 8시` / … via `makeTime(dayOffset, hour)` + a per‑channel/lang `BEST_POST_TIMES[lang]` recommendation, ported verbatim from `publish-queue.tsx:51/295‑301`), a green **"즉시 발행"** button (→ `handlePublishNow` = **no‑op alert**, KEEP), and a delete button (→ `cancelPublish(id)`).
- **`handlePublishNow` (FAITHFUL no‑op)**: `alert('직접 발행은 현재 지원하지 않습니다. 내부 블로그 API를 통해 자동 발행됩니다.')` — exactly CF (`publish-queue.tsx:138‑139`). The self_hosted scheduler is the real publish path; manual publish stays a no‑op.
- **Calendar view** (`PublishCalendar.tsx`): month grid (weeks × 7), each day cell shows colored record chips (color by status). Prev/next month nav. Cell math (which records fall on which day, leading/trailing blanks) extracted + unit‑tested (§10).
- **Preview dialogs** (per channel, ported): naver/wordpress(`self_hosted`) → reuse the existing **`BlogPreviewDialog`** (`{ cards, title }`) — fetch the channel's cards on demand (CF fetches `blog_contents`→`blog_cards` / `instagram_cards` / `threads_cards` by `content_id` on click; Tangobook reads the **`mkt_`** tables: `mkt_blog_contents`→`mkt_blog_cards`, `mkt_instagram_cards`, `mkt_threads_cards` — **confirmed table+column names** from the Phase 0 schema, §3). instagram/facebook → render the card background images; threads → render post bodies.
- **Writes go directly to Supabase via the hooks** (CF parity — `handleSchedule`/`handleDeleteRecord` write `publish_records` directly; we route them through `usePublishRecords` mutations so cache invalidation is centralized).

### 5.6 `NaverCopySection.tsx` (port of `naver-copy-section.tsx`)
- Static informational card "네이버 블로그 (수동 업로드)" — no actions (Naver has no publish API; manual copy/paste). Faithful placeholder. Korean `break-keep`.

### 5.7 `PublishPage.tsx`
- Guard: no `ui-store.selectedProjectId` → centered "프로젝트를 선택하세요" (CF parity); else `<PublishDashboard projectId={selectedProjectId} />`. Mirrors `IdeasPage`/`ContentPage`.

---

## 6. Client — data hooks (`api/use-publish-records.ts` [NEW])

TanStack Query, marketing Supabase client (`api/supabase.ts`), `mktKeys`, `getCurrentUserId()` stamping on **insert** (the shared helper used by Phase 1b/1d card inserts — reuse it; if it's not yet centralized, add to `api/supabase.ts` — same open item as Phase 1d O‑2). All faithful to `project-store.ts:1727‑1816`.

### 6.1 `usePublishRecords(projectId)` — read
```ts
useQuery({
  queryKey: mktKeys.publishRecords(projectId),
  queryFn: async () => {
    const { data, error } = await supabase.from('mkt_publish_records')
      .select('*').eq('project_id', projectId).order('scheduled_at', { nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PublishRecord[];
  },
  enabled: !!projectId,
});
```
(CF's queue fetched `.eq('project_id', selectedProjectId)` — same.)

### 6.2 `useFetchPublishCountsByLanguage(projectId)` — read (self_hosted only)
Port `fetchPublishCountsByLanguage` (`:1812`): select `language,status` where `project_id` + `channel='self_hosted'`; reduce to `Record<lang,{scheduled,published}>`. Keyed `mktKeys.publishCounts(projectId)`.

### 6.3 `useSchedulePublish()` — upsert one (self_hosted)
Port `schedulePublish` (`:1752`): upsert
```ts
{ user_id: await getCurrentUserId(), content_id, project_id, language,
  channel: 'self_hosted', status: 'scheduled', scheduled_at }
```
with `{ onConflict: 'content_id,language,channel', ignoreDuplicates: false }`.
- **`user_id` stamp required** (single‑owner RLS / NOT NULL). CF didn't stamp (its RLS used `project_members`); Tangobook MUST (gotcha (a)).
- On success invalidate `publishRecords` + `publishCounts`.

### 6.4 `useBulkSchedulePublish()` — skip‑on‑conflict bulk insert (the load‑bearing logic)
Faithful port of `bulkSchedulePublish` (`:1779`) + `user_id` stamp:
```ts
async function bulkSchedule(rows: { contentId; projectId; language; scheduledAt }[]) {
  const uid = await getCurrentUserId();
  const contentIds = [...new Set(rows.map(r => r.contentId))];
  // 1. Pre-check the live self_hosted keys (scheduled|published) for these contents
  const { data: existing } = await supabase.from('mkt_publish_records')
    .select('content_id, language')
    .in('content_id', contentIds)
    .eq('channel', 'self_hosted')
    .in('status', ['scheduled', 'published']);
  const existingKey = new Set((existing ?? []).map(e => `${e.content_id}::${e.language}`));
  // 2. Insert only the rows whose (content,language) is not already live
  const toInsert = rows
    .filter(r => !existingKey.has(`${r.contentId}::${r.language}`))
    .map(r => ({ user_id: uid, content_id: r.contentId, project_id: r.projectId,
                 language: r.language, channel: 'self_hosted',
                 status: 'scheduled', scheduled_at: r.scheduledAt }));
  if (toInsert.length === 0) return { inserted: 0, skipped: rows.length };
  const { data, error } = await supabase.from('mkt_publish_records').insert(toInsert).select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0, skipped: rows.length - (data?.length ?? 0) };
}
```
- The pre‑check mirrors the `uniq_mkt_publish_self_hosted` predicate exactly, so the insert never trips the unique index (defense in depth — the index also guards concurrent inserts).
- **`user_id` stamp** added to every inserted row (the single most likely RLS bug — gotcha (a)).
- Invalidate `publishRecords` + `publishCounts` on success.

### 6.5 `useCancelPublish()` — delete
Port `cancelPublish` (`:1772`): `.from('mkt_publish_records').delete().eq('id', recordId)`. Invalidate both keys. (RLS `using(user_id=auth.uid())` already scopes the delete to the owner — no stamp needed on delete.)

### 6.6 `useUpdateScheduledAt()` — reschedule
Port `handleSchedule` (`publish-queue.tsx:144`): `.update({ scheduled_at }).eq('id', id)`. Invalidate both keys. (Update of an owned row needs no stamp.)

### 6.7 `published_site` writes — reuse `useUpdateProject`
`published_site` is a column on `mkt_projects`; the `updatePublishedSite` equivalent is just `useUpdateProject({ id, updates: { published_site } })` — **already used by `PublishedSiteSection`** (`:58`). No new hook. RLS auto‑satisfied (owned row, no extra stamp).

---

## 7. Settings + route/nav wiring

### 7.1 Settings — ALREADY DONE (verify only)
`PublishedSiteSection` (`components/project/sections/PublishedSiteSection.tsx`) is fully built (name/domain/domain_prefix/active_languages/language_paths/deploy_webhook_url/enabled, with per‑lang path inputs + an enable Switch) **and** already wired into `ProjectSettings` (tab "발행사이트", `:91/130`). It writes via `onUpdate({ published_site })` → `useUpdateProject`. **Decision #6 needs no new work** — Phase 3 only confirms it reads/writes the `published_site` column the scheduler consumes (the scheduler reads `published_site.deploy_webhook_url` — same shape). The section's read‑only "fetch URL" hint references `/api/mkt/blog/by-project/{id}/posts` which is a **later** phase (the external site's read API) — out of Phase 3 scope; leave as‑is.

### 7.2 Route + nav
- **Route**: `router/index.tsx:316` — swap `{ path: 'publish', element: <PlaceholderPage title="발행 관리" /> }` → `{ path: 'publish', element: <PublishPage /> }`; add `PublishPage` to the `from '../features/marketing'` import (`:6‑12`) + the marketing `index.ts` barrel.
- **Nav**: `Sidebar.tsx:18` already renders `{ to: '/marketing/publish', icon: '🚀', label: '발행' }` — **no change** (it already links; the page just stops being a placeholder).

---

## 8. Meta publish (secondary) + YouTube (deferred)

### 8.1 Meta publish — port the endpoint, leave it un‑wired
- **`POST /api/mkt/publish/meta`** [NEW] — port `src/app/api/publish/meta/route.ts` (Meta Graph v21.0 IG container+publish / FB feed w/ optional `scheduled_publish_time` / Threads container+publish). New controller `controllers/mkt/publish.controller.ts` + a route line in `mkt.routes.ts` (`router.post('/publish/meta', metaPublish)`).
- **Adapt to canonical columns (DELTA vs CF).** CF's `saveRecord` writes **stale flat columns** `external_id` / `url` / `title` (`meta/route.ts:17‑27`) that **do not exist** on `mkt_publish_records`. The canonical schema uses `platform_post_id`, `published_url`, and `metadata.title`. So the ported `saveRecord` must write:
  ```ts
  await admin.from('mkt_publish_records').insert({
    user_id, project_id, content_id: contentId ?? null,
    channel, status: scheduledAt ? 'scheduled' : 'published',
    language: language ?? 'ko',
    platform_post_id: postId,
    published_url: '',                       // Graph API returns an id, not a URL
    metadata: { title: title ?? caption?.slice(0,100) ?? '' },
    published_at: scheduledAt ?? new Date().toISOString(),
    scheduled_at: scheduledAt ?? null,
  });
  ```
- **Use the service‑role admin client** (`getSupabaseAdmin()`) for the insert (the publish happens server‑side with the user's Meta token in the request body; there's no `auth.uid()` cookie on the server). **Stamp `user_id`** from the request body (the client must send the owning `userId`). Throw `AppError(502, …)` if the admin client is unconfigured.
- **Wiring**: the **only** CF caller is the publish bar in `language-selector.tsx:102`. The worktree's `LanguageSelector` is the **simplified Phase 1d translate‑only** version (verified — no publish bar, no meta call). So **expose the endpoint but DO NOT wire a callsite**; document it as un‑wired (needs live Meta OAuth + a future "publish" affordance). Keep `handlePublishNow` a no‑op regardless.
- **Status**: secondary/optional — flag in the plan as a thin, testable endpoint with no UI entry point this phase.

### 8.2 YouTube publish — NOT ported (deferred)
CF's `/api/publish/youtube` is **dead code** (no caller; needs resumable upload + OAuth refresh). **Out of scope** for Phase 3. Document in CLAUDE.md as deferred. (Tangobook already has a separate longform→YouTube uploader under `/api/longform`; a future phase may bridge marketing YouTube content to it — not now.)

---

## 9. Open decisions resolved (verified in the worktree)

| # | Question | Resolution (found) |
|---|---|---|
| O‑1 | Does `BlogPreviewDialog` exist for queue previews? | **YES** — `components/content/BlogPreviewDialog.tsx`, props `{ open, onOpenChange, cards, title }`. Reuse for naver + `self_hosted` previews. Previews read `mkt_blog_contents`/`mkt_blog_cards`/`mkt_instagram_cards`/`mkt_threads_cards` (table+column names confirmed from the Phase 0 schema). |
| O‑2 | `language-selector` vs `ChannelTranslationView` (meta‑publish wiring)? | The CF publish bar lived in `language-selector.tsx`; the worktree **did not** port it — `LanguageSelector.tsx` is the simplified 1d translate‑only version (verified). So **meta‑publish has no callsite** → expose the endpoint un‑wired (§8.1). |
| O‑3 | `mkt_projects` columns + `meta_credentials` shape for the "connected" check? | `meta_credentials jsonb`, `wp_credentials jsonb`, `published_site jsonb` **all already exist** (`schema:64‑67`). `MetaCredentials`/`WpCredentials`/`PublishedSite` TS interfaces exist (`database.ts:135/99/111`). "connected" = `!!project.meta_credentials`. |
| O‑4 | Server bootstrap spot for the scheduler? | `server.ts` `app.listen` callback (alongside the prewarms, `:15‑18`). NOT `app.ts` (shared with tests → timer leak). |
| O‑5 | `mktKeys` factory shape? | Flat object literal (`queries.ts:18‑31`). Add `publishRecords(projectId)` + `publishCounts(projectId)` the same way. |
| O‑6 | (bonus) Is `mkt_publish_records` / settings already there? | **`mkt_publish_records` exists but with wrong CHECK/index** → ALTER (§3.2). **`PublishedSiteSection` exists + wired** → Decision #6 done (verify only, §7.1). **Sidebar nav + placeholder route exist** → swap element only (§7.2). |
| O‑7 | Service‑role client present? | **NO** (grep empty across `packages/server`). Must add `supabase-admin.provider.ts` + config + env (§4.1). `@supabase/supabase-js` may need adding to `packages/server/package.json` (client has it; verify server). |

---

## 10. Testing strategy

**Pure logic — unit‑tested (Vitest, colocated `__tests__`):**
- **Scheduler tick** (`publish-scheduler.service.ts`) with a **mocked admin client** (in‑memory fake of `from().update().eq().select()` / `upsert` / `select`):
  - Step A flips only `status='scheduled' AND channel='self_hosted' AND scheduled_at<=now`; leaves future/`draft`/non‑self_hosted rows untouched; upserts DISTINCT project_ids into the queue with `enqueued_at=now`; stamps `user_id`.
  - Step B fires only rows where `last_fired_at===null || enqueued_at>last_fired_at`; skips `retry_count>=3`; on missing `deploy_webhook_url` sets `last_fired_at` + error; on POST 2xx resets `retry_count`/`last_error`; on failure bumps `retry_count` keeping `last_fired_at` (→ retried). Mock `fetch`.
  - **Overlap guard**: a second `tick()` while one is running returns immediately (no double fan‑out).
  - **Debounce snapshot**: a fresh `enqueued_at` landing during the fire keeps the row pending next cycle.
- **`bulkSchedulePublish` skip‑on‑conflict** (`use-publish-records.ts` helper, mock supabase): given existing `(content,lang)` keys, asserts only non‑duplicates are inserted, every inserted row carries `user_id`+`channel:'self_hosted'`+`status:'scheduled'`, and `{inserted,skipped}` is correct (incl. the all‑skip short‑circuit returning `{0, rows.length}`).
- **Calendar cell math** (`PublishCalendar` helper): given a month + a record list, asserts records bucket into the right day cells, leading/trailing blanks count, and month boundaries (extract the pure `buildMonthGrid(year,month,records)` helper).
- **Quick‑pick `makeTime(dayOffset, hour)`** + `BEST_POST_TIMES[lang]` selection — table test (verbatim port, lock behavior).
- **`schedule-distribution`** — **already tested** (Phase 1d/2 suite); reused unchanged, no new tests.
- **Meta `saveRecord` column mapping** (`publish.controller.ts`, mock admin) — asserts it writes `platform_post_id`/`published_url`/`metadata.title` (NOT `external_id`/`url`/`title`) and stamps `user_id` (the §8.1 delta).

**Faithful no‑ops noted (no test beyond presence):**
- `handlePublishNow` is a `alert(...)` no‑op (CF parity) — a render test asserting the alert text is optional.
- `NaverCopySection` is static.

**External / UI — manual** (no creds in CI, same policy as Phase 1/2):
- Real `SUPABASE_SERVICE_ROLE_KEY` → schedule a self_hosted record 1 min out → observe the tick flip it to `published` + (with a `deploy_webhook_url`) a webhook POST + `last_fired_at` set. Bulk wizard end‑to‑end (preview → confirm → counts update). Queue list/calendar toggle, filters, reschedule, delete, previews. `pnpm typecheck` + marketing/server suites green.

---

## 11. Risks & gotchas

- **R‑1 — service‑role key security (HIGH).** `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL RLS. It MUST live **server‑only** (`config.supabase.serviceRoleKey`, never `VITE_`‑prefixed, never imported into client code). The admin provider is server‑side only; no client module imports it. Documented in `.env.example` with a "NEVER expose to client" warning.
- **R‑2 — cron firing in dev (MED).** The `setInterval` runs in every server process, including local dev. Mitigation: it **no‑ops when `SUPABASE_SERVICE_ROLE_KEY` is unset** (the typical dev case). If a dev *does* set the key, the tick will flip real rows + POST real webhooks — acceptable (it's the dev's own Supabase) but call it out. The optional manual‑tick endpoint (§4.5) lets ops disable the interval and drive it externally if needed.
- **R‑3 — multi‑replica double‑fire (MED).** If the server is ever deployed with >1 replica, each runs its own interval → the UPDATE is idempotent (only one replica wins the `scheduled→published` race; the loser flips nothing) BUT the webhook could fire 2× in the same minute. The debounce (`enqueued_at>last_fired_at`) tolerates a duplicate POST (the site rebuild is idempotent). Acceptable for the single‑process target; if it becomes multi‑replica, move the loop behind a leader lock or the optional external‑cron endpoint. Note in CLAUDE.md.
- **R‑4 — `user_id` stamping on inserts (HIGH, recurring).** `mkt_publish_records` + `mkt_deploy_webhook_queue` are `user_id NOT NULL` under single‑owner RLS. Client inserts (`schedule`/`bulkSchedule`) MUST stamp `getCurrentUserId()`; the scheduler's queue upsert MUST carry the flipped record's `user_id`; the meta endpoint MUST stamp from the request body. The single most likely silent failure (gotcha (a)). Covered by the bulk + meta unit tests.
- **R‑5 — timezone in `datetime-local` (MED).** The reschedule input is `datetime-local` (browser‑local, no zone). `scheduled_at` is `timestamptz`. Convert local→ISO **with the user's offset** before writing (`new Date(localStr).toISOString()` interprets the local string in the browser's zone — correct for a single‑operator tool). `distributeSchedule` already emits UTC ISO (it parses `startDate+'T..:..Z'` as UTC — see its header comment); document that bulk slots are UTC‑anchored while manual reschedule is local‑anchored, so the displayed times differ by the operator's offset. Keep CF's behavior; flag for the operator.
- **R‑6 — unique‑index conflict on re‑schedule (MED).** `uniq_mkt_publish_self_hosted (content_id,language,channel) WHERE status IN ('scheduled','published')` means you cannot have two live self_hosted rows for the same content+language. `useSchedulePublish` therefore **upserts on `content_id,language,channel`** (CF parity) rather than insert; the bulk path **pre‑checks + skips** (§6.4). A row already `published` blocks a fresh `scheduled` for the same key — intended (CF behavior); the bulk wizard reports it as `skipped`.
- **R‑7 — ALTER on a table that may hold rows (LOW).** The migration migrates legacy `status`/`channel` values to the CF enum **before** adding the CHECK constraints, and drops the old pending index before adding the self_hosted one — idempotent and safe on the empty table (likely empty in dev) and on any populated one.
- **R‑8 — `@supabase/supabase-js` on the server (LOW).** Verify it's a dependency of `packages/server`; if only the client depends on it, add it. The provider import fails the build otherwise.

---

## 12. Sequenced implementation checklist (for the plan)

> **Recommended sub‑phase split**: **3a = data + scheduler** (migration + admin provider + scheduler service + bootstrap + unit tests) — the high‑value, fully‑testable backend; **3b = client UI** (dashboard/cards/wizard/queue/calendar/naver + hooks + route swap); **3c (optional) = meta endpoint**. 3a is independently shippable (the scheduler runs headless); 3b makes it operable; 3c is a thin secondary.

### 3a — Data + scheduler (backend)
1. **Migration** `2026-06-09-marketing-phase3-publish.sql`: ALTER `mkt_publish_records` (status/channel CHECK + indexes + swap partial index) + CREATE `mkt_deploy_webhook_queue` (+ owner RLS). Apply via Supabase MCP `apply_migration`.
2. **Config + env**: add `config.supabase.{url,serviceRoleKey}` + `config.cron.secret`; append `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` to `.env.example` (server‑only warning). Verify `@supabase/supabase-js` in `packages/server/package.json` (add if missing).
3. **`providers/supabase-admin.provider.ts`**: `getSupabaseAdmin()` graceful‑null singleton.
4. **`services/mkt/publish-scheduler.service.ts`**: `startPublishScheduler()` + `tick()` (overlap guard) + `flipDueSelfHosted` (Step A) + `fireDeployWebhooks` (Step B). Export `tick` for tests/manual.
5. **Bootstrap**: call `startPublishScheduler()` in `server.ts` listen callback.
6. **Types**: add `DeployWebhookQueueRow` to `types/database.ts` (client) — and a server‑side type if needed.
7. **Unit tests**: scheduler tick (Step A/B, overlap, debounce, retry≤3) with mocked admin client + mocked `fetch`.

### 3b — Client UI + hooks + route
8. **`api/queries.ts`**: add `publishRecords` + `publishCounts` keys.
9. **`api/use-publish-records.ts`**: `usePublishRecords`, `useFetchPublishCountsByLanguage`, `useSchedulePublish` (upsert+stamp), `useBulkSchedulePublish` (skip‑on‑conflict+stamp), `useCancelPublish`, `useUpdateScheduledAt`. Reuse `getCurrentUserId()`.
10. **Components** `components/publish/`: `PublishDashboard`, `ChannelCards`, `SelfHostedCard`, `BulkScheduleDialog` (reuse `distributeSchedule`), `PublishQueue` (+ extracted `PublishCalendar`), `NaverCopySection`. Reuse `BlogPreviewDialog`. Faithful no‑op `handlePublishNow`.
11. **`pages/PublishPage.tsx`** (project guard) + `index.ts` export.
12. **Route swap**: `router/index.tsx:316` placeholder → `<PublishPage/>`. (Sidebar nav already present.)
13. **Unit tests**: `bulkSchedulePublish` skip logic, `buildMonthGrid` calendar math, `makeTime`/`BEST_POST_TIMES`.

### 3c — Meta endpoint (optional/secondary)
14. **`controllers/mkt/publish.controller.ts`** `metaPublish` + `mkt.routes.ts` `POST /publish/meta`; canonical‑column `saveRecord` (§8.1) via admin client + `user_id` stamp. Un‑wired (document). Unit test the column mapping.

### Docs
15. Update `features/marketing/CLAUDE.md` (publish module section + the `mkt_publish_records` ALTER note + the `setInterval` scheduler + `supabase-admin.provider` + the meta‑un‑wired/youtube‑deferred scoping + the new `/api/mkt/publish/*` rows + route tree), root CLAUDE.md `/marketing` line (Phase 3 발행 done), and memory `marketing-port-contentflow-2026-06-07.md`.
16. `pnpm typecheck` + `lint` + marketing/server suites green; manual end‑to‑end with a real service‑role key (§10).

---

## 13. Cited references

**ContentFlow (port source)**
- `src/components/publish/{publish-dashboard,channel-cards,self-hosted-card,bulk-schedule-dialog,publish-queue,naver-copy-section}.tsx` — UI (publish‑queue 469 lines; `handlePublishNow` no‑op `:138`; `BEST_POST_TIMES` `:51`; quick‑pick `:295`; preview tables `:107‑121`).
- `src/stores/project-store.ts:1727‑1816` — `updatePublishedSite`, `schedulePublish` (`:1752`, upsert `content_id,language,channel`), `cancelPublish` (`:1772`), `bulkSchedulePublish` (`:1779`, skip‑on‑conflict), `fetchPublishCountsByLanguage` (`:1812`).
- `supabase/migrations/005_publish_records.sql` (base table + indexes) + `2026-05-18-self-hosted-channel.sql` (channel enum swap, `uniq_publish_self_hosted`, `deploy_webhook_queue`, pg_cron `publish-self-hosted`).
- `src/app/api/cron/fire-deploy-webhooks/route.ts` — the Vercel cron loop (pending filter, snapshot, retry≤3) ported into Step B.
- `src/app/api/publish/meta/route.ts` — Meta Graph publish (note stale `external_id`/`url`/`title` columns → canonical delta).
- `src/app/api/publish/{schedule,queue,youtube}/route.ts` — schedule/queue vestigial (UI bypasses), youtube dead (no caller).
- `src/types/database.ts` — `PublishedSite`, `PublishRecord`.

**Tangobook (worktree `feat/marketing-phase0`)**
- `supabase/migrations/2026-06-07-marketing-schema.sql:309‑331` — existing `mkt_publish_records` (wrong CHECK/index) + `:64‑67` `meta_credentials`/`wp_credentials`/`published_site` columns + `:431‑447` single‑owner RLS pattern.
- `packages/client/src/features/marketing/types/database.ts:99/111/135/165/467` — `WpCredentials`/`PublishedSite`/`MetaCredentials`, `Project.published_site`, `PublishRecord`.
- `…/lib/schedule-distribution.ts` — `distributeSchedule` (ported, tested) — reused.
- `…/components/content/BlogPreviewDialog.tsx` — reused for queue previews.
- `…/components/content/LanguageSelector.tsx` — simplified 1d version (no publish bar → meta un‑wired).
- `…/components/project/ProjectSettings.tsx:91/130` + `…/sections/PublishedSiteSection.tsx` — settings ALREADY built+wired.
- `…/api/queries.ts:18‑31` — `mktKeys` factory (add publish keys).
- `…/api/use-projects.ts` `useUpdateProject` — `published_site` write path (reused).
- `packages/server/src/server.ts:10‑18` — bootstrap (scheduler start spot) + `app.ts` (do NOT start there).
- `packages/server/src/services/storybook.service.ts:35` — module‑level `setInterval` precedent.
- `packages/server/src/config/index.ts` — `meta`/`youtubeApiKey` present; NO `supabase`/`serviceRole`/`cron` (add).
- `packages/server/src/routes/mkt.routes.ts` + `controllers/mkt/*` — route/controller patterns (add `publish/meta`, optional `publish/tick`).
- `packages/client/src/router/index.tsx:316` (placeholder → PublishPage) + `…/components/layout/Sidebar.tsx:18` (nav already present).

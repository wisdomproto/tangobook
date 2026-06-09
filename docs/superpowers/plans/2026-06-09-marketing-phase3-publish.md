# Marketing Phase 3 (발행 / Publish) Implementation Plan

> **Status: COMPLETE** — all chunks landed; migration applied; 388 marketing + 47 server mkt tests green; final review APPROVED (I-1 fixed in 7af8504).

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Each chunk is independently implementable + reviewable by a fresh subagent (implementer → spec-review → quality-review). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/marketing/publish` `PlaceholderPage` with a real **발행 관리** screen faithfully ported from ContentFlow, and add the **only real automation in the app**: a per‑minute Express scheduler that flips due `self_hosted` scheduled publish records to `published` and (debounced) fires each project's static‑site deploy webhook. The screen has: channel cards (one automated `self_hosted` card + 3 static placeholder cards), a publish queue (list + month calendar) with per‑row quick‑scheduling + channel previews, a 5‑stage bulk‑schedule wizard, and a static Naver manual‑copy card. A thin, **un‑wired** `POST /api/mkt/publish/meta` endpoint is ported as a secondary; **YouTube publish is deferred/out of scope.**

**Architecture:** Extends `packages/client/src/features/marketing/` (client UI + Supabase‑direct TanStack hooks) + `packages/server/src/{providers,services,controllers,routes}/` (the service‑role admin client + the scheduler `setInterval` + the meta endpoint). CF's two automation mechanisms (pg_cron + a Vercel cron route) collapse into **ONE Express `setInterval(tick, 60_000)`** started from `server.ts`'s listen callback. The client publish data layer writes the marketing Supabase client **directly** via TanStack Query hooks (CF parity — its store bypasses its own REST routes), so queue/schedule/bulk/cancel/reschedule are all client hooks; the scheduler uses a **service‑role** admin client to flip rows across all owners (bypassing RLS). `project_members` RLS → single‑owner `user_id = auth.uid()`.

**This phase is cheaper than expected** — Phase 0 already provisioned most of it (verified in the worktree):

- `mkt_publish_records` **already exists** (`supabase/migrations/2026-06-07-marketing-schema.sql:308`) — but with the wrong `status` default (`'pending'`, no CHECK), no `channel` CHECK, no `project_id`/`status`/`scheduled_at` indexes, and the wrong partial unique index (`…_pending_unique … WHERE status in ('pending','uploading')`). Phase 3 **ALTERs** it to CF's `self_hosted` shape — it does NOT re‑create it.
- `mkt_projects.published_site jsonb` (`:67`), `meta_credentials jsonb` (`:65`), `wp_credentials jsonb` (`:64`) **already exist**.
- TS interfaces `PublishedSite` (`types/database.ts:111`), `MetaCredentials` (`:135`), `WpCredentials` (`:99`), `PublishRecord` (`:467`), `Project.published_site` (`:165`) **all already exist**. Only `DeployWebhookQueueRow` is new.
- `PublishedSiteSection` is **fully built AND wired** into `ProjectSettings` (tab "발행사이트", `ProjectSettings.tsx:92/131` → `sections/PublishedSiteSection.tsx`, writes `onUpdate({ published_site })` → `useUpdateProject`). Decision #6 is **DONE** — Phase 3 only verifies it. The section already manages `deploy_webhook_url` (`:124`), exactly the shape the scheduler reads.
- Sidebar nav `{ to:'/marketing/publish', icon:'🚀', label:'발행' }` (`Sidebar.tsx:18`) + route `{ path:'publish', element:<PlaceholderPage title="발행 관리"/> }` (`router/index.tsx:316`) **already exist** — Phase 3 just swaps the route element.
- `BlogPreviewDialog` exists (`components/content/BlogPreviewDialog.tsx`, props `{ open, onOpenChange, cards, title }`) — reuse for queue previews.
- `distributeSchedule` is **already ported with passing tests** (`lib/schedule-distribution.ts`, `DistributeInput`/`DistributedSlot`/`distributeSchedule`). Reuse; do NOT re‑port.
- `getCurrentUserId()` is centralized at `api/supabase.ts:8` (the Phase 1d O‑2 open item is already resolved). Reuse for insert stamping.

So Phase 3's real work is: **(1)** a migration that ALTERs `mkt_publish_records` + CREATEs `mkt_deploy_webhook_queue`; **(2)** a server service‑role admin provider + the scheduler `setInterval` (the heart); **(3)** the client publish UI + data hooks; **(4)** route swap; **(5)** the thin un‑wired meta endpoint. Spec: `docs/superpowers/specs/2026-06-09-marketing-phase3-publish-design.md` (read it fully — data model §3, scheduler §4, components §5, hooks §6, settings/route §7, meta §8, testing §10, risks §11, sequenced checklist §12).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + Express v5 + `@supabase/supabase-js` (`^2.104.0` — present in client, **must be added to server**). Node ≥ 20 (global `fetch`). External (runtime, optional): Supabase service‑role, a project's `deploy_webhook_url`, Meta Graph v21.0. Tests: vitest + @testing-library/react (jsdom).

**Conventions (match Phase 0 / 1a–1d / 2 — spec §2, marketing `CLAUDE.md`):**
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.** Publish records / counts live in the TanStack cache; bulk‑wizard preview rows are transient component state until confirmed.
- Files: **PascalCase** components (`PublishDashboard.tsx`, `SelfHostedCard.tsx`, `PublishQueue.tsx`, …), **camelCase** data/util/hook files (`use-publish-records.ts`). Named exports for components (pages default). ContentFlow used kebab-case files — rename on port.
- Client UI primitives from `../../ui/<name>` (e.g. `import { Button } from '../../ui/button'`), NOT `@/components/ui/*`. `cn` from `../../lib/utils`. Types from `../../types/database`. Icons from `lucide-react`. Drop every `'use client'`; replace `next/image`/`<img>` eslint-disables with plain `<img>`.
- Server: `routes(URL) → controllers(req parse + asyncHandler) → services(logic, AppError throw) → providers/external`. Response envelope `res.json({ success: true, data })`; failure `throw new AppError(status, msg)` (errorMiddleware). Controllers use `asyncHandler` (`middleware/async-handler.js`). Server import paths use the `.js` extension (ESM). `config` from `../config/index.js` (providers) / `../../config/index.js` (services).
- Client inserts into `mkt_publish_records` MUST stamp `user_id` (`getCurrentUserId()` from `api/supabase.ts`) — single‑owner RLS / NOT NULL (gotcha R‑4, the #1 silent failure). The scheduler's queue upsert MUST carry the flipped record's `user_id`. The meta endpoint MUST stamp `user_id` from the request body. `published_site` writes go through the **existing** `useUpdateProject({ id, updates: { published_site } })` (owner row, no extra stamp).
- Commit after every task. Commit messages in English. End each with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Port-task pattern** (verbatim/near-verbatim UI where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, `@/stores/project-store` → the new TanStack hooks + `ui-store`) → strip `'use client'` + Next `<img>` disables → adapt CF→worktree deltas (Supabase‑direct hooks, `mkt_` table names, canonical meta columns, `user_id` stamp, the faithful `handlePublishNow` no‑op) → **typecheck → build → manual-verify in `/marketing/publish` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit): the scheduler tick (Step A flip + Step B webhook fire, overlap guard, debounce snapshot, retry≤3), the `bulkSchedulePublish` skip‑on‑conflict helper, the calendar `buildMonthGrid` cell math, the `makeTime`/`BEST_POST_TIMES` quick‑pick helper, and the meta `saveRecord` canonical‑column mapping. @superpowers:verification-before-completion before any "done" claim in Chunk 9.

---

## Verification commands (confirmed against worktree `package.json` scripts)

| Purpose | Command |
|---|---|
| Client typecheck | `pnpm --filter @tangobook/client typecheck` (alias of `pnpm --filter client typecheck` → `tsc --noEmit`) |
| Server typecheck | `pnpm --filter @tangobook/server typecheck` (→ `tsc --noEmit`) |
| All-package typecheck | `pnpm typecheck` (shared → server → client) |
| Client marketing tests | `pnpm --filter @tangobook/client test marketing` (`test` = `vitest run`; the arg is a path substring filter). Per-file e.g. `pnpm --filter @tangobook/client test use-publish-records` / `… buildMonthGrid`. |
| Server marketing tests | `pnpm --filter @tangobook/server test mkt` (or per-file `pnpm --filter @tangobook/server test publish-scheduler` / `… publish.controller`). |
| Lint | `pnpm lint` (`eslint packages --ext .ts,.tsx`) |
| Client build | `pnpm --filter @tangobook/client build` (`vite build`). **Server has no build step in this repo** — `tsx` runtime; `pnpm --filter @tangobook/server typecheck` covers it. |
| Install (after server dep add) | `pnpm install` (workspace root) |

> **Marketing test baseline (verified):** 54 client marketing `*.test.ts(x)` files exist today (Phase 1a–1d + Phase 2 `keyword-sort` + `use-saved-keywords`), and 6 server `mkt` test files. Phase 3 adds **4 new test files** (server `publish-scheduler` + `publish.controller`; client `use-publish-records` + `buildMonthGrid` — the last may share a file with `makeTime`). Pre-existing non-marketing failures (auth `RequireAuthedWithPin`, games `SpeakingPlayer`, viewer `GameListViewer` — jsdom `window.matchMedia`) are unchanged and out of scope.

---

## File Structure

```
supabase/migrations/
  2026-06-09-marketing-phase3-publish.sql   NEW  ALTER mkt_publish_records + CREATE mkt_deploy_webhook_queue (+ owner RLS)

packages/server/
  package.json                              EDIT add "@supabase/supabase-js": "^2.104.0" (matches client)
  .env.example                              EDIT append SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET (server-only warning)
  src/config/index.ts                       EDIT add config.supabase.{url,serviceRoleKey} + config.cron.secret
  src/providers/supabase-admin.provider.ts  NEW  getSupabaseAdmin() — service-role singleton, graceful null
  src/services/mkt/
    publish-scheduler.service.ts            NEW  startPublishScheduler() + tick() + flipDueSelfHosted (A) + fireDeployWebhooks (B)
    publish.service.ts                      NEW  publishToMeta() (Graph v21.0) + saveMetaRecord() canonical-column mapping
    __tests__/
      publish-scheduler.service.test.ts     NEW  TDD: Step A/B, overlap guard, debounce, retry≤3 (mocked admin + fetch)
      publish.service.test.ts               NEW  TDD: saveMetaRecord canonical column mapping + user_id stamp
  src/controllers/mkt/publish.controller.ts NEW  metaPublish (thin, un-wired)
  src/routes/mkt.routes.ts                  EDIT register POST /publish/meta
  src/server.ts                             EDIT call startPublishScheduler() in app.listen callback

packages/client/src/features/marketing/
  types/database.ts                         EDIT add DeployWebhookQueueRow (PublishRecord/PublishedSite/Project.published_site already exist)
  api/
    queries.ts                              EDIT add mktKeys.publishRecords + mktKeys.publishCounts
    use-publish-records.ts                  NEW  usePublishRecords / useFetchPublishCountsByLanguage / useSchedulePublish / useBulkSchedulePublish / useCancelPublish / useUpdateScheduledAt
    use-projects.ts                         REUSE useProject / useUpdateProject (published_site write) — NO change
    supabase.ts                             REUSE getCurrentUserId() — NO change
    __tests__/
      use-publish-records.test.ts           NEW  TDD: bulkSchedulePublish skip-on-conflict pure helper (+ stamp/channel/status)
  lib/
    publish-calendar.ts                     NEW  pure buildMonthGrid(year,month,records) cell math — TDD
    publish-times.ts                        NEW  pure makeTime(dayOffset,hour) + BEST_POST_TIMES[lang] — TDD
    schedule-distribution.ts                REUSE distributeSchedule (ported, tested) — NO change
    __tests__/
      publish-calendar.test.ts              NEW  buildMonthGrid bucketing + blanks + boundaries
      publish-times.test.ts                 NEW  makeTime + BEST_POST_TIMES table test
  components/publish/                        NEW directory
    PublishDashboard.tsx                     NEW  header + ChannelCards + PublishQueue + NaverCopySection
    ChannelCards.tsx                         NEW  SelfHostedCard + 3 static cards (connected = !!meta_credentials)
    SelfHostedCard.tsx                       NEW  reads published_site; counts per language; "일괄 예약 +" → BulkScheduleDialog
    BulkScheduleDialog.tsx                   NEW  5-stage wizard (content → language → params → preview via distributeSchedule → confirm via bulkSchedule)
    PublishQueue.tsx                         NEW  list+calendar toggle, filters, per-row reschedule/quick-pick/즉시발행(no-op)/delete, previews
    PublishCalendar.tsx                      NEW  month grid (uses buildMonthGrid)
    NaverCopySection.tsx                     NEW  static manual-copy card
  pages/
    PublishPage.tsx                          NEW  project guard → <PublishDashboard projectId={…}/>
  index.ts                                   EDIT export PublishPage

packages/client/src/router/index.tsx        EDIT line 316: PlaceholderPage → <PublishPage/> (+ import)
```

### Chunk dependency order (each chunk independently runnable in this order)

| Chunk | Title | Depends on | Independently testable / verifiable | TDD |
|---|---|---|---|---|
| **1** | DB migration (ALTER + CREATE + RLS) | — | `.sql` reviewed; applied via Supabase MCP at Chunk 9 (deliverable = the file) | no |
| **2** | Types — `DeployWebhookQueueRow` | — | `pnpm --filter @tangobook/client typecheck` | no |
| **3** | Server dep + config + admin provider | 2 | `pnpm --filter @tangobook/server typecheck` (provider compiles, graceful null) | no |
| **4** | Scheduler service + bootstrap | 1, 3 | `pnpm --filter @tangobook/server test publish-scheduler` (FAIL→PASS) + typecheck | **YES** |
| **5** | Meta publish endpoint (thin, un-wired) | 3 | `pnpm --filter @tangobook/server test publish.controller`/`publish.service` + typecheck | **YES** (column map) |
| **6** | Client hooks + keys + pure helpers | 1, 2 | `… test use-publish-records` + `… test publish-calendar` + `… test publish-times` (FAIL→PASS) + typecheck | **YES** (3 helpers) |
| **7a** | UI: SelfHostedCard + BulkScheduleDialog | 6 | typecheck + build (behind placeholder) | no |
| **7b** | UI: PublishQueue + PublishCalendar + previews | 6 | typecheck + build | no |
| **7c** | UI: PublishDashboard + ChannelCards + NaverCopySection | 7a, 7b | typecheck + build | no |
| **8** | Route/nav wiring + PublishPage | 7c | typecheck + manual E2E of `/marketing/publish` | no |
| **9** | Final integration (apply migration + full gates + docs) | 1–8 | apply migration (Supabase MCP) + full suite/typecheck/lint/build + manual E2E | no |

> **Sub-phase split (spec §12):** **3a = data + scheduler** (Chunks 1–4, the high-value fully-testable backend; independently shippable — the scheduler runs headless once a service-role key is set). **3b = client UI** (Chunks 6–8; makes it operable). **3c = meta endpoint** (Chunk 5; a thin secondary, can land any time after Chunk 3). The **R‑4 `user_id` stamping** discipline is the #1 correctness risk — every `mkt_publish_records` / queue insert stamps the owner; covered by the `use-publish-records` + `publish.service` unit tests. **Do not skip those tests.**

---

## Chunk 1: DB migration — ALTER `mkt_publish_records` + CREATE `mkt_deploy_webhook_queue`

> Reconciles the Phase-0 `mkt_publish_records` (wrong status default/CHECK, no channel CHECK, no project/status/scheduled indexes, wrong pending unique index) to CF's `self_hosted` shape, and adds the one genuinely-new table `mkt_deploy_webhook_queue` (debounce) with owner RLS. **Idempotent ALTERs** (the table already exists and may hold rows) — migrate legacy values BEFORE adding constraints; swap the partial unique index. The `.sql` file is the deliverable; it is **applied via Supabase MCP `apply_migration` at Chunk 9** (project ref `fxzwigjkbsptvsjraqwa`). No code depends on this chunk until Chunk 4 (scheduler) / Chunk 6 (hooks), which run against the migrated DB.

**Files:**
- Create: `supabase/migrations/2026-06-09-marketing-phase3-publish.sql`

- [ ] **Step 1 (write the migration):** Verbatim from spec §3.2. Match the existing migration's style (lowercase SQL, `mkt_` prefix, `create policy … for all using(...) with check(...)`, single-owner RLS):

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

- [ ] **Step 2 (review only — DO NOT apply yet):** Re-read against spec §3.1/§3.2. Confirm: (i) the unique index key column order is `(content_id, language, channel)` (CF order) scoped `channel='self_hosted' AND status IN ('scheduled','published')`; (ii) legacy `update`s run BEFORE the `add constraint` (R‑7); (iii) `mkt_projects.published_site` is NOT touched (it already exists — Phase 0 `:67`); (iv) NO pg_cron / `cron.schedule` block (the per-minute logic is the Express tick, Chunk 4). The migration is applied in **Chunk 9**, not here (so the scheduler/hook chunks build against the migrated schema in one integration pass).
- [ ] **Step 3:** Commit:
  ```bash
  git add supabase/migrations/2026-06-09-marketing-phase3-publish.sql
  git commit -m "feat(marketing): Phase 3 publish migration (ALTER mkt_publish_records + mkt_deploy_webhook_queue)"
  ```

> **R‑7 (LOW):** The ALTER migrates legacy `status`/`channel` values to the CF enum before adding the CHECK constraints and drops the old pending index before adding the self_hosted one — idempotent and safe on an empty table (likely empty in dev) and on any populated one.

---

## Chunk 2: Types — `DeployWebhookQueueRow`

> Lands the one new TS type. **Do not re-add** `PublishRecord` (`database.ts:467`), `PublishedSite` (`:111`), `MetaCredentials` (`:135`), `WpCredentials` (`:99`), or `Project.published_site` (`:165`) — all already exist (verified). No external calls, no UI.

**Files:**
- Modify: `packages/client/src/features/marketing/types/database.ts`

- [ ] **Step 1 (impl):** Add the `DeployWebhookQueueRow` interface (place it just after `PublishRecord`, `:483`):
  ```ts
  export interface DeployWebhookQueueRow {
    project_id: string;
    user_id: string;
    enqueued_at: string;
    last_fired_at: string | null;
    retry_count: number;
    last_error: string | null;
  }
  ```
  > `PublishRecord.channel`/`status` stay typed `string` (the UI narrows them with literal unions at the call site); no change. `Project.published_site?: PublishedSite | null` is already present (`:165`).
- [ ] **Step 2 (typecheck):** `pnpm --filter @tangobook/client typecheck` → **PASS**.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/types/database.ts
  git commit -m "feat(marketing): add DeployWebhookQueueRow type (publish scheduler queue row)"
  ```

---

## Chunk 3: Server — `@supabase/supabase-js` dep + config + service-role admin provider

> The server currently does **not** depend on `@supabase/supabase-js` (verified — present in `packages/client`, ABSENT in `packages/server`). Add it, add the `config.supabase` + `config.cron` blocks, document the env in `.env.example` (server-only), and add the graceful-null service-role singleton. No scheduler logic yet (Chunk 4 consumes this).

**Files:**
- Modify: `packages/server/package.json`
- Modify: `packages/server/src/config/index.ts`
- Modify: `packages/server/.env.example`
- Create: `packages/server/src/providers/supabase-admin.provider.ts`

- [ ] **Step 1 (dep):** Add to `packages/server/package.json` `dependencies` (use the **same version the client uses**, `^2.104.0`):
  ```jsonc
  "@supabase/supabase-js": "^2.104.0",
  ```
  Then run `pnpm install` (workspace root). Confirm the lockfile updates and the package resolves (`node -e "require('@supabase/supabase-js')"` from the server dir, or just rely on the Step 5 typecheck). **R‑8 (LOW):** the provider import fails the build if this is skipped.
- [ ] **Step 2 (config):** In `packages/server/src/config/index.ts`, add two new blocks inside the `config` object (alongside `naverDatalab`, before the closing `} as const;` at `:75`). All default `''` so the server still boots without them:
  ```ts
    supabase: {
      url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },

    cron: { secret: process.env.CRON_SECRET ?? '' }, // optional manual-tick guard (spec §4.5)
  ```
- [ ] **Step 3 (env):** In `packages/server/.env.example`, append (after the Naver Datalab block — match the file's existing comment style):
  ```
  # Supabase service-role (marketing publish scheduler — server-only, NEVER expose to client)
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  # Optional: guards the manual publish-tick debug endpoint
  CRON_SECRET=
  ```
  > **R‑1 (HIGH) — service-role key security:** `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL RLS. It MUST live server-only (`config.supabase.serviceRoleKey`, never `VITE_`-prefixed, never imported into client code). The admin provider is server-side only; no client module imports it.
- [ ] **Step 4 (provider):** Create `packages/server/src/providers/supabase-admin.provider.ts`. Mirror the existing provider-singleton pattern (`gemini.provider.ts` lazy `let _x = null`) + guest-mode graceful degradation (spec §4.1):
  ```ts
  import { createClient, type SupabaseClient } from '@supabase/supabase-js';
  import { config } from '../config/index.js';

  let _admin: SupabaseClient | null | undefined;

  /** Service-role Supabase client (bypasses RLS). null when env is unset. */
  export function getSupabaseAdmin(): SupabaseClient | null {
    if (_admin !== undefined) return _admin;
    const url = config.supabase.url;            // SUPABASE_URL ?? VITE_SUPABASE_URL
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
  > Use `undefined` (not `null`) as the "not-yet-resolved" sentinel so a missing-env result (`null`) is cached and the warning logs once, not every call.
- [ ] **Step 5 (typecheck):** `pnpm --filter @tangobook/server typecheck` → **PASS** (the `@supabase/supabase-js` types resolve; `config.supabase`/`config.cron` exist).
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/server/package.json pnpm-lock.yaml packages/server/src/config/index.ts packages/server/.env.example packages/server/src/providers/supabase-admin.provider.ts
  git commit -m "feat(marketing): add @supabase/supabase-js server dep + config.supabase/cron + service-role admin provider"
  ```

---

## Chunk 4: Server — publish scheduler service + bootstrap (TDD)

> The heart. ONE module-level `setInterval(tick, 60_000)` with an **overlap guard**, started once from `server.ts`'s listen callback (NOT `app.ts` — `createApp` is imported by tests; starting an interval there leaks timers into the test process — verified both files import `createApp`). The tick = Step A (flip due `self_hosted` `scheduled`→`published` + enqueue webhook) then Step B (fire debounced webhooks, retry≤3). Graceful no-op when the admin client is null. Export `tick` (or the two step fns) for tests. **TDD the tick algorithm with a mocked admin client + mocked `fetch`.**

**Files:**
- Create: `packages/server/src/services/mkt/publish-scheduler.service.ts`
- Test: `packages/server/src/services/mkt/__tests__/publish-scheduler.service.test.ts`
- Modify: `packages/server/src/server.ts`

- [ ] **Step 1 (test — write the failing tests first):** Build an in-memory fake admin client whose `.from(table)` returns a thenable query-builder that records calls and resolves canned data (the shape supabase-js exposes: `.update().eq().eq().lte().select()`, `.upsert(rows,{onConflict})`, `.select()`, `.select().eq().maybeSingle()`, `.update().eq()`). Mock `getSupabaseAdmin` to return the fake; mock global `fetch`. Inject the fake by exporting the step fns with an `admin` param (e.g. `flipDueSelfHosted(admin)`, `fireDeployWebhooks(admin)`, and a test-only `tick()` that reads `getSupabaseAdmin()`). Cover (spec §10):
  - **Step A flip:** updates only `status='scheduled' AND channel='self_hosted' AND scheduled_at<=now`; the `update().select('project_id, user_id')` rows are upserted DISTINCT-by-project into `mkt_deploy_webhook_queue` with `enqueued_at=now` and each row's `user_id` stamped; future / `draft` / non-`self_hosted` rows are never matched (assert the `.eq('status','scheduled').eq('channel','self_hosted').lte('scheduled_at',nowIso)` filter chain). Empty flip → no queue upsert.
  - **Step B fire:** fires only rows where `last_fired_at===null || enqueued_at>last_fired_at`; skips `retry_count>=3`; on missing `published_site.deploy_webhook_url` sets `last_fired_at=snapshot` + `last_error`; on POST 2xx resets `retry_count=0`/`last_error=null` with `last_fired_at=snapshot`; on POST failure (non-2xx or throw) bumps `retry_count` and leaves `last_fired_at` unchanged (→ retried next tick). Assert `fetch` is called with the right url + `{ method:'POST' }`.
  - **Overlap guard:** a second `tick()` entered while the first is mid-flight returns immediately (no second flip/fan-out). Drive by making the fake's first call hang on a deferred promise, call `tick()` twice, assert Step A ran once.
  - **Debounce snapshot:** `last_fired_at` is set to the `enqueued_at` value read at the start of the fire (the snapshot), NOT `Date.now()` — so a fresh enqueue during the fire window keeps the row pending next cycle.

  Skeleton:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  // Mock the provider so the service uses our fake admin.
  vi.mock('../../../providers/supabase-admin.provider.js', () => ({
    getSupabaseAdmin: vi.fn(),
  }));
  import { getSupabaseAdmin } from '../../../providers/supabase-admin.provider.js';
  import { flipDueSelfHosted, fireDeployWebhooks } from '../publish-scheduler.service.js';
  // (export these two + tick from the service for testability)

  // helper: a chainable fake that records the last update/upsert payload
  function makeFakeAdmin(seed: { flipped?: any[]; queue?: any[]; projects?: Record<string, any> }) { /* … */ }

  describe('flipDueSelfHosted (Step A)', () => {
    it('flips only scheduled+self_hosted+due rows and upserts DISTINCT projects with user_id', async () => { /* … */ });
    it('no-ops the queue upsert when nothing is due', async () => { /* … */ });
  });

  describe('fireDeployWebhooks (Step B)', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    it('fires only pending rows (enqueued_at>last_fired_at or null), POSTs the webhook, resets retry on 2xx', async () => { /* … */ });
    it('skips retry_count>=3', async () => { /* … */ });
    it('bumps retry_count and keeps last_fired_at on POST failure', async () => { /* … */ });
    it('sets last_fired_at + error when deploy_webhook_url missing (no fetch)', async () => { /* … */ });
    it('snapshots enqueued_at (not now) so a fresh enqueue re-fires next cycle', async () => { /* … */ });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test publish-scheduler` → **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `publish-scheduler.service.ts` (spec §4.2). Module-level interval + overlap guard; export `startPublishScheduler`, `tick`, `flipDueSelfHosted`, `fireDeployWebhooks`:
  ```ts
  import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { PublishedSite } from ... // OR an inline minimal shape { deploy_webhook_url?: string }

  const TICK_MS = 60_000;
  const MAX_RETRY = 3;
  let running = false;
  let timer: NodeJS.Timeout | null = null;

  export function startPublishScheduler(): void {
    const admin = getSupabaseAdmin();
    if (!admin) return;     // graceful no-op (env unset) — provider already logged
    if (timer) return;      // already started
    timer = setInterval(() => { void tick(); }, TICK_MS);
    void tick();            // fire once on boot so a restart doesn't wait a full minute
    console.warn('[mkt] publish scheduler started (60s tick).');
  }

  export async function tick(): Promise<void> {
    if (running) return;    // overlap guard
    running = true;
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return;
      await flipDueSelfHosted(admin);
      await fireDeployWebhooks(admin);
    } catch (err) {
      console.error('[mkt] publish tick error:', (err as Error).message);
    } finally {
      running = false;
    }
  }

  export async function flipDueSelfHosted(admin: SupabaseClient): Promise<void> { /* spec §4.2 Step A */ }
  export async function fireDeployWebhooks(admin: SupabaseClient): Promise<void> { /* spec §4.2 Step B */ }
  ```
  - **Step A** (spec §4.2 Step A, faithful translation of CF's pg_cron `UPDATE … RETURNING` + queue upsert):
    1. `const nowIso = new Date().toISOString();`
    2. `update({ status:'published', published_at:nowIso, updated_at:nowIso }).eq('status','scheduled').eq('channel','self_hosted').lte('scheduled_at',nowIso).select('project_id, user_id')` → the returned set is exactly the transitioned rows (reproduces `RETURNING project_id`).
    3. If empty → return.
    4. DISTINCT `project_id` carrying any `user_id` (single-owner → all records of a project share the owner): `const byProject = new Map<string,string>(); for (const r of flipped) if (!byProject.has(r.project_id)) byProject.set(r.project_id, r.user_id);`
    5. `upsert(rows,{ onConflict:'project_id' })` where `rows = [...byProject].map(([project_id,user_id]) => ({ project_id, user_id, enqueued_at: nowIso }))` — bumps `enqueued_at` so a recently-fired project re-fires. **`user_id` stamp required** (NOT NULL).
  - **Step B** (spec §4.2 Step B, faithful translation of the Vercel cron loop):
    1. `select('project_id, enqueued_at, last_fired_at, retry_count, last_error')` over the whole queue.
    2. PostgREST can't compare two columns → filter in JS: `pending = all.filter(r => r.last_fired_at===null || new Date(r.enqueued_at).getTime() > new Date(r.last_fired_at).getTime())`. Empty → return.
    3. For each pending row: `if (row.retry_count >= MAX_RETRY) continue;` `const snapshotFiredAt = row.enqueued_at;` read `mkt_projects.published_site` (`select('published_site').eq('id',row.project_id).maybeSingle()`); `const url = (project?.published_site as PublishedSite|null)?.deploy_webhook_url;`. If no url → `update({ last_fired_at: snapshotFiredAt, last_error:'deploy_webhook_url not configured' }).eq('project_id', row.project_id)` + continue. Else `try { const r = await fetch(url,{ method:'POST', body: JSON.stringify({}) }); if (!r.ok) throw new Error('HTTP '+r.status); update({ last_fired_at: snapshotFiredAt, retry_count:0, last_error:null }) } catch { update({ retry_count: row.retry_count+1, last_error: msg }) }` (both `.eq('project_id', row.project_id)`).
  - `fetch` is global (Node ≥ 18; server runs tsx/Node 20) — no import.
- [ ] **Step 4 (run):** `pnpm --filter @tangobook/server test publish-scheduler` → **PASS** (all cases). `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 5 (bootstrap):** In `packages/server/src/server.ts`, import + call `startPublishScheduler()` inside the `app.listen` callback, after the prewarms (`:16‑17`):
  ```ts
  import { startPublishScheduler } from './services/mkt/publish-scheduler.service.js';
  // …inside app.listen callback, after prewarmPhonicsLibraryCache():
    startPublishScheduler(); // no-op when SUPABASE_SERVICE_ROLE_KEY unset
  ```
  > **Do NOT** start it in `app.ts` (`createApp` is shared with tests → timer leak). `startPublishScheduler()` self-guards on the admin client, so dev machines without the service-role key log + do nothing (R‑2).
- [ ] **Step 6 (typecheck):** `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/server/src/services/mkt/publish-scheduler.service.ts packages/server/src/services/mkt/__tests__/publish-scheduler.service.test.ts packages/server/src/server.ts
  git commit -m "feat(marketing): publish scheduler setInterval (flip self_hosted + fire deploy webhooks, retry<=3) + bootstrap + tests"
  ```

> **R‑2 (MED) — cron in dev:** the interval runs in every server process incl. local dev; it no-ops when the service-role key is unset (typical dev). If a dev sets the key, the tick flips real rows + POSTs real webhooks against the dev's own Supabase — acceptable, call it out. **R‑3 (MED) — multi-replica:** if ever deployed >1 replica, the UPDATE is idempotent (one replica wins the flip) but the webhook could fire 2× / minute; the debounce tolerates a duplicate POST (site rebuild is idempotent). Acceptable for the single-process target; note in CLAUDE.md. **R‑6 (MED) — flip vs unique index:** the flip keeps `channel='self_hosted'` and moves `scheduled`→`published`, both inside the `uniq_mkt_publish_self_hosted` predicate `status IN ('scheduled','published')` — since there was one live row, the UPDATE introduces no duplicate.

> **(Optional, default OMIT) manual-tick endpoint (spec §4.5):** a `POST /api/mkt/publish/tick` (Bearer `config.cron.secret`, 401 otherwise) calling `tick()` once and returning `{ flipped, fired, skipped }`. Stretch only — lets ops force a cycle / drive an external scheduler in a multi-replica future. Skip unless explicitly requested.

---

## Chunk 5: Server — Meta publish endpoint (thin, un-wired) (TDD the column map)

> Port CF's `POST /api/publish/meta` (Meta Graph v21.0: IG container+publish / FB feed w/ optional `scheduled_publish_time` / Threads container+publish) into a new `publish.service.ts` (`publishToMeta`) + `publish.controller.ts` (`metaPublish`) + a `mkt.routes.ts` line. **Key delta vs CF (spec §8.1):** CF's `saveRecord` writes stale flat columns `external_id`/`url`/`title` that do **NOT** exist on `mkt_publish_records`; the canonical schema uses `platform_post_id`/`published_url`/`metadata.title`. Use the **service-role** admin client for the insert (no `auth.uid()` cookie server-side) and **stamp `user_id` from the request body**. The endpoint is exposed but **NOT wired to any callsite** (CF's only caller — the publish bar in `language-selector.tsx` — was not ported; the worktree `LanguageSelector` is the simplified 1d translate-only version). This is secondary; it can land any time after Chunk 3. **`mkt/external/meta-graph.ts` already exists** but only has 501 `getAdInsights`/`exchangeToken` stubs (analytics, not publish) — leave it; put the publish logic in the new `publish.service.ts`.

**Files:**
- Create: `packages/server/src/services/mkt/publish.service.ts`
- Create: `packages/server/src/controllers/mkt/publish.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/publish.service.test.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (test — canonical column mapping, TDD):** Extract the record-insert into a pure-ish `saveMetaRecord(admin, args)` and unit-test it with a mocked admin client. Assert it inserts `platform_post_id` / `published_url` (`''`) / `metadata.title` (NOT `external_id`/`url`/`title`), stamps `user_id`, sets `status` = `scheduledAt ? 'scheduled' : 'published'`, `language` defaults `'ko'`, and `published_at` falls back to `now` when not scheduled. Skeleton:
  ```ts
  import { describe, it, expect, vi } from 'vitest';
  import { saveMetaRecord } from '../publish.service.js';

  it('writes canonical columns (platform_post_id/published_url/metadata.title) + stamps user_id', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;
    await saveMetaRecord(admin, {
      userId: 'u1', projectId: 'p1', contentId: 'c1', channel: 'instagram',
      postId: 'IG_123', title: 'Hi', caption: 'caption', language: 'ko', scheduledAt: null,
    });
    const row = insert.mock.calls[0][0];
    expect(row.platform_post_id).toBe('IG_123');
    expect(row.published_url).toBe('');
    expect(row.metadata).toEqual({ title: 'Hi' });
    expect(row.user_id).toBe('u1');
    expect(row.status).toBe('published');
    expect('external_id' in row).toBe(false);
    expect('url' in row).toBe(false);
    expect('title' in row).toBe(false);
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test publish.service` → **FAIL**.
- [ ] **Step 3 (impl `publish.service.ts`):** Port the Graph calls (IG `media`→`media_publish`, FB `feed` w/ optional `scheduled_publish_time`, Threads `threads`→`threads_publish`) verbatim from CF `app/api/publish/meta/route.ts`, but route the record insert through `saveMetaRecord(admin, …)`:
  ```ts
  import type { SupabaseClient } from '@supabase/supabase-js';
  import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
  import { AppError } from '../../middleware/error.middleware.js';

  const GRAPH_URL = 'https://graph.facebook.com/v21.0';

  export interface MetaPublishInput {
    platform: 'instagram' | 'facebook' | 'threads';
    accessToken: string; pageId: string; caption?: string; imageUrl?: string;
    scheduledAt?: string | null; projectId?: string; contentId?: string;
    title?: string; language?: string; userId: string; // userId REQUIRED for stamp
  }

  export async function saveMetaRecord(admin: SupabaseClient, args: {
    userId: string; projectId?: string; contentId?: string; channel: string;
    postId: string; title?: string; caption?: string; language?: string; scheduledAt?: string | null;
  }): Promise<void> {
    if (!args.projectId) return;
    await admin.from('mkt_publish_records').insert({
      user_id: args.userId, project_id: args.projectId, content_id: args.contentId ?? null,
      channel: args.channel, status: args.scheduledAt ? 'scheduled' : 'published',
      language: args.language ?? 'ko',
      platform_post_id: args.postId,
      published_url: '',                                   // Graph returns an id, not a URL
      metadata: { title: args.title ?? args.caption?.slice(0, 100) ?? '' },
      published_at: args.scheduledAt ?? new Date().toISOString(),
      scheduled_at: args.scheduledAt ?? null,
    });
  }

  export async function publishToMeta(input: MetaPublishInput): Promise<{ postId: string }> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new AppError(502, 'Supabase 서비스 키가 설정되지 않았습니다.');
    if (!input.accessToken || !input.pageId) throw new AppError(400, 'Meta access token and page ID required');
    // …Graph container+publish per platform → postId…
    // await saveMetaRecord(admin, { ...mapped..., channel: input.platform, postId });
    // return { postId };
  }
  ```
  - Surface Graph error bodies as `AppError(400/502, message)` (CF returns the `error.message`).
  - **Stamp `user_id` from `input.userId`** (the client must send the owning user id; there is no server cookie). **R‑4.**
- [ ] **Step 4 (controller):** Create `publish.controller.ts`:
  ```ts
  import type { Request, Response } from 'express';
  import { asyncHandler } from '../../middleware/async-handler.js';
  import { AppError } from '../../middleware/error.middleware.js';
  import { publishToMeta, type MetaPublishInput } from '../../services/mkt/publish.service.js';

  /** POST /api/mkt/publish/meta  Body: MetaPublishInput (un-wired in this phase) */
  export const metaPublish = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Partial<MetaPublishInput>;
    if (!body.platform || !body.userId) throw new AppError(400, 'platform and userId are required');
    const data = await publishToMeta(body as MetaPublishInput);
    res.json({ success: true, data });
  });
  ```
- [ ] **Step 5 (route):** In `mkt.routes.ts`, import `metaPublish` and register it (add a `// ── Publish endpoints ──` section after the ideas routes, `:40`):
  ```ts
  import { metaPublish } from '../controllers/mkt/publish.controller.js';
  // …
  router.post('/publish/meta', metaPublish);
  ```
- [ ] **Step 6 (run + typecheck):** `pnpm --filter @tangobook/server test publish.service` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/server/src/services/mkt/publish.service.ts packages/server/src/controllers/mkt/publish.controller.ts packages/server/src/services/mkt/__tests__/publish.service.test.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): POST /api/mkt/publish/meta (un-wired) — canonical platform_post_id/metadata.title + user_id stamp"
  ```

> **YouTube publish is NOT ported (deferred, spec §8.2)** — CF's `/api/publish/youtube` is dead code (no caller; needs resumable upload + OAuth refresh). Document as deferred in CLAUDE.md (Chunk 9). A future phase may bridge marketing YouTube content to the existing `/api/longform` uploader — not now.

---

## Chunk 6: Client — publish data hooks + query keys + pure helpers (TDD)

> The Supabase-direct TanStack Query hooks for the queue/schedule/bulk/cancel/reschedule + counts (CF parity — its store writes Supabase directly), the two `mktKeys` additions, and the two pure lib helpers the UI needs (calendar cell math + quick-pick times). **TDD the load-bearing pure logic:** the `bulkSchedulePublish` skip-on-conflict helper, `buildMonthGrid`, and `makeTime`/`BEST_POST_TIMES`. The UI (Chunk 7) imports these tested pieces. Runs against the migrated DB (Chunk 1).

**Files:**
- Modify: `packages/client/src/features/marketing/api/queries.ts`
- Create: `packages/client/src/features/marketing/api/use-publish-records.ts`
- Create: `packages/client/src/features/marketing/lib/publish-calendar.ts`
- Create: `packages/client/src/features/marketing/lib/publish-times.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-publish-records.test.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/publish-calendar.test.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/publish-times.test.ts`

### Task 6.1: `mktKeys` additions (spec §3.4)

- [ ] **Step 1:** In `queries.ts`, add to the `mktKeys` factory (`:18‑31`, flat object):
  ```ts
  publishRecords: (projectId: string) => ['mkt', 'publish-records', projectId] as const,
  publishCounts:  (projectId: string) => ['mkt', 'publish-counts', projectId] as const,
  ```
- [ ] **Step 2 (typecheck):** `pnpm --filter @tangobook/client typecheck` → PASS. (Commit with Task 6.2.)

### Task 6.2: `use-publish-records.ts` + the `bulkSchedulePublish` skip-on-conflict helper (TDD)

> Faithful port of `project-store.ts:1727‑1816` adapted to TanStack + the marketing Supabase client + `getCurrentUserId()` stamping on insert. The skip-on-conflict logic in `bulkSchedule` is the load-bearing pure piece — **extract it as a testable pure function** `computeBulkInsertRows(rows, existingKeys, uid)` so the test doesn't need a full supabase mock for the algorithm.

- [ ] **Step 1 (test — skip-on-conflict, TDD):** Write the failing test for the pure helper (spec §6.4 / §10). Cover: given existing live `(content,language)` keys, only non-duplicates are inserted; every inserted row carries `user_id` + `channel:'self_hosted'` + `status:'scheduled'`; `{inserted,skipped}` is correct; the all-skip short-circuit returns `{inserted:0, skipped: rows.length}`.
  ```ts
  import { describe, it, expect } from 'vitest';
  import { computeBulkInsertRows } from '../use-publish-records';

  const r = (contentId: string, language: string) => ({ contentId, projectId: 'p1', language, scheduledAt: '2026-06-10T00:00:00Z' });

  describe('computeBulkInsertRows (skip-on-conflict + stamp)', () => {
    it('inserts only rows whose (content,language) is not already live, stamping user_id/channel/status', () => {
      const out = computeBulkInsertRows(
        [r('c1', 'ko'), r('c1', 'en'), r('c2', 'ko')],
        new Set(['c1::ko']), // c1/ko already live
        'u1',
      );
      expect(out.toInsert.map((x) => `${x.content_id}::${x.language}`)).toEqual(['c1::en', 'c2::ko']);
      expect(out.toInsert.every((x) => x.user_id === 'u1' && x.channel === 'self_hosted' && x.status === 'scheduled')).toBe(true);
      expect(out.skipped).toBe(1);
    });
    it('short-circuits when every row is a duplicate', () => {
      const out = computeBulkInsertRows([r('c1', 'ko')], new Set(['c1::ko']), 'u1');
      expect(out.toInsert).toHaveLength(0);
      expect(out.skipped).toBe(1);
    });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test use-publish-records` → **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `use-publish-records.ts` (spec §6). Export the pure `computeBulkInsertRows` + the hooks. Use `supabase` from `./supabase`, `getCurrentUserId` from `./supabase`, `mktKeys`, `useQueryClient` invalidation:
  - **`computeBulkInsertRows(rows, existingKey, uid)`** (pure):
    ```ts
    export function computeBulkInsertRows(
      rows: { contentId: string; projectId: string; language: string; scheduledAt: string }[],
      existingKey: Set<string>,
      uid: string,
    ) {
      const toInsert = rows
        .filter((r) => !existingKey.has(`${r.contentId}::${r.language}`))
        .map((r) => ({ user_id: uid, content_id: r.contentId, project_id: r.projectId,
          language: r.language, channel: 'self_hosted', status: 'scheduled', scheduled_at: r.scheduledAt }));
      return { toInsert, skipped: rows.length - toInsert.length };
    }
    ```
  - **`usePublishRecords(projectId)`** — `useQuery({ queryKey: mktKeys.publishRecords(projectId), enabled: !!projectId, queryFn })` selecting `*` `.eq('project_id', projectId).order('scheduled_at', { nullsFirst: false })` → `PublishRecord[]`.
  - **`useFetchPublishCountsByLanguage(projectId)`** (spec §6.2) — `useQuery({ queryKey: mktKeys.publishCounts(projectId), … })` selecting `language,status` `.eq('project_id', projectId).eq('channel','self_hosted')` → reduce to `Record<lang,{scheduled:number;published:number}>`.
  - **`useSchedulePublish()`** (spec §6.3) — `useMutation` upsert `{ user_id: await getCurrentUserId(), content_id, project_id, language, channel:'self_hosted', status:'scheduled', scheduled_at }` with `{ onConflict:'content_id,language,channel', ignoreDuplicates:false }`; invalidate both keys. **`user_id` stamp required (R‑4).**
  - **`useBulkSchedulePublish()`** (spec §6.4) — `useMutation` that: `uid = await getCurrentUserId()`; pre-check live self_hosted keys (`select('content_id, language').in('content_id', contentIds).eq('channel','self_hosted').in('status',['scheduled','published'])`) → `existingKey` Set; `const { toInsert, skipped } = computeBulkInsertRows(rows, existingKey, uid)`; if empty return `{ inserted:0, skipped }`; else `insert(toInsert).select()` → `{ inserted: data?.length ?? 0, skipped }`; invalidate both keys.
  - **`useCancelPublish()`** (spec §6.5) — `.delete().eq('id', recordId)`; invalidate both. (RLS scopes the delete; no stamp.)
  - **`useUpdateScheduledAt()`** (spec §6.6) — `.update({ scheduled_at }).eq('id', id)`; invalidate both. (Owned-row update; no stamp.)
  > **`published_site` writes are NOT here** — they reuse the existing `useUpdateProject({ id, updates: { published_site } })` (spec §6.7), already used by `PublishedSiteSection`. No new hook.
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/client test use-publish-records` → **PASS**. `pnpm --filter @tangobook/client typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/queries.ts packages/client/src/features/marketing/api/use-publish-records.ts packages/client/src/features/marketing/api/__tests__/use-publish-records.test.ts
  git commit -m "feat(marketing): publish-records hooks (Supabase-direct) + mktKeys + bulk skip-on-conflict helper (user_id stamp) + tests"
  ```

### Task 6.3: `publish-calendar.ts` — `buildMonthGrid` cell math (TDD)

> CF inlines the calendar in `publish-queue.tsx`; extract the pure month-grid math for testability (spec §5.5 / §10). `buildMonthGrid(year, month, records)` returns the weeks × 7 cells, each carrying the records whose `scheduled_at`/`published_at` date falls on that day, plus leading/trailing blanks.

- [ ] **Step 1 (test, TDD):** Failing test covering: a record buckets into the correct day cell; leading blank count = the 1st's weekday; total cells are a whole number of weeks (multiple of 7); a record dated in an adjacent month does not appear; month boundary (Feb / Dec→Jan). Use a fixed record with a known ISO date and assert it lands in the expected `(week,day)`.
  ```ts
  import { describe, it, expect } from 'vitest';
  import { buildMonthGrid } from '../publish-calendar';
  // records: Pick<PublishRecord,'id'|'scheduled_at'|'published_at'|'status'>[]
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test publish-calendar` → **FAIL**.
- [ ] **Step 3 (impl):** `buildMonthGrid(year, month, records)` — compute `first = new Date(year, month, 1)`, leading blanks = `first.getDay()`, days in month = `new Date(year, month+1, 0).getDate()`, pad trailing to a multiple of 7. For each day, filter records whose effective date (`scheduled_at ?? published_at`, parsed and compared by **local** Y/M/D to match the operator's view — see R‑5 note) equals that day. Return `{ cells: Array<{ day: number | null; records: T[] }>, weeks: number }` (or a `T[][]` of weeks — pick one and keep the test aligned).
  > **R‑5 (MED) — timezone:** the calendar buckets by the operator's local date (consistent with the `datetime-local` reschedule input, which is browser-local). `distributeSchedule` already emits UTC-anchored ISO. Document (Chunk 9) that bulk slots are UTC-anchored while manual reschedule + calendar display are local-anchored — they differ by the operator's offset (CF behavior; flag for the operator).
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/client test publish-calendar` → **PASS**; typecheck PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/publish-calendar.ts packages/client/src/features/marketing/lib/__tests__/publish-calendar.test.ts
  git commit -m "feat(marketing): pure buildMonthGrid calendar cell math (local-date bucketing) + tests"
  ```

### Task 6.4: `publish-times.ts` — `makeTime` + `BEST_POST_TIMES` quick-pick (TDD)

> Port CF's `makeTime(dayOffset, hour)` (`publish-queue.tsx:290`) + the `BEST_POST_TIMES[lang]` recommendation map (`:51`) verbatim into a pure module so the quick-pick is tested + reusable (spec §5.5 / §10).

- [ ] **Step 1 (test, TDD):** Table test: `makeTime(0, 19)` returns an ISO/`datetime-local`-shaped string for today at 19:00 local (assert the hour + that day-offset shifts the date by N days); `BEST_POST_TIMES['ko']` exists and `BEST_POST_TIMES[unknownLang]` falls back to `BEST_POST_TIMES.ko` (lock the CF default at `:301`).
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test publish-times` → **FAIL**.
- [ ] **Step 3 (impl):** Port `makeTime` + `BEST_POST_TIMES` (and a `pickBestTimes(lang)` returning `BEST_POST_TIMES[lang] ?? BEST_POST_TIMES.ko`) from CF verbatim. Keep `makeTime`'s output format identical to what the `datetime-local` input + `useUpdateScheduledAt` expect (the dashboard converts local→ISO with `new Date(localStr).toISOString()` before writing — R‑5).
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/client test publish-times` → **PASS**; typecheck PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/publish-times.ts packages/client/src/features/marketing/lib/__tests__/publish-times.test.ts
  git commit -m "feat(marketing): pure makeTime + BEST_POST_TIMES quick-pick helper (verbatim CF port) + tests"
  ```

---

## Chunk 7a: Client UI — `SelfHostedCard` + `BulkScheduleDialog`

> The automated channel card + the 5-stage bulk-schedule wizard. Port-task pattern (port → typecheck → manual-verify-deferred-to-Chunk-8 → commit). Reuses the **already-ported** `distributeSchedule` + the Chunk 6 hooks. Behind the placeholder until Chunk 8.

**Files:**
- Create: `packages/client/src/features/marketing/components/publish/SelfHostedCard.tsx`
- Create: `packages/client/src/features/marketing/components/publish/BulkScheduleDialog.tsx`

- [ ] **Step 1 (`SelfHostedCard.tsx`, port of `self-hosted-card.tsx`, spec §5.3):**
  - `const site = project.published_site; const enabled = !!site?.enabled;`
  - `!enabled` → dashed muted card "프로젝트 설정에서 사이트 등록·활성화 필요" (Globe icon).
  - `enabled` → header `내 사이트 ({new URL(site.domain).hostname})` + green ● 활성 + per-`active_languages` row `예약 {n} · 발행 {m}` from `useFetchPublishCountsByLanguage(project.id)` (default missing langs to `{scheduled:0,published:0}`) + a full-width "일괄 예약 +" button → opens `<BulkScheduleDialog/>` (local `open` state).
  - **Korean labels in the narrow card carry `break-keep`** (project RULE — verified in MEMORY).
  - Props `{ project: Project }`.
- [ ] **Step 2 (`BulkScheduleDialog.tsx`, port of `bulk-schedule-dialog.tsx`, 5-stage wizard, spec §5.4):** Stage state machine (CF parity), reusing `distributeSchedule`:
  1. **콘텐츠 선택** — multi-select list of the project's `mkt_contents` (`useContents(projectId)`) with category A–E filter; checkbox per content.
  2. **언어 선택** — from `published_site.active_languages` (checkbox set; default all active).
  3. **일정 파라미터** — `startDate` (date), `perWeek` (number), `weekdays` (0–6 toggles), `timeSlots` (CSV `'09:00,14:00'` → `string[]`), `langOffsetDays` (number) → map 1:1 to `DistributeInput` (`distributeSchedule` interface: `contentIds`, `languages`, `startDate`, `perWeek`, `weekdays`, `timeSlots`, `languageOffsetDays`).
  4. **미리보기** — `distributeSchedule({...})` → render `DistributedSlot[]` as a table (content title × language × scheduledAt). No DB writes.
  5. **확정** — build rows `{ contentId, projectId, language, scheduledAt }` from the preview → `useBulkSchedulePublish().mutateAsync(rows)` → `alert('{inserted}건 예약 완료 · {skipped}건 스킵')` → close (the hook invalidates `publishRecords`/`publishCounts`).
  - Wizard nav 이전/다음 gated by per-stage validity (≥1 content, ≥1 language, valid params).
  - Props `{ project: Project; open: boolean; onOpenChange: (o: boolean) => void }`. Reuse `Dialog` from `../../ui/dialog`.
- [ ] **Step 3 (typecheck):** `pnpm --filter @tangobook/client typecheck` → PASS. Grep the new files for no `@/components/ui/*` and no `'use client'`.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/publish/SelfHostedCard.tsx packages/client/src/features/marketing/components/publish/BulkScheduleDialog.tsx
  git commit -m "feat(marketing): SelfHostedCard + BulkScheduleDialog 5-stage wizard (reuse distributeSchedule + bulk hook)"
  ```

---

## Chunk 7b: Client UI — `PublishQueue` + `PublishCalendar` + previews

> The big one (CF `publish-queue.tsx`, 469 lines). List+calendar toggle, status/channel/language filters, per-scheduled-row reschedule (datetime-local + quick-pick) + faithful no-op "즉시 발행" + delete, the month calendar (using `buildMonthGrid`), and per-channel preview dialogs (reuse `BlogPreviewDialog`). Behind the placeholder until Chunk 8.

**Files:**
- Create: `packages/client/src/features/marketing/components/publish/PublishCalendar.tsx`
- Create: `packages/client/src/features/marketing/components/publish/PublishQueue.tsx`

- [ ] **Step 1 (`PublishCalendar.tsx`, spec §5.5):** Month grid (weeks × 7) consuming `buildMonthGrid(year, month, records)` (Chunk 6.3). Each day cell shows colored record chips (color by status: e.g. scheduled amber / published green / failed red / publishing blue / draft gray). Prev/next month nav (local `viewYear`/`viewMonth` state). Props `{ records: PublishRecord[]; onSelectRecord?: (r: PublishRecord) => void }`. No date math inline — all via the tested helper.
- [ ] **Step 2 (`PublishQueue.tsx`, port of `publish-queue.tsx`, spec §5.5):**
  - **Data:** `usePublishRecords(projectId)` → all records for the project.
  - **View toggle:** 목록(list) ⇄ 달력(calendar) (→ `<PublishCalendar/>`).
  - **Filters:** status (`all|draft|scheduled|publishing|published|failed`), channel, language — client-side over the fetched records.
  - **List rows:** channel icon, `metadata.title` (canonical title field — spec §8 delta; read `record.metadata?.title`), language flag, scheduled/published time, status pill. For `status==='scheduled'` rows: a `datetime-local` input → `useUpdateScheduledAt().mutate({ id, scheduled_at: new Date(localStr).toISOString() })` (R‑5 local→ISO); a **quick-pick** dropdown built from `makeTime`/`pickBestTimes(lang)` (Chunk 6.4); a green **"즉시 발행"** button → `handlePublishNow` (**FAITHFUL no-op**, see below); a delete button → `useCancelPublish().mutate(record.id)`.
  - **`handlePublishNow` (FAITHFUL no-op):** `alert('직접 발행은 현재 지원하지 않습니다. 내부 블로그 API를 통해 자동 발행됩니다.')` — exactly CF (`publish-queue.tsx:138‑139`). The `self_hosted` scheduler is the real publish path; manual publish stays a no-op. **KEEP — do not implement a real publish here.**
  - **Preview dialogs (per channel):** reuse the existing **`BlogPreviewDialog`** (`{ open, onOpenChange, cards, title }`) for naver/`self_hosted` previews — fetch the channel's cards on demand from the **`mkt_`** tables (`mkt_blog_contents`→`mkt_blog_cards` / `mkt_instagram_cards` / `mkt_threads_cards`, by `content_id` — confirmed table+column names from the Phase 0 schema, spec §3/§9 O‑1). instagram/facebook → render card background images; threads → render post bodies. (A lightweight `useQuery` per preview-open is fine; or read from the existing content-graph hooks if simpler — keep it on-demand, not eager.)
  - Props `{ projectId: string }`.
- [ ] **Step 3 (typecheck):** `pnpm --filter @tangobook/client typecheck` → PASS. Grep: no `@/components/ui/*`, no `'use client'`, no `@next/next/no-img-element` disables.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/publish/PublishCalendar.tsx packages/client/src/features/marketing/components/publish/PublishQueue.tsx
  git commit -m "feat(marketing): PublishQueue (list+calendar, filters, reschedule, no-op 즉시발행, previews) + PublishCalendar"
  ```

---

## Chunk 7c: Client UI — `PublishDashboard` + `ChannelCards` + `NaverCopySection`

> The wrapper + the channel-card grid + the static Naver card. Assembles 7a + 7b. Behind the placeholder until Chunk 8.

**Files:**
- Create: `packages/client/src/features/marketing/components/publish/ChannelCards.tsx`
- Create: `packages/client/src/features/marketing/components/publish/NaverCopySection.tsx`
- Create: `packages/client/src/features/marketing/components/publish/PublishDashboard.tsx`

- [ ] **Step 1 (`ChannelCards.tsx`, port of `channel-cards.tsx`, spec §5.2):** Responsive grid. First cell = `<SelfHostedCard project={project}/>`. Then 3 **static** cards (Instagram, YouTube, Facebook/Threads) each showing a "연동됨"/"미연동" badge from `!!project.meta_credentials` (the CF "connected" check — `meta_credentials jsonb` exists on `mkt_projects`). These three are display-only (no actions) — faithful to CF. Props `{ project: Project }`.
- [ ] **Step 2 (`NaverCopySection.tsx`, port of `naver-copy-section.tsx`, spec §5.6):** Static informational card "네이버 블로그 (수동 업로드)" — no actions (Naver has no publish API). Korean `break-keep`. No props (or `{ project }` if it references brand name).
- [ ] **Step 3 (`PublishDashboard.tsx`, port of `publish-dashboard.tsx`, spec §5.1):** Header "발행 관리" + stacked `<ChannelCards project={project}/>`, `<PublishQueue projectId={project.id}/>`, `<NaverCopySection/>`. Props `{ projectId: string }`; read `useProject(projectId)`; guard render until `project` is loaded.
- [ ] **Step 4 (typecheck + build):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS (the component tree compiles even though it's not yet routed).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/publish/ChannelCards.tsx packages/client/src/features/marketing/components/publish/NaverCopySection.tsx packages/client/src/features/marketing/components/publish/PublishDashboard.tsx
  git commit -m "feat(marketing): PublishDashboard + ChannelCards (connected=meta_credentials) + NaverCopySection"
  ```

---

## Chunk 8: Route/nav wiring + `PublishPage`

> The page wrapper + the one-line route swap. `PublishPage` guards on `ui-store.selectedProjectId` (mirrors `IdeasPage`'s guard, verified `IdeasPage.tsx:5‑13`) and mounts `<PublishDashboard projectId={…}/>`. The sidebar nav item already exists (`Sidebar.tsx:18`) — the route swap is what makes it live.

**Files:**
- Create: `packages/client/src/features/marketing/pages/PublishPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (`PublishPage.tsx`):** Mirror `IdeasPage`'s guard:
  ```tsx
  import { PublishDashboard } from '../components/publish/PublishDashboard';
  import { useUIStore } from '../store/ui-store';

  export function PublishPage() {
    const selectedProjectId = useUIStore((s) => s.selectedProjectId);
    if (!selectedProjectId) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          프로젝트를 선택하세요
        </div>
      );
    }
    return <PublishDashboard projectId={selectedProjectId} />;
  }
  ```
- [ ] **Step 2 (barrel):** In `features/marketing/index.ts`, add `export { PublishPage } from './pages/PublishPage';` (under the Pages section, next to `IdeasPage`).
- [ ] **Step 3 (route swap):** In `packages/client/src/router/index.tsx`:
  - Add `PublishPage` to the marketing import (`:6‑12`, the `from '../features/marketing'` block, next to `IdeasPage`).
  - Replace line 316: `{ path: 'publish', element: <PlaceholderPage title="발행 관리" /> },` → `{ path: 'publish', element: <PublishPage /> },`.
  - **Leave the other placeholders unchanged** (`monitoring`/`site-analysis`/`meta-analytics`/`competitors`/`strategy`/`ads` stay `PlaceholderPage` — Phase 4/5 OUT). The sidebar item (`Sidebar.tsx:18`) needs **no change** (it already links).
- [ ] **Step 4 (typecheck + build):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS.
- [ ] **Step 5 (manual-verify — @superpowers:verification-before-completion):** `pnpm dev`; open `/marketing`; select a project → click sidebar **🚀 발행**. (Full E2E with a real service-role key + creds is the Chunk 9 manual gate; here confirm the UI mounts + the project guard.)
  - **Project guard:** with no project selected → "프로젝트를 선택하세요".
  - **Channel cards:** `SelfHostedCard` shows the dashed "사이트 등록·활성화 필요" when `published_site.enabled` is false; after enabling the site in 설정 → shows the per-language counts + "일괄 예약 +". The 3 static cards show 연동됨/미연동 from `meta_credentials`.
  - **Bulk wizard:** 일괄 예약 + → 5 stages → 미리보기 renders the `distributeSchedule` table → 확정 alerts `{inserted}/{skipped}` and the queue/counts refresh.
  - **Queue:** 목록 ⇄ 달력 toggle; filters; a scheduled row's datetime-local + quick-pick reschedules; **즉시 발행** alerts the no-op message (expected); delete removes the row; previews open via `BlogPreviewDialog`.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/pages/PublishPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing): wire /marketing/publish -> PublishPage (replace placeholder)"
  ```

---

## Chunk 9: Final integration — apply migration + full gates + docs

> @superpowers:verification-before-completion — apply the migration to the real DB, run every gate, confirm output before any "done" claim. The manual end-to-end with a real service-role key is **deferred** (no creds in CI — same policy as Phase 1/2), noted as a checklist for the operator.

**Files:** docs only (CLAUDE.md × 2 + memory + spec status).

### Task 9.1: Apply the migration (Supabase MCP)

- [ ] **Step 1:** Apply `supabase/migrations/2026-06-09-marketing-phase3-publish.sql` via `mcp__supabase__apply_migration` (project ref `fxzwigjkbsptvsjraqwa`, name e.g. `marketing_phase3_publish`). If a `confirm_cost` prompt appears, it's a no-cost schema change — confirm.
- [ ] **Step 2 (verify schema):** `mcp__supabase__list_tables` → confirm `mkt_deploy_webhook_queue` exists (6 columns, PK `project_id`, RLS enabled). `mcp__supabase__execute_sql` →
  - `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'mkt_publish_records'::regclass and contype='c';` → the two CHECKs (`status` / `channel` enums).
  - `select indexname, indexdef from pg_indexes where tablename='mkt_publish_records';` → `uniq_mkt_publish_self_hosted` present, `mkt_publish_records_pending_unique` gone, the 3 new indexes present.
- [ ] **Step 3 (advisors):** `mcp__supabase__get_advisors` (security) → confirm no new RLS-disabled warning for `mkt_deploy_webhook_queue` (the owner policy + `enable row level security` cover it).
- [ ] **Step 4:** No commit (DB change).

### Task 9.2: Automated gates

- [ ] **Step 1 (unit tests):**
  - `pnpm --filter @tangobook/server test mkt` → server marketing tests green incl. the **new** `publish-scheduler` (Step A/B, overlap, debounce, retry≤3) + `publish.service` (canonical column map).
  - `pnpm --filter @tangobook/client test marketing` → client marketing tests green incl. the **new** `use-publish-records` (bulk skip-on-conflict) + `publish-calendar` (buildMonthGrid) + `publish-times` (makeTime/BEST_POST_TIMES) on top of the existing 54-file suite. Record exact file/test counts.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (shared/server/client) → **PASS**.
- [ ] **Step 3 (lint):** `pnpm lint` → no **new** errors from Phase 3 code. Confirm no leftover `'use client'` / `@next/next/no-img-element` in the new components; no `VITE_`-prefixed reference to `SUPABASE_SERVICE_ROLE_KEY` anywhere; no client import of `supabase-admin.provider`. Pre-existing remotion TS-parse errors + warnings unchanged.
- [ ] **Step 4 (build):** `pnpm --filter @tangobook/client build` → **PASS**. (Server: `tsx` runtime, no build; `pnpm --filter @tangobook/server typecheck` covers it.)
- [ ] **Step 5 (scope confirmation — static):**
  - `router/index.tsx`: `publish` → `<PublishPage/>`; **`monitoring`/`site-analysis`/`meta-analytics`/`competitors`/`strategy`/`ads` still `PlaceholderPage`** (Phase 4/5 OUT).
  - `grep -rn "handlePublishNow" packages/client/src/features/marketing/components/publish` → the no-op alert only (no real manual-publish path).
  - `grep -rn "external_id\|published_url\|platform_post_id" packages/server/src/services/mkt/publish.service.ts` → writes `platform_post_id`/`published_url`, NOT `external_id`/`url`/`title` (the §8.1 delta).
  - `grep -rn "publish/meta" packages/client/src/features/marketing` → **0 results** (meta endpoint is un-wired — no client caller).
  - `startPublishScheduler` is called in `server.ts` only (NOT `app.ts`): `grep -rn "startPublishScheduler" packages/server/src` → import+call in `server.ts`, definition in the service.
- [ ] **Step 6:** No commit (verification only).

### Task 9.3: Manual E2E (deferred — operator checklist) + docs

- [ ] **Step 1 (manual E2E — needs real `SUPABASE_SERVICE_ROLE_KEY` + a project `deploy_webhook_url`; DEFERRED per prior phases):** Document this checklist for the operator (do NOT block "done" on it, same as Phase 1/2 external gates):
  1. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `packages/server/.env`; restart the server → log shows `[mkt] publish scheduler started (60s tick).`
  2. In 설정 → 발행사이트, register a site (domain + `deploy_webhook_url` to a request-bin) + enable.
  3. Schedule a `self_hosted` record ~1 min out (bulk wizard, 1 content, ko, startDate today, a near time slot). Observe: within ≤60s the tick flips it to `published` (`published_at` set) + a webhook POST hits the bin + `mkt_deploy_webhook_queue.last_fired_at` is set.
  4. Bulk wizard end-to-end (preview → confirm → counts update). Queue list/calendar toggle, filters, reschedule, delete, previews. `즉시 발행` → no-op alert.
  5. Graceful: unset the key → restart → scheduler logs "disabled" + no firing; UI still loads.
- [ ] **Step 2 (docs — per "업데이트 하자" workflow if invoked):** Update:
  - `packages/client/src/features/marketing/CLAUDE.md` — add a **발행 (publish) module** section: `components/publish/*` tree, the `use-publish-records` hooks (+ `mktKeys.publishRecords`/`publishCounts`), the `publish-calendar`/`publish-times` lib helpers, the new `/api/mkt/publish/meta` row (un-wired), the route `publish` → `PublishPage`; a **publish Gotchas** subsection noting: (i) the `mkt_publish_records` ALTER (status/channel CHECK + `uniq_mkt_publish_self_hosted`); (ii) the Express `setInterval` scheduler in `server.ts` (NOT `app.ts`) + `supabase-admin.provider` graceful-null + R‑1 service-role security + R‑2/R‑3 dev/multi-replica notes; (iii) `user_id` stamping on every publish-record/queue insert (R‑4); (iv) `handlePublishNow` is a faithful no-op; (v) meta un-wired / youtube deferred; (vi) R‑5 timezone (bulk UTC-anchored vs reschedule/calendar local-anchored).
  - root `CLAUDE.md` + worktree `CLAUDE.md` `/marketing` line — Phase 3 발행 done; remaining 4(분석)/5(전략).
  - memory `marketing-port-contentflow-2026-06-07.md` — Phase 3 done; next = Phase 4 분석.
  - spec `docs/superpowers/specs/2026-06-09-marketing-phase3-publish-design.md` status → **COMPLETE** (or leave as Spec + add a "implemented by …plans/2026-06-09-marketing-phase3-publish.md" note).
  Commit the docs:
  ```bash
  git add packages/client/src/features/marketing/CLAUDE.md CLAUDE.md docs/superpowers/specs/2026-06-09-marketing-phase3-publish-design.md
  git commit -m "docs(marketing): Phase 3 publish — CLAUDE.md publish module + scheduler/gotchas + status"
  ```
  (Memory lives outside the repo — update separately, not in this commit.)
- [ ] **Step 3 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options.

---

## Appendix A — Resolved decisions & deltas (spec §2/§8/§9 + task brief)

- **One Express `setInterval`, not pg_cron + Vercel cron:** CF's pg_cron job (flip+enqueue) + Vercel cron route (fire webhooks) collapse into ONE in-process tick (Step A + Step B), started from `server.ts`'s listen callback. No `CRON_SECRET` needed for the self-trigger (the optional manual-tick endpoint is the only `CRON_SECRET` consumer, default omitted).
- **Service-role admin client (NEW):** `getSupabaseAdmin()` singleton (graceful null) — the scheduler flips rows across all owners (bypasses RLS). `@supabase/supabase-js` must be added to `packages/server` (client-only today). **R‑1:** server-only env, never `VITE_`, never client-imported.
- **Client data layer = Supabase-direct TanStack hooks, NOT Express REST (CF parity):** queue/schedule/bulk/cancel/reschedule + counts are client hooks writing the marketing Supabase client directly (CF's store bypasses its own `/api/publish/{schedule,queue}` routes — vestigial, NOT ported). `published_site` writes reuse `useUpdateProject`.
- **`mkt_publish_records` ALTER (not CREATE):** the table exists from Phase 0 with the wrong status default/CHECK, no channel CHECK, no project/status/scheduled indexes, wrong pending unique index → migrate legacy values → add CHECK enums → add indexes → swap the partial unique index to `(content_id,language,channel) WHERE channel='self_hosted' AND status IN ('scheduled','published')`. `mkt_deploy_webhook_queue` is the only new table.
- **Canonical meta columns (DELTA vs CF):** CF's `saveRecord` writes `external_id`/`url`/`title` (don't exist on `mkt_publish_records`) → the port writes `platform_post_id`/`published_url`/`metadata.title` + stamps `user_id` from the request body. Meta endpoint exposed but **un-wired** (no client caller — the worktree `LanguageSelector` is the simplified 1d translate-only version, no publish bar). YouTube publish **deferred**.
- **`handlePublishNow` faithful no-op:** `alert('직접 발행은 현재 지원하지 않습니다. 내부 블로그 API를 통해 자동 발행됩니다.')` (CF `publish-queue.tsx:138‑139`). The `self_hosted` scheduler is the real publish path.
- **Reuse, don't re-port:** `distributeSchedule` (`lib/schedule-distribution.ts`, tested), `BlogPreviewDialog` (queue previews), `getCurrentUserId()` (`api/supabase.ts:8`), `useUpdateProject` (`published_site` write), `PublishedSiteSection` (settings — Decision #6 done).
- **R‑4 (HIGH, recurring) — `user_id` stamping on inserts:** `mkt_publish_records` + `mkt_deploy_webhook_queue` are `user_id NOT NULL` under single-owner RLS. Client `schedule`/`bulkSchedule` stamp `getCurrentUserId()`; the scheduler's queue upsert carries the flipped record's `user_id`; the meta endpoint stamps from the request body. The #1 silent failure — covered by the bulk + meta unit tests.

## Appendix B — Reused pieces (no change)

| Piece | File | Used by |
|---|---|---|
| `distributeSchedule` (`DistributeInput`/`DistributedSlot`) | `lib/schedule-distribution.ts` | BulkScheduleDialog preview |
| `BlogPreviewDialog` (`{ open, onOpenChange, cards, title }`) | `components/content/BlogPreviewDialog.tsx` | PublishQueue previews |
| `getCurrentUserId()` | `api/supabase.ts:8` | schedule/bulk insert stamp |
| `useProject` / `useUpdateProject` | `api/use-projects.ts` | dashboard read + `published_site` write |
| `useContents(projectId)` | `api/use-contents.ts` | bulk wizard content list |
| `mktKeys` factory | `api/queries.ts:18` | publish keys |
| `PublishedSiteSection` (built+wired) | `components/project/sections/PublishedSiteSection.tsx` + `ProjectSettings.tsx:92/131` | site registration (Decision #6 done) |
| Sidebar nav `🚀 발행` | `components/layout/Sidebar.tsx:18` | nav (no change) |
| `setInterval` precedent (module-level) | `services/storybook.service.ts:35` | scheduler pattern |
| provider singleton precedent | `providers/gemini.provider.ts` | admin provider pattern |

## Appendix C — Cited references (both sides)

**ContentFlow (port source)** — `src/components/publish/{publish-dashboard,channel-cards,self-hosted-card,bulk-schedule-dialog,publish-queue,naver-copy-section}.tsx` (publish-queue 469 lines: `BEST_POST_TIMES` :51, `handlePublishNow` no-op :138, `makeTime` :290, quick-pick :295, `BEST_POST_TIMES[lang]||ko` :301, "즉시 발행" :336); `src/stores/project-store.ts:1727‑1816` (`updatePublishedSite`, `schedulePublish` :1752 upsert `content_id,language,channel`, `cancelPublish` :1772, `bulkSchedulePublish` :1779 skip-on-conflict, `fetchPublishCountsByLanguage` :1812); `supabase/migrations/{005_publish_records.sql, 2026-05-18-self-hosted-channel.sql}`; `src/app/api/cron/fire-deploy-webhooks/route.ts` (Vercel cron loop → Step B); `src/app/api/publish/meta/route.ts` (Meta Graph v21.0; stale `external_id`/`url`/`title` → canonical delta); `src/app/api/publish/{schedule,queue,youtube}/route.ts` (schedule/queue vestigial, youtube dead).

**Tangobook (worktree `feat/marketing-phase0`)** — `supabase/migrations/2026-06-07-marketing-schema.sql:308‑331` (existing `mkt_publish_records` wrong CHECK/index), `:64‑67` (`wp_credentials`/`meta_credentials`/`published_site` cols), `:424/443` (RLS enable + owner policy pattern); `packages/client/src/features/marketing/types/database.ts:99/111/135/165/467` (`WpCredentials`/`PublishedSite`/`MetaCredentials`/`Project.published_site`/`PublishRecord`); `…/lib/schedule-distribution.ts` (reused); `…/components/content/BlogPreviewDialog.tsx` (reused); `…/components/content/LanguageSelector.tsx` (simplified 1d → meta un-wired); `…/components/project/ProjectSettings.tsx:92/131` + `…/sections/PublishedSiteSection.tsx:58/124` (settings built+wired); `…/api/queries.ts:18‑31` (`mktKeys`); `…/api/use-projects.ts` (`useProject`/`useUpdateProject`); `…/api/supabase.ts:8` (`getCurrentUserId`); `…/pages/IdeasPage.tsx:5‑13` (guard pattern); `…/router/index.tsx:11/316` (import + placeholder swap); `…/components/layout/Sidebar.tsx:18` (nav present); `packages/server/src/server.ts:10‑18` (bootstrap; scheduler start spot — NOT `app.ts`, both import `createApp`); `packages/server/src/app.ts:39` (`createApp` — shared with tests); `packages/server/src/services/storybook.service.ts:35` (module-level `setInterval`); `packages/server/src/providers/gemini.provider.ts:7‑13` (lazy singleton pattern); `packages/server/src/config/index.ts:71‑75` (`naverDatalab` block; add `supabase`/`cron` after); `packages/server/src/routes/mkt.routes.ts:11‑40` + `controllers/mkt/keywords.controller.ts` (route/controller patterns); `packages/server/src/services/mkt/external/meta-graph.ts` (501 analytics stubs only — publish logic goes in new `publish.service.ts`); `packages/server/package.json` (`@supabase/supabase-js` ABSENT — add `^2.104.0`); `packages/client/package.json` (`@supabase/supabase-js: ^2.104.0` — version source).

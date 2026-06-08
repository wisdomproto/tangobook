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

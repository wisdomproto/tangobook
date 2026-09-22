-- Storybook source catalog for marketing planning.
-- A source is copied from editor2/R2, while mkt_contents remains the editable marketing plan.

create table if not exists mkt_content_sources (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  source_type         text not null check (source_type in ('storybook')),
  source_id           text not null,
  source_state        text not null default 'approved'
                        check (source_state in ('approved', 'unapproved', 'archived')),
  title               text not null,
  category            text,
  cover_image_url     text,
  languages           text[] not null default '{}',
  source_snapshot     jsonb not null default '{}',
  source_updated_at   timestamptz,
  last_synced_at      timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, source_type, source_id)
);

create index if not exists mkt_content_sources_project_state_idx
  on mkt_content_sources (project_id, source_state, title);

create index if not exists mkt_content_sources_user_id_idx
  on mkt_content_sources (user_id);

alter table mkt_content_sources enable row level security;

create policy mkt_content_sources_owner
  on mkt_content_sources
  for select
  using (user_id = auth.uid());

alter table mkt_contents
  add column if not exists content_source_id uuid
    references mkt_content_sources(id) on delete set null;

create index if not exists mkt_contents_content_source_id_idx
  on mkt_contents (content_source_id);

-- Backfill the current memo convention without deleting or rewriting marketing content.
insert into mkt_content_sources (
  user_id,
  project_id,
  source_type,
  source_id,
  source_state,
  title,
  category,
  languages,
  source_snapshot,
  source_updated_at,
  last_synced_at,
  created_at,
  updated_at
)
select
  c.user_id,
  c.project_id,
  'storybook',
  substring(c.memo from char_length('storybook:') + 1),
  'approved',
  c.title,
  c.category,
  array['ko']::text[],
  jsonb_build_object('legacyMemo', c.memo),
  c.updated_at,
  now(),
  c.created_at,
  now()
from mkt_contents c
where c.memo like 'storybook:%'
  and length(substring(c.memo from char_length('storybook:') + 1)) > 0
on conflict (project_id, source_type, source_id) do nothing;

update mkt_contents c
set content_source_id = s.id
from mkt_content_sources s
where c.content_source_id is null
  and c.memo = 'storybook:' || s.source_id
  and c.project_id = s.project_id
  and s.source_type = 'storybook';

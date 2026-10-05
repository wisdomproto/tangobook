-- Global authoring assets: binary files live in R2, supported glyphs in this catalog.
-- Only service-role/DB administrators write/read; no learner-data dependencies.
create table if not exists public.cover_font_assets (
  id text primary key,
  family text not null,
  version text not null,
  usage text not null default 'storybook-cover' check (usage = 'storybook-cover'),
  status text not null check (status = 'title-subset-trial'),
  preferred boolean not null default false,
  languages text[] not null,
  ttf_url text not null,
  woff2_url text not null,
  ttf_sha256 text not null check (ttf_sha256 ~ '^[0-9a-f]{64}$'),
  woff2_sha256 text not null check (woff2_sha256 ~ '^[0-9a-f]{64}$'),
  coverage jsonb not null check (jsonb_typeof(coverage) = 'object'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (family, version)
);
alter table public.cover_font_assets enable row level security;
revoke all on public.cover_font_assets from anon, authenticated;
grant select, insert, update on public.cover_font_assets to service_role;
comment on table public.cover_font_assets is
  'TangoBook cover font versions, R2 download URLs, hashes and explicit limited glyph coverage. Trial status never means full language support.';
notify pgrst, 'reload schema';

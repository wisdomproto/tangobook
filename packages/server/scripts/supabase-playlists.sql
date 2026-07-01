-- 연속재생 저장 세트 — playlists (account별, 클라 직접 CRUD via RLS)
-- 적용: Supabase MCP apply_migration 또는 대시보드 SQL Editor.

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  book_ids text[] not null default '{}',
  language text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playlists enable row level security;

drop policy if exists "own playlists" on public.playlists;
create policy "own playlists" on public.playlists
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

create index if not exists idx_playlists_account on public.playlists(account_id);

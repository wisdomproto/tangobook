-- tangobook auth/login 테이블·RLS·RPC·트리거 셋업
-- supabase.com 프로젝트 SQL Editor에 전체 붙여넣고 실행 (1회성)

create extension if not exists pgcrypto;

-- 1. accounts
create table if not exists accounts (
  id uuid references auth.users on delete cascade primary key,
  email text,
  pin_hash text,
  pin_set_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. child_profiles
create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  name text not null check (length(trim(name)) between 1 and 10),
  avatar_id text not null,
  birth_date date,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_child_profiles_account on child_profiles(account_id);

-- 3. learning_events (shell)
create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references child_profiles(id) on delete cascade not null,
  event_type text not null,
  storybook_id text,
  game_type text,
  word text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_learning_events_profile on learning_events(profile_id, created_at desc);
create index if not exists idx_learning_events_word on learning_events(word) where word is not null;

-- RLS
alter table accounts enable row level security;
alter table child_profiles enable row level security;
alter table learning_events enable row level security;

drop policy if exists "account_self_select" on accounts;
create policy "account_self_select" on accounts for select using (auth.uid() = id);

drop policy if exists "account_self_update" on accounts;
create policy "account_self_update" on accounts for update using (auth.uid() = id);

drop policy if exists "account_self_insert" on accounts;
create policy "account_self_insert" on accounts for insert with check (auth.uid() = id);

drop policy if exists "child_self_all" on child_profiles;
create policy "child_self_all" on child_profiles for all using (account_id = auth.uid());

drop policy if exists "event_self_all" on learning_events;
create policy "event_self_all" on learning_events for all using (
  exists (
    select 1 from child_profiles cp
    where cp.id = learning_events.profile_id and cp.account_id = auth.uid()
  )
);

-- 트리거: auth.users → accounts
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into accounts (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 자녀 최대 4명 trigger
create or replace function enforce_child_limit() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from child_profiles where account_id = new.account_id) >= 4 then
    raise exception 'child_profiles max 4 per account';
  end if;
  return new;
end;
$$;

drop trigger if exists child_profiles_limit_trigger on child_profiles;
create trigger child_profiles_limit_trigger
  before insert on child_profiles
  for each row execute function enforce_child_limit();

-- PIN RPC
create or replace function set_pin(raw_pin text) returns void
language sql security definer as $$
  update accounts
    set pin_hash = crypt(raw_pin, gen_salt('bf')),
        pin_set_at = now(),
        updated_at = now()
  where id = auth.uid();
$$;

create or replace function verify_pin(raw_pin text) returns boolean
language sql security definer as $$
  select coalesce(pin_hash = crypt(raw_pin, pin_hash), false)
  from accounts where id = auth.uid();
$$;

revoke all on function set_pin(text) from public;
revoke all on function verify_pin(text) from public;
grant execute on function set_pin(text) to authenticated;
grant execute on function verify_pin(text) to authenticated;

-- 계정 삭제 RPC
create or replace function delete_self_account() returns void
language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from accounts where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_self_account() from public;
grant execute on function delete_self_account() to authenticated;

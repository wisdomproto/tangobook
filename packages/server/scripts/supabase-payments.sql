-- 결제/유료화 스키마 — payments(주문 이력) + entitlements(계정별 권한)
-- 적용: Supabase MCP apply_migration 또는 대시보드 SQL Editor.
-- 쓰기는 service role(서버)만 — RLS는 본인 select 만 허용.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  order_id text not null unique,
  payment_key text,
  plan text not null,
  amount integer not null,
  status text not null default 'pending',  -- pending | paid | failed
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.entitlements (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  paid_until timestamptz,                          -- 기간권 만료 시각
  referral_bonus_days integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.accounts(id),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.entitlements enable row level security;

-- 본인 행 select 만. insert/update 는 service role 이 RLS 우회.
drop policy if exists "own payments read" on public.payments;
create policy "own payments read" on public.payments
  for select using (auth.uid() = account_id);

drop policy if exists "own entitlement read" on public.entitlements;
create policy "own entitlement read" on public.entitlements
  for select using (auth.uid() = account_id);

create index if not exists idx_payments_account on public.payments(account_id);

-- tangobook 별/SR/콜렉션/호리 통합 셋업
-- supabase.com SQL Editor 에 전체 붙여넣고 1회 실행
-- 선행조건: scripts/supabase-setup.sql (auth/login + learning_events shell) 먼저 적용
-- 스펙: docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md
-- 모든 DDL 은 idempotent (재실행 안전)

-- ════════════════════════════════════════════════════════════════════════
-- 1. accounts 확장 — 구독 등급 (별 적립률 ×배율)
-- ════════════════════════════════════════════════════════════════════════

alter table accounts add column if not exists tier text not null default 'free'
  check (tier in ('free', 'plus', 'family'));

-- ════════════════════════════════════════════════════════════════════════
-- 2. child_profiles 확장 — 별 잔고 + streak
-- ════════════════════════════════════════════════════════════════════════

alter table child_profiles add column if not exists stars_total int not null default 0;
alter table child_profiles add column if not exists streak_days int not null default 0;
alter table child_profiles add column if not exists last_active_date date;

-- ════════════════════════════════════════════════════════════════════════
-- 3. star_ledger — 별 거래 원장 (모든 ± 기록)
-- ════════════════════════════════════════════════════════════════════════

create table if not exists star_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  delta int not null,                       -- 양수=적립, 음수=사용
  source_type text not null,
  source_id text,                           -- learning_event.id / mission.id / hori_item.id
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_star_ledger_profile on star_ledger(profile_id, created_at desc);
create index if not exists idx_star_ledger_source on star_ledger(profile_id, source_type, created_at desc);

-- 별 사용 검증 — 호리 코스메틱만 차감 허용 (전략 3대 절대 원칙 enforce)
create or replace function public.validate_star_spend() returns trigger
language plpgsql
as $$
begin
  if new.delta < 0 and new.source_type not in ('hori_item', 'foil_card', 'season_costume') then
    raise exception 'star spend allowed only for: hori_item, foil_card, season_costume (got %)', new.source_type;
  end if;
  return new;
end;
$$;

drop trigger if exists star_ledger_validate_spend on star_ledger;
create trigger star_ledger_validate_spend
  before insert on star_ledger
  for each row execute function public.validate_star_spend();

-- 잔고 동기화 — ledger insert 시 child_profiles.stars_total 갱신
create or replace function public.sync_stars_total() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  update public.child_profiles
    set stars_total = stars_total + new.delta,
        updated_at = now()
    where id = new.profile_id;
  if (select stars_total from public.child_profiles where id = new.profile_id) < 0 then
    raise exception 'star balance would go negative';
  end if;
  return new;
end;
$$;

drop trigger if exists star_ledger_sync_total on star_ledger;
create trigger star_ledger_sync_total
  after insert on star_ledger
  for each row execute function public.sync_stars_total();

-- ════════════════════════════════════════════════════════════════════════
-- 4. word_mastery — per-user-per-word 마스터리 + SR 스케줄
-- ════════════════════════════════════════════════════════════════════════

create table if not exists word_mastery (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  word text not null,
  language text not null check (language in ('ko', 'en')),

  -- 누적 카운트
  exposed int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,

  -- 계산값
  mastery real not null default 0,
  status text not null default 'unknown'
    check (status in ('unknown', 'seen', 'practiced', 'mastered')),

  -- SR 스케줄
  next_review_at timestamptz,
  interval_days int not null default 0,
  last_reviewed_at timestamptz,
  ease_factor real not null default 2.5,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, word, language)
);
create index if not exists idx_word_mastery_review
  on word_mastery(profile_id, language, next_review_at)
  where next_review_at is not null;
create index if not exists idx_word_mastery_status
  on word_mastery(profile_id, language, status, mastery);

-- ════════════════════════════════════════════════════════════════════════
-- 5. collection_user — 카드/도감 per-user 상태
-- ════════════════════════════════════════════════════════════════════════

do $$ begin
  if not exists (select 1 from pg_type where typname = 'collection_status') then
    create type collection_status as enum ('locked', 'silhouette', 'owned', 'active');
  end if;
end $$;

create table if not exists collection_user (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  item_id text not null,
  status collection_status not null default 'locked',
  silhouette_at timestamptz,
  owned_at timestamptz,
  active_at timestamptz,
  foil boolean not null default false,
  primary key (profile_id, item_id)
);
create index if not exists idx_collection_user_status
  on collection_user(profile_id, status);

-- ════════════════════════════════════════════════════════════════════════
-- 6. hori_inventory — 호리 꾸미기 인벤토리
-- ════════════════════════════════════════════════════════════════════════

create table if not exists hori_inventory (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  item_id text not null,
  acquired_at timestamptz not null default now(),
  equipped boolean not null default false,
  primary key (profile_id, item_id)
);
create index if not exists idx_hori_inventory_equipped
  on hori_inventory(profile_id, equipped) where equipped = true;

-- ════════════════════════════════════════════════════════════════════════
-- 7. weekly_missions — 주간 미션
-- ════════════════════════════════════════════════════════════════════════

create table if not exists weekly_missions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  week_start date not null,
  mission_type text not null,
  target int not null check (target > 0),
  progress int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (profile_id, week_start, mission_type)
);
create index if not exists idx_weekly_missions_profile
  on weekly_missions(profile_id, week_start desc);

-- ════════════════════════════════════════════════════════════════════════
-- 8. RLS — 모든 신규 테이블 자녀-자기-데이터-only
-- ════════════════════════════════════════════════════════════════════════

alter table star_ledger enable row level security;
alter table word_mastery enable row level security;
alter table collection_user enable row level security;
alter table hori_inventory enable row level security;
alter table weekly_missions enable row level security;

-- 헬퍼: profile_id 가 현재 사용자 자녀인가?
create or replace function public.is_own_profile(pid uuid) returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.child_profiles cp
    where cp.id = pid and cp.account_id = auth.uid()
  );
$$;

-- star_ledger: 자녀 자기만. INSERT 는 trigger 로만 (직접 insert 막을지 결정 필요)
drop policy if exists "star_ledger_self_select" on star_ledger;
create policy "star_ledger_self_select" on star_ledger
  for select using (public.is_own_profile(profile_id));

drop policy if exists "star_ledger_self_insert" on star_ledger;
create policy "star_ledger_self_insert" on star_ledger
  for insert with check (public.is_own_profile(profile_id));

-- word_mastery
drop policy if exists "word_mastery_self_all" on word_mastery;
create policy "word_mastery_self_all" on word_mastery
  for all using (public.is_own_profile(profile_id));

-- collection_user
drop policy if exists "collection_user_self_all" on collection_user;
create policy "collection_user_self_all" on collection_user
  for all using (public.is_own_profile(profile_id));

-- hori_inventory
drop policy if exists "hori_inventory_self_all" on hori_inventory;
create policy "hori_inventory_self_all" on hori_inventory
  for all using (public.is_own_profile(profile_id));

-- weekly_missions
drop policy if exists "weekly_missions_self_all" on weekly_missions;
create policy "weekly_missions_self_all" on weekly_missions
  for all using (public.is_own_profile(profile_id));

-- ════════════════════════════════════════════════════════════════════════
-- 9. 별 적립 trigger — learning_events insert 시 자동
-- ════════════════════════════════════════════════════════════════════════

-- 구독 등급 적립률 조회
create or replace function public.tier_multiplier(pid uuid) returns real
language sql stable security definer
set search_path = public, pg_temp
as $$
  select case (select a.tier from public.accounts a
               join public.child_profiles cp on cp.account_id = a.id
               where cp.id = pid)
    when 'family' then 2.0
    when 'plus' then 1.5
    else 1.0
  end;
$$;

-- 일일 streak 갱신 + 7일 보너스
create or replace function public.update_streak(pid uuid) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  cp record;
  prev_streak int;
  new_streak int;
begin
  select streak_days, last_active_date into cp
    from public.child_profiles where id = pid;
  prev_streak := cp.streak_days;

  if cp.last_active_date = current_date then
    return; -- 이미 오늘 갱신됨
  elsif cp.last_active_date = current_date - 1 then
    new_streak := prev_streak + 1;
  else
    new_streak := 1; -- streak 끊김 → 리셋
  end if;

  update public.child_profiles
    set streak_days = new_streak,
        last_active_date = current_date,
        updated_at = now()
    where id = pid;

  -- 매일 접속 +2
  insert into public.star_ledger (profile_id, delta, source_type, metadata)
    values (pid,
            (2 * public.tier_multiplier(pid))::int,
            'daily_login',
            jsonb_build_object('streak', new_streak));

  -- 7일 단위 보너스 +20
  if new_streak > 0 and new_streak % 7 = 0 then
    insert into public.star_ledger (profile_id, delta, source_type, metadata)
      values (pid,
              (20 * public.tier_multiplier(pid))::int,
              'streak_bonus',
              jsonb_build_object('streak', new_streak));
  end if;
end;
$$;

-- 메인 trigger: learning_events insert → 별 적립 + streak + mastery + collection
create or replace function public.handle_learning_event() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  mult real;
  delta int;
  is_last_page boolean;
  total_pages int;
  current_page int;
begin
  -- 1. streak 갱신 (매 이벤트마다 호출, idempotent)
  perform public.update_streak(new.profile_id);

  mult := public.tier_multiplier(new.profile_id);

  -- 2. 별 적립 — 이벤트 타입별
  if new.event_type = 'page_read' then
    -- 마지막 페이지인지 확인 (metadata 에서 totalPages, page 비교)
    current_page := (new.metadata->>'page')::int;
    total_pages := (new.metadata->>'totalPages')::int;
    is_last_page := total_pages is not null and current_page is not null
                    and current_page >= total_pages;

    delta := case when is_last_page then 5 else 1 end;
    insert into public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      values (new.profile_id, (delta * mult)::int, 'page_read', new.id::text,
              jsonb_build_object('storybookId', new.storybook_id,
                                 'page', current_page,
                                 'lastPage', is_last_page));

  elsif new.event_type = 'word_correct' then
    insert into public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      values (new.profile_id, (1 * mult)::int, 'game_correct', new.id::text,
              jsonb_build_object('word', new.word, 'gameType', new.game_type));
  end if;

  -- 3. word_mastery upsert (word_correct/wrong/exposed 일 때)
  if new.event_type in ('word_correct', 'word_wrong', 'word_exposed', 'word_spoken')
     and new.word is not null then
    insert into public.word_mastery
      (profile_id, word, language, exposed, correct, wrong, last_reviewed_at)
    values
      (new.profile_id, new.word, coalesce(new.metadata->>'lang', 'ko'),
       (new.event_type = 'word_exposed')::int,
       (new.event_type in ('word_correct', 'word_spoken'))::int,
       (new.event_type = 'word_wrong')::int,
       now())
    on conflict (profile_id, word, language) do update set
      exposed = word_mastery.exposed + excluded.exposed,
      correct = word_mastery.correct + excluded.correct,
      wrong = word_mastery.wrong + excluded.wrong,
      last_reviewed_at = now(),
      updated_at = now();

    -- mastery + status + SR 스케줄 재계산
    update public.word_mastery set
      mastery = case
        when (correct + wrong) = 0 and exposed > 0 then
          0.15 * least(1.0, exposed::real / 3.0)
        when (correct + wrong) = 0 then 0
        else 0.15 + 0.85
             * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0)
        end,
      status = case
        when exposed = 0 then 'unknown'
        when (correct + wrong) = 0 then 'seen'
        when 0.15 + 0.85 * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0) >= 0.6 then 'mastered'
        when 0.15 + 0.85 * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0) >= 0.2 then 'practiced'
        else 'seen'
        end,
      interval_days = case
        when new.event_type = 'word_wrong' then 1
        when interval_days = 0 then 1
        when interval_days = 1 then 3
        when interval_days = 3 then 7
        when interval_days = 7 then 14
        else 30
        end,
      next_review_at = now() + (case
        when new.event_type = 'word_wrong' then 1
        when interval_days = 0 then 1
        when interval_days = 1 then 3
        when interval_days = 3 then 7
        when interval_days = 7 then 14
        else 30
        end || ' days')::interval
    where profile_id = new.profile_id and word = new.word
      and language = coalesce(new.metadata->>'lang', 'ko');
  end if;

  -- 4. collection_user 상태 전이 (page_read 이벤트)
  if new.event_type = 'page_read' and new.storybook_id is not null then
    -- 첫 페이지 → silhouette (해당 storybook 이 sourceBookIds 에 포함된 모든 카드)
    -- 마지막 페이지 → owned
    -- 카드 마스터 풀 R2 조회는 서버에서 처리 (이 trigger 는 metadata 에 cardIds 가 있을 때만 동작)
    declare
      card_ids text[];
      cid text;
    begin
      card_ids := array(select jsonb_array_elements_text(coalesce(new.metadata->'collectionItemIds', '[]'::jsonb)));
      foreach cid in array card_ids loop
        if is_last_page then
          -- 완독 → owned
          insert into public.collection_user (profile_id, item_id, status, silhouette_at, owned_at)
          values (new.profile_id, cid, 'owned', now(), now())
          on conflict (profile_id, item_id) do update set
            status = case when collection_user.status in ('locked', 'silhouette')
                          then 'owned' else collection_user.status end,
            silhouette_at = coalesce(collection_user.silhouette_at, now()),
            owned_at = case when collection_user.owned_at is null then now()
                            else collection_user.owned_at end;

          -- 별 +5 (카드 획득)
          if not exists (
            select 1 from public.star_ledger
            where source_type = 'card_unlock' and source_id = cid
              and profile_id = new.profile_id
          ) then
            insert into public.star_ledger (profile_id, delta, source_type, source_id, metadata)
              values (new.profile_id, (5 * mult)::int, 'card_unlock', cid,
                      jsonb_build_object('itemId', cid, 'level', 'owned'));
          end if;
        else
          -- 페이지 1+ → silhouette
          insert into public.collection_user (profile_id, item_id, status, silhouette_at)
          values (new.profile_id, cid, 'silhouette', now())
          on conflict (profile_id, item_id) do update set
            status = case when collection_user.status = 'locked'
                          then 'silhouette' else collection_user.status end,
            silhouette_at = coalesce(collection_user.silhouette_at, now());
        end if;
      end loop;
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists learning_events_handle on learning_events;
create trigger learning_events_handle
  after insert on learning_events
  for each row execute function public.handle_learning_event();

-- ════════════════════════════════════════════════════════════════════════
-- 10. RPC: SR 단어 풀 조회 (호리 놀이터 게임용)
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.get_sr_word_pool(
  p_profile_id uuid,
  p_language text default 'ko',
  p_count int default 10,
  p_recent_storybook_id text default null
) returns setof word_mastery
language sql security definer
set search_path = public, pg_temp
as $$
  with
    today_review as (
      select * from public.word_mastery
      where profile_id = p_profile_id and language = p_language
        and next_review_at is not null and next_review_at <= now()
      order by next_review_at
      limit greatest(1, p_count * 30 / 100)
    ),
    weak_words as (
      select * from public.word_mastery
      where profile_id = p_profile_id and language = p_language
        and status in ('seen', 'practiced')
        and word not in (select word from today_review)
      order by mastery
      limit greatest(1, p_count * 30 / 100)
    ),
    -- 최근 동화 단어는 vocabulary-db.json 조회 필요 → 서버에서 보완
    -- 여기선 mastered 중 최근 reviewed 30% 추정
    recent_words as (
      select * from public.word_mastery
      where profile_id = p_profile_id and language = p_language
        and last_reviewed_at >= now() - interval '7 days'
        and word not in (select word from today_review union select word from weak_words)
      order by last_reviewed_at desc
      limit greatest(1, p_count * 30 / 100)
    ),
    random_words as (
      select * from public.word_mastery
      where profile_id = p_profile_id and language = p_language
        and status = 'mastered'
        and word not in (select word from today_review
                         union select word from weak_words
                         union select word from recent_words)
      order by random()
      limit greatest(1, p_count * 10 / 100)
    )
  select * from today_review
  union all select * from weak_words
  union all select * from recent_words
  union all select * from random_words;
$$;

revoke all on function public.get_sr_word_pool(uuid, text, int, text) from public;
grant execute on function public.get_sr_word_pool(uuid, text, int, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 11. RPC: 게임 만점 보너스 (클라이언트가 호출)
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.grant_game_perfect(
  p_profile_id uuid,
  p_game_type text,
  p_storybook_id text default null
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  mult real;
begin
  if not public.is_own_profile(p_profile_id) then
    raise exception 'not authorized';
  end if;
  mult := public.tier_multiplier(p_profile_id);
  insert into public.star_ledger (profile_id, delta, source_type, metadata)
    values (p_profile_id, (5 * mult)::int, 'game_perfect',
            jsonb_build_object('gameType', p_game_type, 'storybookId', p_storybook_id));
end;
$$;

revoke all on function public.grant_game_perfect(uuid, text, text) from public;
grant execute on function public.grant_game_perfect(uuid, text, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 12. RPC: 도감 활성 (게임 80%+ 통과 시 클라이언트 호출)
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.activate_collection_item(
  p_profile_id uuid,
  p_item_id text
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  mult real;
begin
  if not public.is_own_profile(p_profile_id) then
    raise exception 'not authorized';
  end if;
  mult := public.tier_multiplier(p_profile_id);

  update public.collection_user
    set status = 'active',
        active_at = coalesce(active_at, now())
    where profile_id = p_profile_id and item_id = p_item_id and status = 'owned';

  if found then
    insert into public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      values (p_profile_id, (10 * mult)::int, 'card_unlock', p_item_id,
              jsonb_build_object('itemId', p_item_id, 'level', 'active'));
  end if;
end;
$$;

revoke all on function public.activate_collection_item(uuid, text) from public;
grant execute on function public.activate_collection_item(uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 13. RPC: 호리 아이템 구매 (별 차감 + 인벤토리 추가)
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.purchase_hori_item(
  p_profile_id uuid,
  p_item_id text,
  p_cost int
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_own_profile(p_profile_id) then
    raise exception 'not authorized';
  end if;
  if p_cost <= 0 then
    raise exception 'invalid cost';
  end if;
  if (select stars_total from public.child_profiles where id = p_profile_id) < p_cost then
    raise exception 'insufficient stars';
  end if;
  if exists (select 1 from public.hori_inventory
             where profile_id = p_profile_id and item_id = p_item_id) then
    raise exception 'already owned';
  end if;

  -- 별 차감 (validate_star_spend trigger 가 source_type 검증)
  insert into public.star_ledger (profile_id, delta, source_type, source_id)
    values (p_profile_id, -p_cost, 'hori_item', p_item_id);

  insert into public.hori_inventory (profile_id, item_id)
    values (p_profile_id, p_item_id);
end;
$$;

revoke all on function public.purchase_hori_item(uuid, text, int) from public;
grant execute on function public.purchase_hori_item(uuid, text, int) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 14. RPC: 주간 미션 진척 갱신 (서버에서 cron 으로 호출)
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.complete_weekly_mission(
  p_mission_id uuid
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  m record;
  mult real;
begin
  select * into m from public.weekly_missions where id = p_mission_id;
  if m is null then raise exception 'mission not found'; end if;
  if not public.is_own_profile(m.profile_id) then
    raise exception 'not authorized';
  end if;
  if m.completed then return; end if;
  if m.progress < m.target then raise exception 'mission not yet complete'; end if;

  mult := public.tier_multiplier(m.profile_id);

  update public.weekly_missions
    set completed = true, completed_at = now()
    where id = p_mission_id;

  insert into public.star_ledger (profile_id, delta, source_type, source_id, metadata)
    values (m.profile_id, (50 * mult)::int, 'weekly_mission', m.id::text,
            jsonb_build_object('missionType', m.mission_type));
end;
$$;

revoke all on function public.complete_weekly_mission(uuid) from public;
grant execute on function public.complete_weekly_mission(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 셋업 끝
-- ════════════════════════════════════════════════════════════════════════
-- 검증 쿼리 (선택):
-- select * from child_profiles;
-- select * from star_ledger order by created_at desc limit 5;
-- select * from word_mastery limit 5;

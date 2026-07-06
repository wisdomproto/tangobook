-- 기존 회원 무료 체험 리셋 — 모든 계정의 trial_started_at 을 now() 로 세팅.
-- 효과: 가입일과 무관하게 "지금부터 7일" 체험 재시작(+ 기존 referral_bonus_days 는 그 위에 유지).
-- computeAccess 는 trial_started_at 이 있으면 그 시각+7일, 없으면 가입일+7일(신규 가입자는 자동으로 가입일 기준).
--
-- 최초 실행: 2026-07-06 (기존 6계정 리셋).
-- 재실행 = 그 시점부터 다시 7일. 정식 오픈 시 일괄 시작에도 재사용 가능.
insert into public.entitlements (account_id, trial_started_at)
select id, now() from public.accounts
on conflict (account_id) do update
  set trial_started_at = excluded.trial_started_at,
      updated_at = now();

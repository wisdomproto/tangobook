-- 건의하기 (사용자 → 운영자 피드백) — 앱 공용 테이블.
-- 로그인 사용자가 사이드바 "건의하기"로 메시지를 남기면 여기에 저장.
-- 운영자는 /marketing/feedback 에서 service-role 서버 프록시로 전체 열람.
--
-- RLS: 본인(account_id = auth.uid()) 행만 insert/select. 운영자 전체 조회는
--      서버(SUPABASE_SERVICE_ROLE_KEY, RLS 우회)가 담당하므로 여기서 owner-all 정책 불필요.

create table if not exists app_feedback (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  message text not null,
  contact text,                              -- 제출 시점 이메일 스냅샷 (계정 삭제돼도 회신용 보존)
  created_at timestamptz not null default now()
);

create index if not exists idx_app_feedback_created_at on app_feedback (created_at desc);

alter table app_feedback enable row level security;

drop policy if exists "feedback_self_insert" on app_feedback;
create policy "feedback_self_insert" on app_feedback
  for insert with check (account_id = auth.uid());

drop policy if exists "feedback_self_select" on app_feedback;
create policy "feedback_self_select" on app_feedback
  for select using (account_id = auth.uid());

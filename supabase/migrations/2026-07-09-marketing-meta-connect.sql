-- =============================================================================
-- Marketing — Meta 연동(글로벌 암호화 연결)
-- Meta(Instagram/Facebook/Threads) OAuth 로 발행한 토큰 묶음을 AES-256-GCM 으로
-- 암호화(enc_payload)해 저장. 단일 글로벌 연동(프로젝트별 아님). 토큰은 서버 전용 —
-- 서비스롤 클라이언트(getSupabaseAdmin)만 접근한다.
-- dflo(v4/scripts/migrations/041_marketing_meta_connection.sql)에서 이식.
-- Project: tangobook (fxzwigjkbsptvsjraqwa) — 라이브 DB 적용 완료(2026-07-09).
-- Safety: CREATE only; no DROP of data.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists mkt_meta_connection (
  id             uuid primary key default gen_random_uuid(),
  meta_user_id   text unique,
  meta_user_name text default '',
  enc_payload    text not null,
  expires_at     timestamptz,
  connected_at   timestamptz default now(),
  updated_at     timestamptz default now()
);

-- RLS 활성 + anon/authenticated 정책 없음 = 브라우저(anon/auth) 직접 접근 전면 차단.
-- 서비스롤 클라이언트는 RLS 를 우회하므로 서버 경유 읽기/쓰기만 가능(토큰 클라 미노출).
alter table mkt_meta_connection enable row level security;

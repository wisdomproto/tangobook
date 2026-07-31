-- =============================================================================
-- 네이버 블로그 발행 이력 (book blog 글 전용).
-- mkt_publish_records 는 content_id NOT NULL → mkt_contents(id) FK 라 book blog
-- 글에 안 맞으므로 전용 테이블 신설. 서비스롤(로컬 스크립트)만 write.
-- Project: tangobook (fxzwigjkbsptvsjraqwa)
-- =============================================================================
create table if not exists mkt_naver_blog_publications (
  id             uuid primary key default gen_random_uuid(),
  book_id        text not null,
  post_id        text not null,
  language       text not null default 'ko',
  status         text not null default 'draft'
                 check (status in ('draft','published','failed')),
  naver_post_url text,
  error_message  text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (book_id, post_id, language)
);

alter table mkt_naver_blog_publications enable row level security;
-- 서비스롤은 RLS 우회. 운영자(OPS) 조회 정책만 최소로 — 여기선 authenticated 읽기 허용.
create policy mkt_naver_blog_pub_read on mkt_naver_blog_publications
  for select using (auth.role() = 'authenticated');

-- 마케팅 콘텐츠를 정규(regular) / 광고(ad)로 구분하는 content_kind 컬럼.
-- 기존 행은 모두 'regular'(추가형 마이그레이션 — 데이터 손실 없음). 라이브 DB 적용 완료.
ALTER TABLE mkt_contents
  ADD COLUMN IF NOT EXISTS content_kind text NOT NULL DEFAULT 'regular';

ALTER TABLE mkt_contents
  DROP CONSTRAINT IF EXISTS mkt_contents_content_kind_check;
ALTER TABLE mkt_contents
  ADD CONSTRAINT mkt_contents_content_kind_check
  CHECK (content_kind IN ('regular', 'ad'));

CREATE INDEX IF NOT EXISTS idx_mkt_contents_kind
  ON mkt_contents (project_id, content_kind);

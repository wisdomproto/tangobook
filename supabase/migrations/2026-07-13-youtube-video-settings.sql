-- 롱폼 오디오북 영상: (artStyle, language, captions) 등을 mkt_youtube_contents 에 JSONB 로 저장.
-- reels 의 mkt_instagram_contents.video_settings 패턴과 일관. 기존 행은 NULL(하위호환).
ALTER TABLE mkt_youtube_contents
  ADD COLUMN IF NOT EXISTS video_settings jsonb;

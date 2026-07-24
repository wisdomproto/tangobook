-- 마케팅 블로그 다국어화 — mkt_blog_contents 에 lang 컬럼 추가.
-- 언어 변형은 같은 content_id 아래 별도 행(lang='en'|'vi'|'zh'|'th')으로 저장.
-- 발행은 content_id 기준(mkt_publish_records)이라 lang 변형이 자동으로 발행됨.
alter table mkt_blog_contents add column if not exists lang text not null default 'ko';

-- (content_id, channel, lang) 유니크 — self_hosted 재시드 멱등 보장.
create unique index if not exists mkt_blog_contents_content_channel_lang_uidx
  on mkt_blog_contents (content_id, channel, lang);

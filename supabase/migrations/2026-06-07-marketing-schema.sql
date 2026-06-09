-- =============================================================================
-- Marketing Schema Phase 0 — mkt_* tables (single-owner RLS)
-- Derived from: packages/client/src/features/marketing/types/database.ts
-- Applied: 2026-06-07
-- Project: tangobook (fxzwigjkbsptvsjraqwa)
--
-- Safety: Creates NEW tables only. No ALTER/DROP on existing tables.
-- All tables are mkt_-prefixed. RLS enabled on every table.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. mkt_projects
--    Source: Project interface (database.ts:143-196) + [drift] columns
-- ---------------------------------------------------------------------------
create table mkt_projects (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  name                        text not null,
  description                 text,
  cover_image_url             text,
  industry                    text,
  brand_name                  text,
  brand_description           text,
  target_audience             jsonb,
  usp                         text,
  brand_tone                  text,
  banned_keywords             text[],
  brand_logo_url              text,
  marketer_name               text,
  marketer_expertise          text,
  marketer_style              text,
  marketer_phrases            text[],
  sns_goal                    text,
  -- Channel-specific tone/image prompts
  blog_tone_prompt            text,
  blog_image_style_prompt     text,
  instagram_tone_prompt       text,
  instagram_image_style_prompt text,
  threads_tone_prompt         text,
  youtube_tone_prompt         text,
  youtube_image_style_prompt  text,
  ai_model_settings           jsonb,
  -- Writing guides (drift columns — text-first)
  writing_guide_global        text,
  writing_guide_blog          text,
  writing_guide_instagram     text,
  writing_guide_threads       text,
  writing_guide_youtube       text,
  -- API keys (drift — stored as JSONB per ProjectApiKeys shape)
  api_keys                    jsonb,
  target_languages            text[] not null default '{}',
  -- Reference materials (drift)
  reference_files             jsonb,
  bgm_files                   jsonb,
  reference_summary           text,
  -- Analytics config (drift)
  funnel_config               jsonb,
  ga4_config                  jsonb,
  -- Imported strategy (drift)
  imported_strategy           jsonb,
  -- Saved keywords (drift — keyword list saved from ideas module)
  saved_keywords              jsonb,
  -- Credentials (stored as JSONB — encrypted at app layer)
  wp_credentials              jsonb,
  meta_credentials            jsonb,
  -- Self-hosted site registration
  published_site              jsonb,
  sort_order                  int not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. mkt_contents
--    Source: Content interface (database.ts:198-213)
-- ---------------------------------------------------------------------------
create table mkt_contents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  title               text not null,
  category            text,
  tags                text[],
  memo                text,
  topic               text,
  status              text not null default 'draft'
                        check (status in ('draft', 'in_progress', 'published')),
  ai_model_settings   jsonb,
  confirmed           boolean not null default false,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. mkt_base_articles
--    Source: BaseArticle interface (database.ts:227-240)
-- ---------------------------------------------------------------------------
create table mkt_base_articles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  title               text,
  body                text not null default '',
  body_plain_text     text,
  word_count          int not null default 0,
  factcheck_status    text
                        check (factcheck_status in ('unchecked', 'checking', 'checked')),
  factcheck_score     numeric,
  factcheck_report    jsonb,
  prompt_used         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. mkt_blog_contents
--    Source: BlogContent interface (database.ts:242-262)
-- ---------------------------------------------------------------------------
create table mkt_blog_contents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  title               text,
  seo_title           text,
  seo_score           numeric,
  seo_details         jsonb,
  naver_keywords      jsonb,
  meta_description    text,
  url_slug            text,
  primary_keyword     text,
  secondary_keywords  text[],
  search_intent       text,
  heading_structure   text,
  channel             text,
  status              text not null default 'draft'
                        check (status in ('draft', 'in_progress', 'published')),
  published_url       text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. mkt_blog_cards
--    Source: BlogCard interface (database.ts:264-272)
-- ---------------------------------------------------------------------------
create table mkt_blog_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  blog_content_id     uuid not null references mkt_blog_contents(id) on delete cascade,
  card_type           text not null
                        check (card_type in ('text', 'image', 'divider', 'quote', 'list')),
  content             jsonb not null default '{}',
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. mkt_instagram_contents
--    Source: InstagramContent interface (database.ts:274-287)
-- ---------------------------------------------------------------------------
create table mkt_instagram_contents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  title               text,
  caption             text,
  hashtags            text[],
  content_type        text not null default 'carousel'
                        check (content_type in ('carousel', 'video', 'single')),
  video_settings      jsonb,
  status              text not null default 'draft'
                        check (status in ('draft', 'in_progress', 'published')),
  published_url       text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. mkt_instagram_cards
--    Source: InstagramCard interface (database.ts:289-301)
-- ---------------------------------------------------------------------------
create table mkt_instagram_cards (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  instagram_content_id    uuid not null references mkt_instagram_contents(id) on delete cascade,
  text_content            text,
  background_color        text,
  background_image_url    text,
  text_style              jsonb,
  image_prompt            text,
  reference_image_url     text,
  sort_order              int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. mkt_threads_contents
--    Source: ThreadsContent interface (database.ts:316-326)
-- ---------------------------------------------------------------------------
create table mkt_threads_contents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  title               text,
  thread_type         text not null default 'single'
                        check (thread_type in ('single', 'multi')),
  status              text not null default 'draft'
                        check (status in ('draft', 'in_progress', 'published')),
  published_url       text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. mkt_threads_cards
--    Source: ThreadsCard interface (database.ts:328-337)
-- ---------------------------------------------------------------------------
create table mkt_threads_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  threads_content_id  uuid not null references mkt_threads_contents(id) on delete cascade,
  text_content        text not null default '',
  media_url           text,
  media_type          text,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. mkt_youtube_contents
--     Source: YoutubeContent interface (database.ts:339-355)
-- ---------------------------------------------------------------------------
create table mkt_youtube_contents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  title               text,
  video_title         text,
  video_description   text,
  video_tags          text[],
  video_category      text,
  target_duration     text
                        check (target_duration in ('short', 'mid', 'long')),
  thumbnail_url       text,
  video_url           text,
  status              text not null default 'draft'
                        check (status in ('draft', 'in_progress', 'published')),
  youtube_video_id    text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 11. mkt_youtube_cards
--     Source: YoutubeCard interface (database.ts:357-370)
-- ---------------------------------------------------------------------------
create table mkt_youtube_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  youtube_content_id  uuid not null references mkt_youtube_contents(id) on delete cascade,
  section_type        text,
  narration_text      text,
  screen_direction    text,
  subtitle_text       text,
  image_url           text,
  image_prompt        text,
  video_prompt        text,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12. mkt_translations
--     Source: Translation interface (database.ts:426-441)
-- ---------------------------------------------------------------------------
create table mkt_translations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  language            text not null,
  channel_type        text not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'translating', 'review', 'completed')),
  title               text,
  body                text,
  cards_json          jsonb,
  seo_title           text,
  seo_description     text,
  translated_at       timestamptz,
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (content_id, language, channel_type)
);

-- ---------------------------------------------------------------------------
-- 13. mkt_publish_records
--     Source: PublishRecord interface (database.ts:443-459)
-- ---------------------------------------------------------------------------
create table mkt_publish_records (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content_id          uuid not null references mkt_contents(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  channel             text not null,
  language            text not null,
  status              text not null default 'pending',
  scheduled_at        timestamptz,
  published_at        timestamptz,
  platform_post_id    text,
  published_url       text,
  error_message       text,
  retry_count         int not null default 0,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Partial unique index: only one pending/uploading record per content+channel+language
create unique index mkt_publish_records_pending_unique
  on mkt_publish_records (content_id, channel, language)
  where status in ('pending', 'uploading');

-- ---------------------------------------------------------------------------
-- 14. mkt_card_templates
--     Source: CardTemplateRow interface (database.ts:303-314)
-- ---------------------------------------------------------------------------
create table mkt_card_templates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  name                text not null,
  bg_color            text not null default '#ffffff',
  image_y             numeric not null default 50,
  text_blocks         jsonb not null default '[]',
  preview             jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 15. mkt_card_hidden_builtins
--     Purpose: records which built-in card templates a user has hidden
--     (database.ts has no explicit interface; derived from spec line 71 and
--      CardTemplateRow context — stores builtin_id per project)
-- ---------------------------------------------------------------------------
create table mkt_card_hidden_builtins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  builtin_id          text not null,
  hidden_at           timestamptz not null default now(),
  unique (project_id, builtin_id)
);

-- ---------------------------------------------------------------------------
-- 16. mkt_competitor_profiles
--     Purpose: saved competitor analysis per project
--     (database.ts has no explicit interface; derived from CompetitorCard
--      shape in strategy.ts and spec context)
-- ---------------------------------------------------------------------------
create table mkt_competitor_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  name                text not null,
  url                 text,
  type                text,
  strengths           text,
  weaknesses          text,
  strategy            text,
  notes               text,
  metadata            jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 17. mkt_monitoring_keywords
--     Purpose: keywords to monitor for ranking / feed tracking per project
--     (database.ts has no explicit interface; derived from KeywordItem shape
--      in strategy.ts and spec context — monitoring module)
-- ---------------------------------------------------------------------------
create table mkt_monitoring_keywords (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references mkt_projects(id) on delete cascade,
  keyword             text not null,
  search_engine       text not null default 'naver'
                        check (search_engine in ('naver', 'google')),
  is_golden           boolean not null default false,
  category            text,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, keyword, search_engine)
);

-- =============================================================================
-- RLS — enable + single-owner policy on all 17 tables
-- =============================================================================

alter table mkt_projects            enable row level security;
alter table mkt_contents            enable row level security;
alter table mkt_base_articles       enable row level security;
alter table mkt_blog_contents       enable row level security;
alter table mkt_blog_cards          enable row level security;
alter table mkt_instagram_contents  enable row level security;
alter table mkt_instagram_cards     enable row level security;
alter table mkt_threads_contents    enable row level security;
alter table mkt_threads_cards       enable row level security;
alter table mkt_youtube_contents    enable row level security;
alter table mkt_youtube_cards       enable row level security;
alter table mkt_translations        enable row level security;
alter table mkt_publish_records     enable row level security;
alter table mkt_card_templates      enable row level security;
alter table mkt_card_hidden_builtins enable row level security;
alter table mkt_competitor_profiles enable row level security;
alter table mkt_monitoring_keywords enable row level security;

-- Single-owner policy: user_id = auth.uid() for all operations
create policy mkt_projects_owner            on mkt_projects            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_contents_owner            on mkt_contents            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_base_articles_owner       on mkt_base_articles       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_blog_contents_owner       on mkt_blog_contents       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_blog_cards_owner          on mkt_blog_cards          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_instagram_contents_owner  on mkt_instagram_contents  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_instagram_cards_owner     on mkt_instagram_cards     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_threads_contents_owner    on mkt_threads_contents    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_threads_cards_owner       on mkt_threads_cards       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_youtube_contents_owner    on mkt_youtube_contents    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_youtube_cards_owner       on mkt_youtube_cards       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_translations_owner        on mkt_translations        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_publish_records_owner     on mkt_publish_records     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_card_templates_owner      on mkt_card_templates      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_card_hidden_builtins_owner on mkt_card_hidden_builtins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_competitor_profiles_owner on mkt_competitor_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_monitoring_keywords_owner on mkt_monitoring_keywords for all using (user_id = auth.uid()) with check (user_id = auth.uid());

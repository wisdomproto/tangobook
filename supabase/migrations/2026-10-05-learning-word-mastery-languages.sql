-- Live QA revealed vi/zh/th learning_events rolled back by the word_mastery trigger.
-- Preserve all existing records and match the platform's supported learning languages.
begin;
alter table public.word_mastery
  drop constraint if exists word_mastery_language_check;
alter table public.word_mastery
  add constraint word_mastery_language_check
  check (language in ('ko', 'en', 'vi', 'zh', 'th'));
commit;

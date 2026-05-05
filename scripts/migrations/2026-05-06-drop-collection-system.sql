-- 2026-05-06 — Drop Collection System (MVP simplification)
-- Spec: docs/superpowers/specs/2026-05-06-mvp-simplification-design.md (§3-4)
-- Plan: docs/superpowers/plans/2026-05-06-mvp-simplification.md (Chunk 1, Task 1-1)
--
-- Intent:
--   - Drops public.collection_user table (도감 카드 per-user 상태)
--   - Drops activate_collection_item RPC
--   - Rewrites public.handle_learning_event() trigger function:
--       * REMOVES page_read silhouette/owned 전이 (collectionItemIds 루프)
--       * REMOVES word_game_completed → 4 distinct → owned 전이
--       * REMOVES card_unlock star_ledger inserts (도감 획득 보상)
--   - PRESERVES:
--       * page_read star_ledger insert (lastPage +5 / 그 외 +1)
--       * word_correct star_ledger insert (game_correct +1)
--       * word_game_completed star_ledger insert (game_correct +1)
--       * word_mastery upsert + mastery/status/SR 재계산
--       * streak (update_streak)
--       * star_ledger.source_type='card_unlock' enum 값 자체 (legacy data 보존,
--         새 적립은 자연스럽게 0 이 되며, validate_star_spend trigger 도 무관)
--
-- 적용 후 자동 효과:
--   - collection_user CASCADE drop → RLS policy "collection_user_self_all" 동시 제거
--   - activate_collection_item CASCADE drop → 의존 권한 grant 동시 제거
--   - handle_learning_event 함수 재정의 → trigger 는 동일 함수를 참조하므로
--     drop trigger 불필요 (CREATE OR REPLACE FUNCTION 만으로 즉시 반영)

BEGIN;

-- ────────────────────────────────────────────────────────────────────────
-- 1. Drop collection_user table (no FK dependents — verified 2026-05-06)
-- ────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.collection_user CASCADE;

-- ────────────────────────────────────────────────────────────────────────
-- 2. Drop activate_collection_item RPC
-- ────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.activate_collection_item(uuid, text) CASCADE;

-- ────────────────────────────────────────────────────────────────────────
-- 2.5 Drop collection_status enum (orphan after CASCADE — Postgres 는 enum 미자동삭제)
-- ────────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS public.collection_status;

-- ────────────────────────────────────────────────────────────────────────
-- 3. Rewrite handle_learning_event() trigger function
--    Source base: scripts/migrations/2026-05-06-word-game-completed.sql
--    Stripped: 도감 분기 (section 3.5, section 4) + word_game_completed 의
--              cardId metadata 참조는 무해해 보존 (단순 jsonb extract)
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_learning_event() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  mult real;
  delta int;
  is_last_page boolean;
  total_pages int;
  current_page int;
BEGIN
  -- 1. streak 갱신
  PERFORM public.update_streak(NEW.profile_id);

  mult := public.tier_multiplier(NEW.profile_id);

  -- 2. 별 적립 — 이벤트 타입별
  IF NEW.event_type = 'page_read' THEN
    current_page := (NEW.metadata->>'page')::int;
    total_pages := (NEW.metadata->>'totalPages')::int;
    is_last_page := total_pages IS NOT NULL AND current_page IS NOT NULL
                    AND current_page >= total_pages;

    delta := CASE WHEN is_last_page THEN 5 ELSE 1 END;
    INSERT INTO public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      VALUES (NEW.profile_id, (delta * mult)::int, 'page_read', NEW.id::text,
              jsonb_build_object('storybookId', NEW.storybook_id,
                                 'page', current_page,
                                 'lastPage', is_last_page));

  ELSIF NEW.event_type = 'word_correct' THEN
    INSERT INTO public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      VALUES (NEW.profile_id, (1 * mult)::int, 'game_correct', NEW.id::text,
              jsonb_build_object('word', NEW.word, 'gameType', NEW.game_type));

  ELSIF NEW.event_type = 'word_game_completed' THEN
    INSERT INTO public.star_ledger (profile_id, delta, source_type, source_id, metadata)
      VALUES (NEW.profile_id, (1 * mult)::int, 'game_correct', NEW.id::text,
              jsonb_build_object('word', NEW.word, 'gameType', NEW.game_type));
  END IF;

  -- 3. word_mastery upsert (word_correct/wrong/exposed/spoken)
  IF NEW.event_type IN ('word_correct', 'word_wrong', 'word_exposed', 'word_spoken')
     AND NEW.word IS NOT NULL THEN
    INSERT INTO public.word_mastery
      (profile_id, word, language, exposed, correct, wrong, last_reviewed_at)
    VALUES
      (NEW.profile_id, NEW.word, COALESCE(NEW.metadata->>'lang', 'ko'),
       (NEW.event_type = 'word_exposed')::int,
       (NEW.event_type IN ('word_correct', 'word_spoken'))::int,
       (NEW.event_type = 'word_wrong')::int,
       now())
    ON CONFLICT (profile_id, word, language) DO UPDATE SET
      exposed = word_mastery.exposed + excluded.exposed,
      correct = word_mastery.correct + excluded.correct,
      wrong = word_mastery.wrong + excluded.wrong,
      last_reviewed_at = now(),
      updated_at = now();

    UPDATE public.word_mastery SET
      mastery = CASE
        WHEN (correct + wrong) = 0 AND exposed > 0 THEN
          0.15 * least(1.0, exposed::real / 3.0)
        WHEN (correct + wrong) = 0 THEN 0
        ELSE 0.15 + 0.85
             * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0)
        END,
      status = CASE
        WHEN exposed = 0 THEN 'unknown'
        WHEN (correct + wrong) = 0 THEN 'seen'
        WHEN 0.15 + 0.85 * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0) >= 0.6 THEN 'mastered'
        WHEN 0.15 + 0.85 * (correct::real / nullif(correct + wrong, 0))
             * exp(- extract(epoch from (now() - last_reviewed_at)) / 86400.0 / 30.0)
             * least(1.0, (correct + wrong)::real / 5.0) >= 0.2 THEN 'practiced'
        ELSE 'seen'
        END,
      interval_days = CASE
        WHEN NEW.event_type = 'word_wrong' THEN 1
        WHEN interval_days = 0 THEN 1
        WHEN interval_days = 1 THEN 3
        WHEN interval_days = 3 THEN 7
        WHEN interval_days = 7 THEN 14
        ELSE 30
        END,
      next_review_at = now() + (CASE
        WHEN NEW.event_type = 'word_wrong' THEN 1
        WHEN interval_days = 0 THEN 1
        WHEN interval_days = 1 THEN 3
        WHEN interval_days = 3 THEN 7
        WHEN interval_days = 7 THEN 14
        ELSE 30
        END || ' days')::interval
    WHERE profile_id = NEW.profile_id AND word = NEW.word
      AND language = COALESCE(NEW.metadata->>'lang', 'ko');
  END IF;

  -- (도감/카드 분기 제거됨 — MVP 단순화 2026-05-06)

  RETURN NEW;
END;
$$;

-- trigger learning_events_handle 는 기존에 정의된 그대로 유지 (함수 참조만 즉시 갱신).

COMMIT;

-- ────────────────────────────────────────────────────────────────────────
-- 적용 후 검증 쿼리:
--   SELECT 1 FROM information_schema.tables
--     WHERE table_schema='public' AND table_name='collection_user';   -- 0 rows
--   SELECT proname FROM pg_proc WHERE proname='activate_collection_item'; -- 0 rows
--   SELECT proname FROM pg_proc WHERE proname='handle_learning_event'; -- 1 row
-- ────────────────────────────────────────────────────────────────────────

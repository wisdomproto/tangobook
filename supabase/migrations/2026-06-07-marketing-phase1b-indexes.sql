-- Phase 1b optional perf indexes (non-blocking)
-- Applied via MCP apply_migration (project fxzwigjkbsptvsjraqwa) on 2026-06-07.
-- Confirmed absent before application (only PK indexes existed on both tables).
-- get_advisors: no new security warnings after application.
create index if not exists mkt_instagram_cards_parent_sort
  on mkt_instagram_cards(instagram_content_id, sort_order);
create index if not exists mkt_threads_cards_parent_sort
  on mkt_threads_cards(threads_content_id, sort_order);

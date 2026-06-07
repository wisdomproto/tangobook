-- Phase 1c optional perf indexes (non-blocking; defensive if-not-exists)
-- Applied via MCP apply_migration (project fxzwigjkbsptvsjraqwa) on 2026-06-07.
-- Confirmed absent before application (only PK indexes existed on both tables).
create index if not exists idx_mkt_youtube_contents_content
  on mkt_youtube_contents (content_id);
create index if not exists idx_mkt_youtube_cards_parent_sort
  on mkt_youtube_cards (youtube_content_id, sort_order);

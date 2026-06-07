-- Phase 1a optional perf indexes (non-blocking)
-- Applied via MCP apply_migration on 2026-06-07 (project: fxzwigjkbsptvsjraqwa)

-- Enforce 1:1 base-article invariant at DB level + speed up content graph fetch
create unique index if not exists mkt_base_articles_content_unique
  on mkt_base_articles(content_id);

-- Speed up card retrieval ordered by sort_order within a blog content
create index if not exists mkt_blog_cards_parent_sort
  on mkt_blog_cards(blog_content_id, sort_order);

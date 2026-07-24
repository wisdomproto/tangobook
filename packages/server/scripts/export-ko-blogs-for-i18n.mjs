// DB 의 ko 발행본 블로그(본문 + FAQ + 관련링크 + CTA 카드 전체)를 번역 소스로 덤프.
// 소스 json(_data/.../blogs/<id>.json)은 본문 6섹션뿐이라, 시드 후 보강된
// FAQ/CTA/관련링크까지 다국어화하려면 DB 발행본이 정본이다.
// 산출: _data/marketing/blogs/i18n/_source-ko/<storybookId>.json
// 실행: node run-with-env.mjs <.env> node export-ko-blogs-for-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dir, '_data', 'marketing', 'blogs', 'i18n', '_source-ko');
const CHANNEL = 'self_hosted';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요');
const sb = createClient(url, key, { auth: { persistSession: false } });

fs.mkdirSync(OUT, { recursive: true });

const { data: blogs, error } = await sb
  .from('mkt_blog_contents')
  .select('id, content_id, seo_title, title, meta_description, url_slug, primary_keyword, secondary_keywords')
  .eq('channel', CHANNEL)
  .eq('lang', 'ko');
if (error) throw new Error(`blog_contents 조회 실패: ${error.message}`);

// content_id → storybookId (memo='storybook:<id>')
const ids = blogs.map((b) => b.content_id);
const { data: contents } = await sb.from('mkt_contents').select('id, memo').in('id', ids);
const sbIdByContent = new Map();
for (const c of contents ?? []) {
  const m = c.memo || '';
  sbIdByContent.set(c.id, m.startsWith('storybook:') ? m.slice('storybook:'.length) : null);
}

let written = 0;
let skipped = 0;
for (const b of blogs) {
  const storybookId = sbIdByContent.get(b.content_id);
  if (!storybookId) {
    skipped++;
    continue;
  }
  const { data: cards } = await sb
    .from('mkt_blog_cards')
    .select('card_type, content, sort_order')
    .eq('blog_content_id', b.id)
    .order('sort_order');
  const out = {
    storybookId,
    seo_title: b.seo_title ?? b.title ?? '',
    meta_description: b.meta_description ?? '',
    primary_keyword: b.primary_keyword ?? '',
    secondary_keywords: b.secondary_keywords ?? [],
    url_slug: b.url_slug ?? '',
    cards: (cards ?? []).map((c) => ({
      card_type: c.card_type,
      sort_order: c.sort_order,
      content: c.content ?? {},
    })),
  };
  fs.writeFileSync(path.join(OUT, `${storybookId}.json`), JSON.stringify(out, null, 2), 'utf8');
  written++;
}

console.log(`export 완료: ${written}편 (skip ${skipped}, memo 없음)`);

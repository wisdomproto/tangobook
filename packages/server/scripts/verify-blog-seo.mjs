// 내부 블로그 SEO 체크리스트 검증 전용(읽기만). fetch 없이 카드 텍스트로 재계산.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const co = (t, k) => (k ? t.split(k).length - 1 : 0);

const { data: blogs } = await supa
  .from('mkt_blog_contents')
  .select('id,content_id,url_slug,primary_keyword,secondary_keywords')
  .eq('channel', 'self_hosted');
const { data: contents } = await supa.from('mkt_contents').select('id,title');
const byId = Object.fromEntries((contents || []).map((c) => [c.id, c.title]));

const fail = [];
for (const b of blogs) {
  const { data: cards } = await supa.from('mkt_blog_cards').select('content').eq('blog_content_id', b.id);
  const t = (cards || []).map((c) => c.content?.text || '').join(' ');
  const cl = {
    slug: !!b.url_slug,
    faq: /Q\.|자주 묻는 질문/.test(t),
    h2: (t.match(/<h2/gi) || []).length >= 2,
    link: t.includes('관련') || /href=/.test(t),
    primary: b.primary_keyword ? co(t, b.primary_keyword) >= 4 : false,
    secondary: (b.secondary_keywords || []).some((k) => k && t.includes(k)),
  };
  const f = Object.entries(cl).filter(([, v]) => !v).map(([k]) => k);
  if (f.length) fail.push({ title: byId[b.content_id], f });
}
console.log(`seoFail=${fail.length}/${blogs.length}`);
if (fail.length) console.log(JSON.stringify(fail, null, 1));

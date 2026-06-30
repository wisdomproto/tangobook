// 각 내부 블로그(self_hosted) 끝에 "동화책 보러가기" CTA 카드를 추가한다.
// 링크: https://tangobook.co.kr/library/<storybookId> (BookDetailPage). 멱등(이미 있으면 스킵).
//   node scripts/add-blog-cta.mjs --dry-run [--limit=N]
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
const SITE = process.env.TANGOBOOK_SITE || 'https://tangobook.co.kr';
const DRY = process.argv.includes('--dry-run');
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

const isCta = (t) => /동화책 보러가기|data-blog-cta/.test(t || '');

function ctaHtml(title, sbId) {
  const href = `${SITE}/library/${sbId}`;
  return (
    `<div data-blog-cta="1" style="margin:2.5rem 0 0.5rem;padding:1.75rem 1.5rem;background:#FFF4F1;border-radius:16px;text-align:center;">` +
    `<p style="margin:0 0 0.5rem;font-size:17px;font-weight:700;color:#1A1A1A;">「${title}」가 궁금하신가요?</p>` +
    `<p style="margin:0 0 1.25rem;font-size:15px;color:#555555;line-height:1.6;">아름다운 그림과 한국어·영어 음성으로 탱고북에서 직접 만나보세요.</p>` +
    `<a href="${href}" style="display:inline-block;background:#FF6B5A;color:#FFFFFF;padding:13px 30px;border-radius:999px;font-weight:700;text-decoration:none;font-size:16px;">📖 동화책 보러가기 →</a>` +
    `</div>`
  );
}

const { data: blogs } = await supa
  .from('mkt_blog_contents')
  .select('id,content_id,user_id')
  .eq('channel', 'self_hosted');
const { data: contents } = await supa.from('mkt_contents').select('id,memo,title');
const cById = Object.fromEntries((contents || []).map((c) => [c.id, c]));

let added = 0, skipped = 0;
const samples = [];
const list = blogs.slice(0, LIMIT);

for (const blog of list) {
  const ct = cById[blog.content_id];
  if (!ct || !ct.memo?.startsWith('storybook:')) continue;
  const sbId = ct.memo.replace('storybook:', '');

  const { data: cards } = await supa
    .from('mkt_blog_cards')
    .select('content,sort_order')
    .eq('blog_content_id', blog.id)
    .order('sort_order');
  if ((cards || []).some((c) => isCta(c.content?.text))) {
    skipped++;
    continue;
  }
  const html = ctaHtml(ct.title, sbId);
  if (samples.length < 3) samples.push({ title: ct.title, href: `${SITE}/library/${sbId}` });

  if (!DRY) {
    const now = new Date().toISOString();
    await supa.from('mkt_blog_cards').insert({
      user_id: blog.user_id,
      blog_content_id: blog.id,
      card_type: 'text',
      content: { text: html, url: '', alt: '', caption: '', image_prompt: '', image_style: '' },
      sort_order: cards?.length || 0,
      created_at: now,
      updated_at: now,
    });
  }
  added++;
}

console.log(`${DRY ? '[DRY] ' : ''}added=${added} skipped=${skipped}`);
console.log('samples:', JSON.stringify(samples, null, 1));

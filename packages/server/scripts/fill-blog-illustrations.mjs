// 내부 블로그(self_hosted) 152개에 원본 동화책 삽화 배치 + 관련 글(내부링크) 추가 + SEO 체크리스트 검증.
// 텍스트는 기존 것을 유지하고, 비어있던 이미지 슬롯(content.url)만 채운다. 멱등(재실행 안전).
//   node scripts/fill-blog-illustrations.mjs --dry-run [--limit=N]
//   node scripts/fill-blog-illustrations.mjs            # 실제 반영
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env), STORYBOOK_API(기본 http://localhost:3500)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API = process.env.STORYBOOK_API || 'http://localhost:3500';
const DRY = process.argv.includes('--dry-run');
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

if (!SUPABASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supa = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

const isFaq = (t) => /자주 묻는 질문|FAQ/i.test(t);
const isRelated = (t) => /함께 읽으면|관련 글/.test(t);
const h2of = (t) => {
  const m = (t || '').match(/<h2>(.*?)<\/h2>/i);
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : '';
};
// cover 다음 본문 섹션 슬롯 k개에 page 삽화를 스토리 순서로 균등 배분
function pickPages(pages, k) {
  if (k <= 0 || !pages.length) return [];
  if (k === 1) return [pages[Math.floor(pages.length / 2)]];
  const out = [];
  for (let i = 0; i < k; i++) out.push(pages[Math.round((i * (pages.length - 1)) / (k - 1))]);
  return out;
}
function checklist(blog, allText) {
  const pk = blog.primary_keyword || '';
  return {
    slug: !!blog.url_slug,
    faq: /Q\.|자주 묻는 질문/.test(allText),
    h2: (allText.match(/<h2/gi) || []).length >= 2,
    link: allText.includes('관련') || /href=/.test(allText),
    primary: pk ? allText.split(pk).length - 1 >= 4 : false,
    secondary: (blog.secondary_keywords || []).some((k) => k && allText.includes(k)),
  };
}

const { data: blogs, error: be } = await supa
  .from('mkt_blog_contents')
  .select('id,content_id,url_slug,primary_keyword,secondary_keywords,user_id')
  .eq('channel', 'self_hosted');
if (be) {
  console.error(be);
  process.exit(1);
}
const { data: contents } = await supa.from('mkt_contents').select('id,memo,category,title');
const cById = Object.fromEntries((contents || []).map((c) => [c.id, c]));

// 관련 글용: 카테고리별 {title, slug} 풀
const slugByCat = {};
for (const b of blogs) {
  const c = cById[b.content_id];
  if (!c || !b.url_slug) continue;
  const cat = c.category || 'etc';
  (slugByCat[cat] ??= []).push({ title: c.title, slug: b.url_slug });
}

let processed = 0, imgFilled = 0, relAdded = 0;
const seoFail = [], fetchFail = [];
const list = blogs.slice(0, LIMIT);

for (const blog of list) {
  const ct = cById[blog.content_id];
  if (!ct || !ct.memo?.startsWith('storybook:')) continue;
  const sbId = ct.memo.replace('storybook:', '');

  let data;
  try {
    const r = await fetch(`${API}/api/storybooks/${sbId}`);
    const j = await r.json();
    data = j.data || j;
  } catch {
    fetchFail.push(ct.title);
    continue;
  }
  const cover = data.coverImage;
  const pages = (data.pages || []).map((p) => p.illustrationUrl).filter(Boolean);
  if (!cover && !pages.length) {
    fetchFail.push(ct.title + '(no-img)');
    continue;
  }

  const { data: cards } = await supa
    .from('mkt_blog_cards')
    .select('*')
    .eq('blog_content_id', blog.id)
    .order('sort_order');
  const body = (cards || []).filter(
    (c) => !isFaq(c.content?.text || '') && !isRelated(c.content?.text || '')
  );
  const imgs = [cover || pages[0], ...pickPages(pages, Math.max(0, body.length - 1))];

  const updates = [];
  body.forEach((c, i) => {
    const u = imgs[i];
    if (!u) return;
    const h2 = h2of(c.content?.text);
    updates.push({
      id: c.id,
      content: { ...c.content, url: encodeURI(u), alt: h2 ? `${ct.title} - ${h2}` : `${ct.title} 그림책 삽화` },
    });
  });

  const hasRel = (cards || []).some((c) => isRelated(c.content?.text || ''));
  let relCard = null;
  if (!hasRel) {
    const cat = ct.category || 'etc';
    const others = (slugByCat[cat] || []).filter((s) => s.slug && s.slug !== blog.url_slug);
    const pick = others.sort((a, b) => a.title.localeCompare(b.title, 'ko')).slice(0, 4);
    if (pick.length) {
      const lis = pick
        .map((o) => `<li><a href="https://tangobook.co.kr/blog/${o.slug}">${o.title}</a></li>`)
        .join('');
      relCard = `<h2>함께 읽으면 좋은 명작 동화</h2><p>이 동화를 재미있게 읽었다면 이런 <strong>명작 동화</strong>도 함께 읽어 보세요.</p><ul>${lis}</ul>`;
    }
  }

  const allText = (cards || []).map((c) => c.content?.text || '').join(' ') + (relCard || '');
  const fails = Object.entries(checklist(blog, allText))
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (fails.length) seoFail.push({ title: ct.title, fails });

  if (DRY) {
    console.log(
      `${ct.title}: img=${updates.length}/${body.length} rel=${relCard ? '+' : ' '} seo=${fails.length ? fails.join(',') : 'OK'}`
    );
  } else {
    const now = new Date().toISOString();
    for (const u of updates) {
      await supa.from('mkt_blog_cards').update({ content: u.content, updated_at: now }).eq('id', u.id);
    }
    if (relCard) {
      await supa.from('mkt_blog_cards').insert({
        user_id: blog.user_id,
        blog_content_id: blog.id,
        card_type: 'text',
        content: { text: relCard, url: '', alt: '', caption: '', image_prompt: '', image_style: '' },
        sort_order: cards?.length || 0,
        created_at: now,
        updated_at: now,
      });
    }
  }
  processed++;
  imgFilled += updates.length;
  if (relCard) relAdded++;
}

console.log(
  `\n${DRY ? '[DRY] ' : ''}processed=${processed} imgFilled=${imgFilled} relAdded=${relAdded} seoFail=${seoFail.length} fetchFail=${fetchFail.length}`
);
if (fetchFail.length) console.log('fetchFail:', fetchFail.slice(0, 12).join(', '));
if (seoFail.length) console.log('seoFail:', JSON.stringify(seoFail.slice(0, 20)));

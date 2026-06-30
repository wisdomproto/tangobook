// SEO 체크리스트 미달 내부 블로그를 보강한다.
// - primary 미달: 도입 섹션에 주요 키워드를 부족분만큼 자연스러운 안내 문장으로 보강
// - secondary 미달: 도입 섹션에 보조 키워드를 정확 표기로 보강
// - link 미달: 관련 글(내부링크) 섹션 강제 추가(같은 분류 우선, 부족하면 전체 풀)
// 멱등: 도입 카드에 data-seo-boost 마커가 있으면 보강 스킵.
//   node scripts/boost-blog-seo.mjs --dry-run [--limit=N]
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

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const DRY = process.argv.includes('--dry-run');
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

const isFaq = (t) => /자주 묻는 질문|FAQ/i.test(t);
const isRelated = (t) => /함께 읽으면|관련 글/.test(t);
const countOf = (text, kw) => (kw ? text.split(kw).length - 1 : 0);
function checklist(blog, allText) {
  const pk = blog.primary_keyword || '';
  return {
    slug: !!blog.url_slug,
    faq: /Q\.|자주 묻는 질문/.test(allText),
    h2: (allText.match(/<h2/gi) || []).length >= 2,
    link: allText.includes('관련') || /href=/.test(allText),
    primary: pk ? countOf(allText, pk) >= 4 : false,
    secondary: (blog.secondary_keywords || []).some((k) => k && allText.includes(k)),
  };
}
function primaryBoost(pk, need) {
  const lines = [
    `${pk} 줄거리가 궁금하신가요?`,
    `${pk}의 교훈을 그림과 함께 살펴봅니다.`,
    `${pk} 이야기의 핵심 장면도 만나 보세요.`,
    `아이와 ${pk}를 함께 읽으며 이야기를 나눠 보세요.`,
  ];
  return lines.slice(0, Math.min(4, Math.max(1, need))).join(' ');
}
function secondaryBoost(sk, title) {
  const ks = (sk || []).filter(Boolean).slice(0, 3);
  return `${ks.join(', ')} 등 ${title}에 대한 다양한 이야기를 함께 담았습니다.`;
}

const { data: blogs } = await supa
  .from('mkt_blog_contents')
  .select('id,content_id,url_slug,primary_keyword,secondary_keywords,user_id')
  .eq('channel', 'self_hosted');
const { data: contents } = await supa.from('mkt_contents').select('id,memo,category,title');
const cById = Object.fromEntries((contents || []).map((c) => [c.id, c]));

const slugByCat = {};
const allSlugs = [];
for (const b of blogs) {
  const c = cById[b.content_id];
  if (!c || !b.url_slug) continue;
  const entry = { title: c.title, slug: b.url_slug };
  (slugByCat[c.category || 'etc'] ??= []).push(entry);
  allSlugs.push(entry);
}

let boosted = 0, primFix = 0, secFix = 0, linkFix = 0;
const samples = [];
const list = blogs.slice(0, LIMIT);

for (const blog of list) {
  const ct = cById[blog.content_id];
  if (!ct) continue;
  const { data: cards } = await supa
    .from('mkt_blog_cards')
    .select('*')
    .eq('blog_content_id', blog.id)
    .order('sort_order');
  const allText = (cards || []).map((c) => c.content?.text || '').join(' ');
  const cl = checklist(blog, allText);
  if (cl.primary && cl.secondary && cl.link) continue;

  const body = (cards || []).filter(
    (c) => !isFaq(c.content?.text || '') && !isRelated(c.content?.text || '')
  );
  const intro = body[0];
  if (!intro) continue;
  if ((intro.content?.text || '').includes('data-seo-boost')) continue;

  const pk = blog.primary_keyword || '';
  const parts = [];
  if (!cl.primary && pk) parts.push(primaryBoost(pk, 4 - countOf(allText, pk)));
  if (!cl.secondary && (blog.secondary_keywords || []).length)
    parts.push(secondaryBoost(blog.secondary_keywords, ct.title));

  const now = new Date().toISOString();

  // 도입 보강 문단
  let newIntroText = null;
  if (parts.length) {
    newIntroText = (intro.content?.text || '') + `<p data-seo-boost="1">${parts.join(' ')}</p>`;
  }

  // link 미달 → 관련 글 추가
  let relCard = null;
  if (!cl.link) {
    const cat = ct.category || 'etc';
    let pool = (slugByCat[cat] || []).filter((s) => s.slug && s.slug !== blog.url_slug);
    if (pool.length < 4) pool = allSlugs.filter((s) => s.slug && s.slug !== blog.url_slug);
    const pick = pool.sort((a, b) => a.title.localeCompare(b.title, 'ko')).slice(0, 4);
    if (pick.length) {
      const lis = pick
        .map((o) => `<li><a href="https://tangobook.co.kr/blog/${o.slug}">${o.title}</a></li>`)
        .join('');
      relCard = `<h2>함께 읽으면 좋은 명작 동화</h2><p>이 동화를 재미있게 읽었다면 이런 글도 함께 읽어 보세요.</p><ul>${lis}</ul>`;
    }
  }

  const fails = Object.entries(cl).filter(([, v]) => !v).map(([k]) => k);
  if (samples.length < 8) samples.push({ title: ct.title, fails, boost: parts.join(' ') || '(none)', rel: !!relCard });

  if (!DRY) {
    if (newIntroText) {
      await supa
        .from('mkt_blog_cards')
        .update({ content: { ...intro.content, text: newIntroText }, updated_at: now })
        .eq('id', intro.id);
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
  boosted++;
  if (!cl.primary) primFix++;
  if (!cl.secondary) secFix++;
  if (!cl.link) linkFix++;
}

console.log(`${DRY ? '[DRY] ' : ''}boosted=${boosted} primaryFix=${primFix} secondaryFix=${secFix} linkFix=${linkFix}`);
console.log('samples:', JSON.stringify(samples, null, 2));

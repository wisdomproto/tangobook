#!/usr/bin/env node
/**
 * 네이버에 올리기 전 글 품질 채점.
 *
 * `verify-blog-seo.mjs` 는 **우리 웹 블로그** 기준(slug·키워드 반복·내부링크)이라
 * 네이버 판정과 다르다. 이건 네이버 D.I.A 쪽에서 통용되는 항목만 본다.
 *
 * ⚠️ 기준값은 업계 통용치이고 **네이버 공식 수치가 아니다**. 상대 비교용으로 쓸 것.
 *
 * 사용:
 *   node packages/server/scripts/score-naver-seo.mjs --category=nature
 *   node packages/server/scripts/score-naver-seo.mjs --book=장수풍뎅이 --detail
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);

const sb = async (q) => {
  const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

/** 항목별 배점 — 합 100. 🔴 네이버 공식 배점이 아니라 우리가 정한 상대 지표다. */
function score(post) {
  // 🔴 태그는 여기서 재지 않는다 — `mkt_contents.tags` 는 ["동화책","nature"] 내부 분류이고,
  //    네이버 태그 10개는 발행 시점에 생성된다. 저장된 글의 속성이 아니라 상수라 지표가 안 된다.
  const { chars, images, h2, titleHasKeyword, faq } = post;
  const rows = [
    ['본문 길이', chars >= 1500 ? 35 : chars >= 800 ? 21 : 6, 35, `${chars}자`],
    ['이미지', images >= 5 ? 24 : images >= 3 ? 14 : 5, 24, `${images}장`],
    ['소제목', h2 >= 3 ? 18 : h2 >= 1 ? 10 : 0, 18, `${h2}개`],
    ['제목 키워드', titleHasKeyword ? 14 : 0, 14, titleHasKeyword ? '포함' : '없음'],
    ['FAQ', faq ? 9 : 0, 9, faq ? '있음' : '없음'],
  ];
  const total = rows.reduce((s, r) => s + r[1], 0);
  const grade = total >= 90 ? 'A' : total >= 70 ? 'B' : total >= 50 ? 'C' : 'D';
  return { rows, total, grade };
}

const main = async () => {
  const filter = args.book
    ? `title=ilike.*${encodeURIComponent(args.book)}*`
    : `category=eq.${args.category ?? 'nature'}`;
  const contents = await sb(`mkt_contents?select=id,title,tags&${filter}&order=title`);

  const results = [];
  for (const c of contents) {
    const [blog] = await sb(
      `mkt_blog_contents?select=id,title,primary_keyword&content_id=eq.${c.id}&lang=eq.ko&limit=1`,
    );
    if (!blog) continue;
    const cards = await sb(`mkt_blog_cards?select=content&blog_content_id=eq.${blog.id}`);
    const html = cards.map((k) => k.content?.text ?? '').join('');
    const plain = html.replace(/<[^>]+>/g, ' ');
    const kw = blog.primary_keyword || c.title;
    const post = {
      chars: plain.replace(/\s/g, '').length,
      images: cards.filter((k) => k.content?.url).length,
      h2: (html.match(/<h2/gi) || []).length,
      // 태그는 발행 시점에 붙인다 — 우리가 넣기로 한 10개를 전제로 센다
      tagCount: Array.isArray(c.tags) && c.tags.length ? c.tags.length : 10,
      titleHasKeyword: (blog.title || c.title).includes(kw),
      faq: /자주 묻는 질문|Q\./.test(html),
    };
    results.push({ title: c.title, ...score(post), post });
  }

  if (args.detail) {
    for (const r of results) {
      console.log(`\n${r.title} — ${r.total}점 (${r.grade})`);
      for (const [k, got, max, note] of r.rows)
        console.log(`  ${got === max ? '🟢' : got >= max * 0.6 ? '🟡' : '🔴'} ${k.padEnd(7)} ${got}/${max}  ${note}`);
    }
  }

  const dist = results.reduce((a, r) => ((a[r.grade] = (a[r.grade] ?? 0) + 1), a), {});
  const avg = Math.round(results.reduce((s, r) => s + r.total, 0) / results.length);
  console.log(`\n=== ${results.length}편 · 평균 ${avg}점 ===`);
  console.log(['A', 'B', 'C', 'D'].map((g) => `${g} ${dist[g] ?? 0}편`).join(' · '));

  // 항목별 어디서 점수를 잃는지
  const lost = {};
  for (const r of results)
    for (const [k, got, max] of r.rows) lost[k] = (lost[k] ?? 0) + (max - got);
  console.log('\n감점이 큰 항목:');
  Object.entries(lost)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(8)} -${v}점`));

  const worst = results.sort((a, b) => a.total - b.total).slice(0, 5);
  console.log('\n최하위 5편:', worst.map((w) => `${w.title}(${w.total})`).join(' · '));
};

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

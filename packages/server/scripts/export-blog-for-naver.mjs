#!/usr/bin/env node
/**
 * 마케팅 블로그 1편을 네이버 블로그에 손으로 올리기 좋은 형태로 추출한다.
 *
 * 발행기(feat/naver-blog-publisher)가 완성되기 전까지의 다리 역할이자,
 * 자동화가 만들어야 할 결과물의 기준이기도 하다.
 *
 * 산출물 → out/naver-posts/<slug>/
 *   POST.md    제목 후보 · 태그 · 본문(이미지 삽입 위치 표시)
 *   01.webp …  본문에 넣는 순서대로 번호 매긴 삽화
 *
 * 사용:
 *   node packages/server/scripts/export-blog-for-naver.mjs --book=장수풍뎅이
 *   node packages/server/scripts/export-blog-for-naver.mjs --blog=<uuid>
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..', '..');

for (const line of (await fs.readFile(path.join(repoRoot, 'packages/server/.env'), 'utf-8')).split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);

async function sb(pathQuery) {
  const res = await fetch(`${SB}/rest/v1/${pathQuery}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/**
 * HTML → 스마트에디터에 붙여넣을 평문.
 * 🔴 HTML 을 그대로 붙이면 에디터가 인라인 스타일을 흘리거나 통째로 escape 한다.
 *    소제목은 마커만 남기고, 서식은 에디터에서 사람이 입힌다.
 */
function toPlain(html) {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis, (_, t) => `\n## ${t.trim()}\n`)
    .replace(/<li[^>]*>\s*<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>\s*<\/li>/gis, (_, href, t) => `- ${t} → ${href}\n`)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, (_, href, t) => `${t} (${href})`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/ul>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const main = async () => {
  let blogId = args.blog;
  let title = args.book;

  if (!blogId) {
    if (!title) throw new Error('--book=<제목> 또는 --blog=<uuid> 필요');
    const rows = await sb(
      `mkt_contents?select=id,title,category,mkt_blog_contents(id,lang)&title=ilike.*${encodeURIComponent(title)}*`,
    );
    const hit = rows.find((r) => r.mkt_blog_contents?.some((b) => b.lang === 'ko'));
    if (!hit) throw new Error(`ko 블로그가 있는 콘텐츠를 못 찾음: ${title}`);
    blogId = hit.mkt_blog_contents.find((b) => b.lang === 'ko').id;
    title = hit.title;
  }
  if (!title) {
    const [row] = await sb(`mkt_blog_contents?select=mkt_contents(title)&id=eq.${blogId}`);
    title = row?.mkt_contents?.title ?? blogId;
  }

  const cards = await sb(`mkt_blog_cards?select=sort_order,content&blog_content_id=eq.${blogId}&order=sort_order`);
  if (!cards.length) throw new Error('카드가 없음');

  const slug = title.replace(/[\\/:*?"<>|]/g, '').trim();
  const outDir = path.join(repoRoot, 'out', 'naver-posts', slug);
  await fs.mkdir(outDir, { recursive: true });

  const body = [];
  let imgNo = 0;
  for (const c of cards) {
    const text = toPlain(c.content?.text ?? '');
    if (text) body.push(text);
    const url = c.content?.url;
    if (url) {
      imgNo += 1;
      const file = `${String(imgNo).padStart(2, '0')}.webp`;
      const res = await fetch(encodeURI(decodeURI(url)));
      if (res.ok) {
        await fs.writeFile(path.join(outDir, file), Buffer.from(await res.arrayBuffer()));
        const cap = c.content.caption ? ` — 캡션: ${c.content.caption}` : '';
        body.push(`[사진 ${file}]${cap}`);
      } else {
        body.push(`[사진 받기 실패 ${res.status}] ${url}`);
        console.warn(`  ! 이미지 ${res.status}: ${url.slice(0, 80)}`);
      }
    }
  }

  const post = `# ${title} — 네이버 발행용

## 제목 후보 (하나 골라 쓰기)
- ${title}, 아이와 함께 보는 자연관찰 그림책
- ${title} 관찰 포인트와 부모 가이드
- 우리 아이 첫 ${title} 그림책 | 탱고북

## 카테고리
자연관찰 동화

## 태그 (10개, 쉼표 구분)
${title}, ${title}그림책, 유아그림책, 자연관찰, 자연관찰책, 유아자연관찰, 4세그림책, 5세그림책, 6세그림책, 탱고북

---
## 본문 — 아래를 순서대로 붙여넣고, [사진 NN] 자리에 같은 번호 파일을 올린다
🔴 '## ' 로 시작하는 줄은 에디터에서 **소제목** 서식을 입힐 것.

${body.join('\n\n')}
`;

  await fs.writeFile(path.join(outDir, 'POST.md'), post, 'utf-8');
  console.log(`✅ ${slug} — 섹션 ${cards.length} · 이미지 ${imgNo}장`);
  console.log(`   → ${path.relative(repoRoot, outDir)}`);
};

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

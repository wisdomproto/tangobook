#!/usr/bin/env node
/**
 * 마케팅 블로그 1편을 네이버 블로그에 손으로 올리기 좋은 형태로 추출한다.
 *
 * 발행기(feat/naver-blog-publisher)가 완성되기 전까지의 다리 역할이자,
 * 자동화가 만들어야 할 결과물의 기준이기도 하다.
 *
 * 산출물 → out/naver-posts/<slug>/
 *   POST.html  🔴 이걸 브라우저로 연다. 블록마다 「복사」 버튼 — 텍스트도 이미지도.
 *   POST.md    같은 내용의 평문(참고용)
 *   01.webp …  본문에 넣는 순서대로 번호 매긴 삽화
 *
 * 🔴 이미지를 base64 로 HTML 안에 박는 이유: file:// 로 열었을 때 외부 파일을 canvas 에
 *    올리면 tainted 라 toBlob 이 막힌다 = 클립보드 복사가 안 된다. 자체 포함이라야 동작한다.
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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 브라우저로 열어 버튼만 누르면 되는 작업 페이지. 자체 포함(이미지 base64). */
function buildHtml(title, blocks) {
  const tags = `${title}, ${title}그림책, 유아그림책, 자연관찰, 자연관찰책, 유아자연관찰, 4세그림책, 5세그림책, 6세그림책, 탱고북`;
  const postTitle = `${title} 뿔은 왜 있을까? 아이와 보는 자연관찰 그림책`;

  const rows = blocks
    .map((b, i) => {
      if (b.kind === 'image') {
        return `<div class="blk img">
  <div class="n">${i + 1}</div>
  <img src="${b.dataUri}" alt="">
  <div class="meta">
    <div class="fn">${esc(b.file)}</div>
    ${b.caption ? `<div class="cap">캡션: ${esc(b.caption)}<button class="mini" data-copy="${esc(b.caption)}">캡션 복사</button></div>` : ''}
    <button class="copy imgbtn" data-img="${i}">🖼 이미지 복사 → 에디터에서 Ctrl+V</button>
  </div>
</div>`;
      }
      return `<div class="blk">
  <div class="n">${i + 1}</div>
  <div class="meta">
    ${b.heading ? `<div class="h">소제목 ▸ ${esc(b.heading)}</div>` : ''}
    <pre>${esc(b.raw.replace(/^## .*\n?/, ''))}</pre>
    <button class="copy" data-copy="${esc(b.raw.replace(/^## /, ''))}">📋 이 블록 복사</button>
  </div>
</div>`;
    })
    .join('\n');

  return `<!doctype html><meta charset="utf-8"><title>${esc(title)} — 네이버 발행</title>
<style>
 body{font-family:Pretendard,-apple-system,'Malgun Gothic',sans-serif;max-width:860px;margin:0 auto;padding:24px;background:#FFF9F3;color:#3F2F24}
 h1{font-size:20px;margin:0 0 4px} .sub{color:#6D5A4C;font-size:13px;margin-bottom:20px}
 .top{background:#fff;border-radius:12px;padding:16px;margin-bottom:20px}
 .top label{display:block;font-size:12px;color:#6D5A4C;margin:10px 0 4px}
 .top input{width:100%;padding:9px;border:1px solid #FFDDBF;border-radius:8px;font-size:14px;font-family:inherit}
 .row{display:flex;gap:8px;align-items:center}
 .blk{display:flex;gap:12px;background:#fff;border-radius:12px;padding:14px;margin-bottom:12px}
 .n{flex:0 0 26px;height:26px;border-radius:13px;background:#FFE4DC;color:#E84B2A;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
 .meta{flex:1;min-width:0}
 .h{font-weight:700;font-size:14px;color:#E84B2A;margin-bottom:6px}
 pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:14px;line-height:1.65;margin:0 0 10px}
 .blk.img img{width:150px;border-radius:8px;flex:0 0 150px;align-self:flex-start}
 .fn{font-size:12px;color:#6D5A4C} .cap{font-size:13px;margin:6px 0}
 button{cursor:pointer;font-family:inherit}
 .copy{background:#FF5E3A;color:#fff;border:0;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700}
 .mini{background:#fff;border:1px solid #FFDDBF;border-radius:999px;padding:3px 10px;font-size:12px;margin-left:6px}
 .copy.ok{background:#5CC99F}
 .note{background:#FFF0E0;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.6;margin-bottom:16px}
 .all{background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center}
 .big{font-size:15px;padding:13px 26px}
 .hint{font-size:12px;color:#6D5A4C;line-height:1.6;margin-top:10px}
</style>
<h1>${esc(title)} — 네이버 발행</h1>
<div class="sub">위에서부터 순서대로 복사 → 스마트에디터에 붙여넣기. 이미지도 버튼으로 복사됩니다.</div>

<div class="note">
 🔴 발행 패널에서 <b>공개 설정 = 전체공개</b> · <b>검색 허용 체크</b> 확인.<br>
 🔴 <b>소제목 ▸</b> 로 표시된 줄은 붙여넣은 뒤 에디터에서 <b>소제목</b> 서식을 입히세요.
</div>

<div class="all">
 <button class="copy big" id="all">📄 전체 복사 (글 + 이미지 한 번에)</button>
 <div class="hint">먼저 이걸 눌러 에디터에 <b>한 번만</b> 붙여넣어 보세요. 이미지까지 딸려 들어가면 끝입니다.<br>
 이미지가 안 들어오거나 깨지면 — 아래 블록별 버튼으로 하시면 됩니다.</div>
</div>

<div class="top">
 <label>제목</label>
 <div class="row"><input id="t" value="${esc(postTitle)}"><button class="copy" data-from="t">복사</button></div>
 <label>태그 (발행 패널에 입력)</label>
 <div class="row"><input id="g" value="${esc(tags)}"><button class="copy" data-from="g">복사</button></div>
 <label>카테고리</label>
 <div class="row"><input id="c" value="자연관찰 동화" readonly><button class="copy" data-from="c">복사</button></div>
</div>

${rows}

<script>
const flash = (b, msg) => { const o = b.textContent; b.textContent = msg; b.classList.add('ok');
  setTimeout(() => { b.textContent = o; b.classList.remove('ok'); }, 1200); };

document.querySelectorAll('[data-copy]').forEach(b =>
  b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => flash(b, '✓ 복사됨')));

document.querySelectorAll('[data-from]').forEach(b =>
  b.onclick = () => navigator.clipboard.writeText(document.getElementById(b.dataset.from).value)
    .then(() => flash(b, '✓')));

/* 🔴 전체 복사 = text/html 로 쓴다. 웹페이지에서 복사한 것과 같은 모양이라
   에디터가 <img> 의 원격 URL 을 스스로 받아 올릴 여지가 생긴다(안 되면 블록별 폴백).
   text/plain 을 함께 넣어야 리치 붙여넣기를 막는 곳에서도 글은 들어간다. */
const FULL_HTML = ${JSON.stringify(
    blocks
      .map((b) =>
        b.kind === 'image'
          ? `<p><img src="${b.url}" alt="${esc(b.caption || title)}"></p>` +
            (b.caption ? `<p>${esc(b.caption)}</p>` : '')
          : (b.heading ? `<h3>${esc(b.heading)}</h3>` : '') +
            b.text
              .split(/\n{2,}/)
              .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
              .join(''),
      )
      .join('\n'),
  )};
const FULL_TEXT = ${JSON.stringify(blocks.map((b) => (b.kind === 'image' ? `[사진 ${b.file}]` : b.raw)).join('\n\n'))};

document.getElementById('all').onclick = async (e) => {
  const b = e.currentTarget;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([FULL_HTML], { type: 'text/html' }),
      'text/plain': new Blob([FULL_TEXT], { type: 'text/plain' }),
    })]);
    flash(b, '✓ 복사됨 — 에디터에서 Ctrl+V');
  } catch (err) {
    await navigator.clipboard.writeText(FULL_TEXT);
    flash(b, '△ 글만 복사됨 (이미지는 아래 버튼으로)');
  }
};

// 🔴 클립보드는 png 만 받는다(webp 로 쓰면 조용히 실패). canvas 로 옮겨 굽는다.
document.querySelectorAll('[data-img]').forEach(b => b.onclick = async () => {
  const img = b.closest('.blk').querySelector('img');
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  cv.getContext('2d').drawImage(img, 0, 0);
  try {
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    flash(b, '✓ 복사됨 — 에디터에서 Ctrl+V');
  } catch (e) {
    flash(b, '✗ 실패 — 폴더에서 파일을 드래그하세요');
  }
});
</script>`;
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
  const blocks = []; // POST.html 용 — {kind:'text'|'image', ...}
  let imgNo = 0;
  for (const c of cards) {
    const text = toPlain(c.content?.text ?? '');
    if (text) {
      body.push(text);
      const heading = text.startsWith('## ') ? text.slice(3, text.indexOf('\n')) : '';
      blocks.push({ kind: 'text', heading, text: text.replace(/^## .*\n?/, '').trim(), raw: text });
    }
    const url = c.content?.url;
    if (url) {
      imgNo += 1;
      const file = `${String(imgNo).padStart(2, '0')}.webp`;
      const res = await fetch(encodeURI(decodeURI(url)));
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(path.join(outDir, file), buf);
        const cap = c.content.caption ?? '';
        body.push(`[사진 ${file}]${cap ? ` — 캡션: ${cap}` : ''}`);
        blocks.push({
          kind: 'image',
          file,
          caption: cap,
          url, // 🔴 전체 복사는 이 원격 URL 을 쓴다 — 에디터가 스스로 받아 올리게
          dataUri: `data:image/webp;base64,${buf.toString('base64')}`,
        });
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
  await fs.writeFile(path.join(outDir, 'POST.html'), buildHtml(title, blocks), 'utf-8');
  console.log(`✅ ${slug} — 섹션 ${cards.length} · 이미지 ${imgNo}장`);
  console.log(`   → ${path.join(outDir, 'POST.html')}`);
};

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

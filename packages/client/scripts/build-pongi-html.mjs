// 퐁이네 운하 마을 — 회차 HTML 생성기
// 본문은 docs/changjak-books/pongi/*.md 에서 파싱하고, SCENE 은 아래 SCENES 에서 가져온다.
// 🔴 SCENE 에 그림체 문구를 쓰지 않는다 — pongi-core.js 의 STYLE_PROMPT 가 붙인다.
import fs from 'fs';

const ROOT = 'C:/projects/tangobook/.claude/worktrees/wizardly-feynman-3ee1cb';
const SRC = `${ROOT}/docs/changjak-books/pongi`;
const OUT = `${ROOT}/packages/client/public`;

// ── 본문 파싱 ──
const books = new Map();
for (const f of ['01-03.md', '04-14.md', '15-25.md']) {
  const s = fs.readFileSync(`${SRC}/${f}`, 'utf8');
  for (const m of s.matchAll(/^## (\d+)\. (.+)$/gm)) {
    const start = m.index;
    const nx = s.indexOf('\n## ', start + 1);
    const body = s.slice(start, nx < 0 ? s.length : nx);
    const meta = (body.match(/^\*\*원함\*\* (.+)$/m) || [])[1] || '';
    const pages = [];
    for (const pm of body.matchAll(/\*\*p(\d+)\*\*\n([\s\S]*?)(?=\n\*\*p\d+\*\*|\n---|$)/g)) {
      pages.push({ n: +pm[1], ko: pm[2].trim().split('\n').map(l => l.trim()).filter(Boolean).join(' ') });
    }
    books.set(m[1], { id: m[1], title: m[2].trim(), meta, pages });
  }
}

// ── SCENE 데이터 ──
const SCENES = JSON.parse(fs.readFileSync(`${SRC}/_scenes.json`, 'utf8'));

const FN = ['판을 깐다', '판을 깐다', '판을 깐다', '어긋남', '어긋남', '어긋남', '어긋남', '뒤집힘', '반응', '착지'];
const TAG = ['일상', '일상', '일상', '어긋남', '어긋남', '어긋남', '어긋남', '뒤집힘', '반응', '착지'];

const HEAD = (t) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>퐁이네 운하 마을 — ${t}</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root { --coral:#ff7c5c; --coral-dark:#e85c3a; --peach:#ffe8d9; --cream:#fff8f0; --ink:#2b2320; --ink-soft:#6b5d55; --line:#f0e0d2; --water:#2C4A3C; --mint:#2C4A3C; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif; background:var(--cream); color:var(--ink); line-height:1.75; }
  .wrap { max-width:940px; margin:0 auto; padding:24px 24px 120px; }
  header.hero { text-align:center; padding:30px 0; border-bottom:3px solid var(--water); margin-bottom:22px; }
  .hero .kicker { color:var(--water); font-weight:800; letter-spacing:.14em; font-size:12px; }
  .hero h1 { font-size:28px; font-weight:900; margin:8px 0 6px; }
  .hero .sub { color:var(--ink-soft); font-size:13.5px; font-weight:600; }
  .note { background:#fff6f2; border:1px solid var(--coral); border-radius:12px; padding:12px 15px; font-size:13px; margin:14px 0 22px; }
  .page-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin:14px 0; }
  .page-head { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:9px; }
  .pnum { background:var(--water); color:#fff; font-weight:900; font-size:12px; border-radius:7px; padding:2px 9px; }
  .tag { background:var(--peach); border-radius:999px; padding:1px 10px; font-size:11.5px; font-weight:800; }
  .copy-btn { margin-left:auto; background:var(--coral); color:#fff; border:0; border-radius:9px; padding:5px 12px; font-size:12px; font-weight:800; cursor:pointer; }
  p.ko { font-size:16px; line-height:1.95; margin:8px 0 10px; }
  details { border-top:1px dashed var(--line); padding-top:9px; }
  summary { cursor:pointer; font-size:12.5px; font-weight:800; color:var(--ink-soft); }
  .page-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px 22px; margin:16px 0; }
  .copy-btn { background:#fff; color:var(--water); border:1.5px solid var(--water); border-radius:999px; padding:4px 14px; font-weight:800; font-size:12.5px; cursor:pointer; margin-left:auto; }
  .copy-btn:hover, .copy-btn.done { background:var(--water); color:#fff; }
  .batch-bar { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 18px; margin:16px 0; }
  .batch-bar .bhint { font-size:12.5px; color:var(--ink-soft); line-height:1.7; }
  .batch-bar .brow { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
  .batch-btn { background:var(--coral); color:#fff; border:0; border-radius:10px; padding:7px 15px; font-size:13px; font-weight:800; cursor:pointer; }
  .batch-btn:hover { background:var(--coral-dark); }
  .paste-box { position:relative; border:2px dashed var(--line); border-radius:10px; min-height:64px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:12px; color:var(--ink-soft); font-weight:700; cursor:pointer; outline:none; padding:8px; background:#fffdfa; margin-top:10px; }
  .paste-box:focus { border-color:var(--coral); color:var(--coral-dark); }
  .paste-box.has-img { padding:0; min-height:0; border-style:solid; border-color:var(--water); }
  .paste-box img { width:100%; border-radius:8px; display:block; }
  .paste-box.busy { opacity:.5; }
  .paste-del { position:absolute; top:6px; right:6px; border:0; border-radius:8px; background:#fff; padding:3px 9px; font-weight:800; cursor:pointer; }
  .ref-strip { display:flex; align-items:center; gap:9px; flex-wrap:wrap; background:#fff; border:1px solid var(--line); border-radius:14px; padding:11px 15px; margin:16px 0; }
  .ref-lab { font-size:12px; font-weight:800; color:var(--ink-soft); }
  .ref-chip { display:flex; align-items:center; gap:7px; background:var(--peach); border-radius:999px; padding:4px 12px 4px 5px; font-size:12px; font-weight:800; }
  .ref-chip img { width:30px; height:30px; border-radius:50%; object-fit:cover; }
  .ref-chip .ph { width:30px; height:30px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; }
  .ref-chip .im { color:var(--water); }
  pre.scene { white-space:pre-wrap; font-family:inherit; font-size:13px; line-height:1.8; background:#f7f4ef; border-radius:10px; padding:12px 14px; margin-top:9px; }
</style>
</head>
<body>
<div class="wrap">`;

let made = 0; const missing = [];
const index = [];
for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
  const sc = SCENES[id];
  if (!sc) { missing.push(id); continue; }
  const cards = bk.pages.map((p, i) => {
    const scene = sc[`p${p.n}`] || '';
    return `<div class="page-card" data-page="p${p.n}">
  <div class="page-head"><span class="pnum">P${p.n}</span><b>${FN[i] || ''}</b> <span class="tag">${TAG[i] || ''}</span> <button class="copy-btn">🎨 이미지 프롬프트 복사</button></div>
  <p class="ko">${p.ko}</p>
  <details><summary>SCENE 프롬프트 보기</summary><pre class="scene">${scene}</pre></details>
</div>`;
  }).join('\n\n');

  const html = `${HEAD(bk.title)}

<header class="hero">
  <div class="kicker">퐁이네 운하 마을 · ${id}</div>
  <h1>${bk.title}</h1>
  <div class="sub">${bk.meta}</div>
</header>

<div class="note">🖼️ 상단 <b>[전체 프롬프트 복사]</b> = 스타일(1회) + 캐릭터 레퍼런스(@image1~5 고정) + 전 페이지 장면을 한 번에. 쪽별 🎨 버튼은 그 쪽만. 생성한 컷은 각 박스에 붙여넣어 보관(R2).</div>

<!-- ===== pages ===== -->
${cards}

</div>
<script src="/pongi-core.js"></script>
</body>
</html>
`;
  fs.writeFileSync(`${OUT}/pongi-${id}.html`, html);
  index.push({ file: `pongi-${id}.html`, label: `${id} ${bk.title}`, title: bk.title });
  made++;
}
index.unshift({ file: 'pongi-plan.html', label: '📘 기획서' }); // ☰ 사이드바 첫 항목
// 🔴 들여쓰기 2 + 끝 개행 = prettier 기본값. 안 맞추면 커밋 훅이 되포맷하고 다음 빌드가 되돌려 무한 churn.
fs.writeFileSync(`${OUT}/pongi-index.json`, JSON.stringify(index, null, 2) + '\n');
console.log(`회차 HTML ${made}권 · index ${index.length}`);
if (missing.length) console.log('SCENE 없음: ' + missing.join(', '));

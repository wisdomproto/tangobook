// 메이네 산마을(창작동화 시리즈 02) — 기획서 + 회차 25권 HTML 생성기
// 본문 = docs/changjak-books/mei/*.md · SCENE = _scenes.json · 표 = _design.md · 앵커 = docs/art-direction/mei-anchor.md
// 🔴 SCENE 에 그림체 문구를 쓰지 않는다 — mei-core.js 의 앵커가 붙인다.
import fs from 'fs';

const ROOT = 'C:/projects/tangobook/.claude/worktrees/wizardly-feynman-3ee1cb';
const SRC = `${ROOT}/docs/changjak-books/mei`;
const OUT = `${ROOT}/packages/client/public`;

// ── 본문 파싱 (🔴 m 플래그 금지 — $ 가 줄마다 걸려 쪽이 첫 문장에서 잘린다) ──
const books = new Map();
for (const f of ['01-03.md', '04-14.md', '15-25.md']) {
  const s = fs.readFileSync(`${SRC}/${f}`, 'utf8');
  for (const m of s.matchAll(/^## (\d+)\. (.+)$/gm)) {
    const start = m.index;
    const nx = s.indexOf('\n## ', start + 1);
    const body = s.slice(start, nx < 0 ? s.length : nx);
    const meta = (body.match(/^\*\*주인공\*\* (.+)$/m) || [])[1] || '';
    const pages = [];
    for (const pm of body.matchAll(/\*\*p(\d+)\*\*\n([\s\S]*?)(?=\n\*\*p\d+\*\*|\n---|$)/g)) {
      pages.push({ n: +pm[1], ko: pm[2].trim().split('\n').map((l) => l.trim()).filter(Boolean).join(' ') });
    }
    books.set(m[1], { id: m[1], title: m[2].trim(), meta, pages });
  }
}

const SCENES = fs.existsSync(`${SRC}/_scenes.json`) ? JSON.parse(fs.readFileSync(`${SRC}/_scenes.json`, 'utf8')) : {};

// ── 앵커 넷 + 캐스트 시트 (mei-anchor.md 의 코드블록에서) ──
const ANCHOR_MD = fs.readFileSync(`${ROOT}/docs/art-direction/mei-anchor.md`, 'utf8');
const anchorBlocks = [...ANCHOR_MD.matchAll(/```\n(STYLE ANCHOR - mei-[\s\S]*?)\n```/g)].map((m) => m[1]);
const sheetBlock = (ANCHOR_MD.match(/```\n(CHARACTER SHEET[\s\S]*?)\n```/) || [])[1] || '';
const ANCHOR_META = [
  { k: 'A', name: '색연필 · 비탈 풀밭', slug: 'mei-pencilslope', vols: '01 · 07 · 09 · 12 · 13 · 15 · 24' },
  { k: 'B', name: '크레용 · 산장 안', slug: 'mei-crayonchalet', vols: '02 · 10 · 14 · 18 · 21 · 22 · 25' },
  { k: 'C', name: '과슈 · 산길·개울', slug: 'mei-gouachebrook', vols: '04 · 05 · 11 · 19 · 20' },
  { k: 'D', name: '숯 · 마을 광장', slug: 'mei-charcoalsquare', vols: '03 · 06 · 08 · 16 · 17 · 23' },
];

// ── _design.md 표 → HTML ──
const DESIGN = fs.readFileSync(`${SRC}/_design.md`, 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
/** n번째 마크다운 표를 HTML 로. */
function mdTable(md, n) {
  const rows = md.split('\n');
  let seen = -1, buf = null, out = [];
  for (const line of rows) {
    if (line.startsWith('|')) {
      if (!buf) { buf = []; seen++; }
      buf.push(line);
    } else if (buf) {
      if (seen === n) { out = buf; break; }
      buf = null;
    }
  }
  if (seen === n && !out.length) out = buf || [];
  if (!out.length) return '';
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(out[0]);
  const body = out.slice(2).map(cells);
  return `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
    body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
    `</tbody></table>`;
}

const CSS = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root { --accent:#D4622A; --accent-dark:#A8481C; --slope:#4E5840; --peach:#F3E7DA; --cream:#FBF8F3;
          --ink:#2b2320; --ink-soft:#6b5d55; --line:#E6DED2; --coral:#D4622A; --coral-dark:#A8481C; --mint:#4E5840; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif; background:var(--cream); color:var(--ink); line-height:1.75; }
  .wrap { max-width:940px; margin:0 auto; padding:24px 24px 120px; }
  header.hero { text-align:center; padding:30px 0; border-bottom:3px solid var(--slope); margin-bottom:22px; }
  .hero .kicker { color:var(--slope); font-weight:800; letter-spacing:.14em; font-size:12px; }
  .hero h1 { font-size:28px; font-weight:900; margin:8px 0 6px; word-break:keep-all; }
  .hero .sub { color:var(--ink-soft); font-size:13.5px; font-weight:600; word-break:keep-all; }
  .note { background:#FDF3EC; border:1px solid var(--accent); border-radius:12px; padding:12px 15px; font-size:13px; margin:14px 0 22px; word-break:keep-all; }
  h2.sec { font-size:20px; font-weight:900; margin:38px 0 6px; padding-top:18px; border-top:2px solid var(--line); word-break:keep-all; }
  h2.sec:first-of-type { border-top:0; }
  .lead { color:var(--ink-soft); font-size:13.5px; margin-bottom:14px; word-break:keep-all; }
  table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; margin:12px 0 18px; font-size:13px; }
  th, td { padding:8px 11px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; word-break:keep-all; }
  th { background:var(--peach); font-weight:800; font-size:12.5px; }
  tr:last-child td { border-bottom:0; }
  code { background:var(--peach); border-radius:5px; padding:1px 5px; font-size:12px; }
  pre.block { white-space:pre-wrap; font-family:inherit; font-size:12.5px; line-height:1.8; background:#fff; border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin:10px 0 18px; }
  .page-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px 22px; margin:16px 0; }
  .page-head { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:9px; }
  .pnum { background:var(--slope); color:#fff; font-weight:900; font-size:12px; border-radius:7px; padding:2px 9px; }
  .tag { background:var(--peach); border-radius:999px; padding:1px 10px; font-size:11.5px; font-weight:800; }
  .copy-btn { background:#fff; color:var(--slope); border:1.5px solid var(--slope); border-radius:999px; padding:4px 14px; font-weight:800; font-size:12.5px; cursor:pointer; margin-left:auto; }
  .copy-btn:hover, .copy-btn.done { background:var(--slope); color:#fff; }
  p.ko { font-size:16px; line-height:1.95; margin:8px 0 10px; word-break:keep-all; }
  details { border-top:1px dashed var(--line); padding-top:9px; }
  summary { cursor:pointer; font-size:12.5px; font-weight:800; color:var(--ink-soft); }
  pre.scene { white-space:pre-wrap; font-family:inherit; font-size:13px; line-height:1.8; background:#F7F4EF; border-radius:10px; padding:12px 14px; margin-top:9px; }
  .batch-bar { background:#fff; border:1.5px solid var(--slope); border-radius:14px; padding:14px 18px; margin:16px 0; }
  .batch-btn { background:var(--slope); color:#fff; border:0; border-radius:999px; padding:9px 20px; font-size:13px; font-weight:800; cursor:pointer; }
  .paste-box { position:relative; border:2px dashed var(--line); border-radius:10px; min-height:64px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:12px; color:var(--ink-soft); font-weight:700; cursor:pointer; outline:none; padding:8px; background:#FFFDFA; margin-top:10px; }
  .paste-box:focus { border-color:var(--accent); color:var(--accent-dark); }
  .paste-box.has-img { padding:0; min-height:0; border-style:solid; border-color:var(--slope); }
  .paste-box img { width:100%; border-radius:8px; display:block; }
  .paste-box.busy { opacity:.5; }
  .paste-del { position:absolute; top:6px; right:6px; border:0; border-radius:8px; background:#fff; padding:3px 9px; font-weight:800; cursor:pointer; }
  .ref-strip { display:flex; align-items:center; gap:9px; flex-wrap:wrap; background:#fff; border:1px solid var(--line); border-radius:14px; padding:11px 15px; margin:16px 0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; margin:12px 0 20px; }
  .cast-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
  .cast-card h4 { font-size:15px; font-weight:900; margin-bottom:2px; }
  .cast-card .flaw { display:inline-block; background:var(--peach); border-radius:999px; padding:1px 10px; font-size:11.5px; font-weight:800; margin-bottom:7px; }
  .cast-card p { font-size:12.5px; color:var(--ink-soft); line-height:1.65; word-break:keep-all; }
  .anchor-card { background:#fff; border:1.5px solid var(--slope); border-radius:16px; padding:16px 20px; margin:14px 0; }
  .anchor-card .ahead { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:4px; }
  .anchor-card .ahead b { font-size:16px; }
  .anchor-card .avols { font-size:12px; color:var(--ink-soft); margin-bottom:8px; }
  .anchor-card pre { white-space:pre-wrap; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:11.5px; line-height:1.65; background:#F7F4EF; border-radius:10px; padding:12px 14px; margin-top:8px; }
`;

const HEAD = (t, sub, docTitle) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${docTitle || `메이네 산마을 — ${t}`}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="hero">
  <div class="kicker">${sub}</div>
  <h1>${t}</h1>`;

// ═══════════ 회차 25권 ═══════════
const FN = ['판을 깐다', '원함', '결점대로', '결점대로', '결점대로', '탈', '탈', '할머니 한 마디', '다시', '착지'];
const TAG = ['일상', '원함', '어긋남', '어긋남', '어긋남', '탈', '탈', '어른', '고침', '착지'];

let made = 0; const missingScene = [];
const index = [];
for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
  const sc = SCENES[id] || {};
  if (!SCENES[id]) missingScene.push(id);
  const cards = bk.pages.map((p, i) => `<div class="page-card" data-page="p${p.n}">
  <div class="page-head"><span class="pnum">P${p.n}</span><b>${FN[i] || ''}</b> <span class="tag">${TAG[i] || ''}</span> <button class="copy-btn">🎨 이미지 프롬프트 복사</button></div>
  <p class="ko">${esc(p.ko)}</p>
  <details><summary>SCENE 프롬프트 보기</summary><pre class="scene">${sc[`p${p.n}`] || '(SCENE 미작성)'}</pre></details>
</div>`).join('\n\n');

  fs.writeFileSync(`${OUT}/mei-${id}.html`, `${HEAD(bk.title, `메이네 산마을 · ${id}`)}
  <div class="sub">${inline(bk.meta)}</div>
</header>

<div class="note">🖼️ 상단 <b>[전체 프롬프트 복사]</b> = 이 권의 앵커(1회) + 캐릭터 레퍼런스(@image1~6) + 전 페이지 장면을 한 번에. 쪽별 🎨 버튼은 그 쪽만. 생성한 그림은 각 박스에 붙여넣어 보관(R2).</div>

${cards}

</div>
<script src="/mei-core.js"></script>
</body>
</html>
`);
  index.push({ file: `mei-${id}.html`, label: `${id} ${bk.title}`, title: bk.title });
  made++;
}
index.unshift({ file: 'mei-plan.html', label: '📘 기획서' });
fs.writeFileSync(`${OUT}/mei-index.json`, JSON.stringify(index, null, 1));

// ═══════════ 기획서 ═══════════
const CAST = [
  ['mei', '메이', '아기 염소 · 겁이 많다', '흰 몸, 짧은 뿔 두 개, 늘어진 귀. 다섯 중 제일 작다. 🔴 주황 목도리.', '05 · 10 · 15 · 20 · 25'],
  ['rudi', '루디', '다람쥐 · 못 참는다', '등 뒤로 말려 올라간 큼직한 꼬리. 앞치마. 🔴 주머니가 주황.', '02 · 07 · 12 · 17 · 22'],
  ['ppino', '삐노', '토끼 · 성급하다', '곧게 선 긴 귀 두 개. 아이들 중 제일 크다. 🔴 주황 장화.', '01 · 06 · 11 · 16 · 21'],
  ['soso', '소소', '고슴도치 · 수줍다', '짧은 가시가 덮인 낮고 둥근 등. 손을 모으고 있다. 🔴 주황 리본.', '03 · 08 · 13 · 18 · 23'],
  ['leo', '레오', '여우 · 잘난 척한다', '뾰족한 주둥이, 길게 뻗은 꼬리. 턱을 든 자세. 🔴 주황 목깃.', '04 · 09 · 14 · 19 · 24'],
  ['granny', '곰 할머니', '유일한 어른', '아이 키의 두 배, 전체가 둥글다. 산장 주인. 🔴 주황을 하나도 안 지닌다.', '매 권 ④비트'],
];

const planHtml = `${HEAD('메이네 산마을', '창작동화 시리즈 02 · 25권 250쪽', '메이네 산마을 — 기획서')}
  <div class="sub">아기 염소 메이와 또래 넷 · 알프스 산마을 · <b>대발이형</b>(결점 → 탈 → 어른 한 마디 → 고침) · 앵커 4종(색연필·크레용·과슈·숯)</div>
</header>

<div class="note">🔴 <b>이 기획서가 SSOT 가 아닙니다.</b> 본문은 <code>docs/changjak-books/mei/*.md</code>, 앵커는 <code>docs/art-direction/mei-anchor.md</code> 가 원본이고 이 페이지는 거기서 생성됩니다(<code>build-mei-html.mjs</code>). 회차는 왼쪽 <b>☰ 회차</b>에서.</div>

<h2 class="sec">1. 왜 이 시리즈인가</h2>
<p class="lead">시리즈 01(퐁이네 운하 마을)과 <b>모든 축이 반대</b>입니다. 같은 형을 두 번 만들면 25권이 아니라 50권이 같은 책이 됩니다.</p>
${mdTable(DESIGN, 0)}
<p class="lead">🔴 <b>또래가 없으면 대발이형이 안 돕니다.</b> 결점이 사건을 만드는 구조인데 01 은 어른 셋뿐이라 결점을 아이에게 줄 수 없었습니다. 호리 45편이 무수정 통과한 엔진이 바로 <b>「캐릭터 = 결점 하나」 배역제</b>이고, 그걸 여기로 이식했습니다.</p>

<h2 class="sec">2. 캐스트 여섯</h2>
<p class="lead">다섯이 <b>5권 주기로 정확히 돌아갑니다</b> — 한 아이가 몰리면 그 결점만 다섯 번 읽힙니다.
시트를 만들어 아래 칸에 붙여넣으면 회차 페이지의 「🎬 이 화 등장」 스트립이 그 그림을 읽어 옵니다.</p>
<div class="grid">
${CAST.map(([k, n, flaw, desc, vols]) => `  <div class="cast-card">
    <h4>${n}</h4>
    <span class="flaw">${flaw}</span>
    <p>${inline(desc)}</p>
    <p style="margin-top:6px"><b>주인공 회차</b> ${vols}</p>
    <div data-paste="${k}"></div>
  </div>`).join('\n')}
</div>

<h2 class="sec">3. 뼈대 — 10쪽 고정</h2>
<pre class="block">p1~p2   결점이 드러나는 작은 일 + 원함    (🔴 p1 은 대사로 열지 않는다)
p3~p5   결점이 시키는 대로 해서 일이 커진다
p6~p7   탈이 난다 — 결점 때문에 원하던 것을 잃는다
p8      곰 할머니가 한 마디                (🔴 아이가 하던 그 일 안에서)
p9~p10  고쳐서 다시 한다 — 원하던 것을 얻는다</pre>
<p class="lead">🔴 <b>원함과 착지가 같은 것을 가리킵니다.</b> 삐노는 「제일 멀리 가고 싶다」로 열고 「제일 멀리 갔다」로 닫습니다.
결점이 그것을 뺏고, 고치면 그것이 돌아옵니다 — 그래야 교훈이 설교가 아니라 사건이 됩니다.
🔴 <b>한 권 = 규칙 하나</b>. 차례 편에 나눔을 얹지 않습니다.</p>

<h2 class="sec">4. 25권</h2>
<p class="lead">🔴 <b>작가에게 빈칸을 주지 않는 것</b>이 이 체제의 전부입니다. 원함·탈·착지 세 칸이 다 차 있어야 집필로 넘어갑니다.</p>
${mdTable(DESIGN, 2)}

<h2 class="sec">5. 앵커 넷 — 손자국</h2>
<p class="lead">라인 정체성이 <b>권마다 다른 그림체</b>라 시리즈에 그림체를 묶지 않습니다. 25권에 앵커 넷, 무대 성격으로 묶습니다.
01 이 인쇄 공정(판·잉크·겹침)이었으니 02 는 <b>손자국</b>입니다 — 연필 결, 크레용이 종이 결에 걸려 끊긴 자리, 붓 자국, 문지른 숯과 지우개로 뺀 흰 자리.</p>
<pre class="block">종이       WARM GREY #EDE9E1 — 칠하지 않은 자리는 전부 이 색이고 이것이 빛이다
색 1·2     묶음마다 다르다. 두 색뿐이다
악센트     ORANGE #D4622A — 다섯 아이가 저마다 하나씩 지닌 물건에만
결(TEETH)  종이 결이 모든 색을 뚫고 보인다. 꽉 찬 색면이 하나도 없다</pre>
<p class="lead">🔴 <b>주황은 인물이 아니라 무리를 가리킵니다.</b> 01 은 주인공 하나에 붉은 목끈이었지만 02 는 주인공이 권마다 바뀝니다.
누가 주인공이든 화면에 주황이 있고, 다섯이 모이면 한 무리로 읽힙니다.</p>
<p class="lead">⚠️ 아래는 <b>캐스트 시트·단독 렌더용 영문 전문</b>입니다. 회차 10장 배치는 회차 페이지의 [전체 프롬프트 복사]가 같은 앵커의 한국어 압축본을 붙입니다 — <b>고칠 땐 <code>mei-anchor.md</code> 와 <code>mei-core.js</code> 양쪽을</b>.</p>
${ANCHOR_META.map((a, i) => `<div class="anchor-card">
  <div class="ahead"><b>앵커 ${a.k} · ${a.name}</b><code>${a.slug}</code><button class="copy-btn" data-copy="anchor${i}">📋 앵커 프롬프트 복사</button></div>
  <div class="avols">${a.vols}</div>
  <details><summary>프롬프트 보기</summary><pre id="anchor${i}">${esc(anchorBlocks[i] || '(앵커 블록 없음)')}</pre></details>
  <div data-paste="anchor-${a.k}"></div>
</div>`).join('\n')}

<h2 class="sec">6. 캐스트 시트 프롬프트</h2>
<p class="lead">한 장에 여섯을 다 그립니다. 🔴 <b>시트가 최종 그림을 지배</b>하므로 시트를 먼저 확정하고 쪽 삽화로 갑니다.
매체는 <b>앵커 A(색연필)</b> — 25권 중 7권이 A 이고, 나머지 세 매체는 이 시트의 형태를 각자 재료로 옮깁니다.</p>
<div class="anchor-card">
  <div class="ahead"><b>여섯 캐릭터 시트</b><button class="copy-btn" data-copy="sheet">📋 시트 프롬프트 복사</button></div>
  <details open><summary>프롬프트 보기</summary><pre id="sheet">${esc((sheetBlock || '').replace('[여기에 §2 앵커 A 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]', anchorBlocks[0] || ''))}</pre></details>
  <div data-paste="cast-sheet"></div>
</div>

</div>
<script src="/mei-core.js"></script>
<script>
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy'));
      if (el) window.MEI.copyText(el.textContent, b);
    });
  });
  window.MEI.mountPasteSlots('mei-plan');
</script>
</body>
</html>
`;
fs.writeFileSync(`${OUT}/mei-plan.html`, planHtml);

console.log(`회차 HTML ${made}권 · index ${index.length} · 기획서 1`);
console.log(`앵커 블록 ${anchorBlocks.length}/4 · 시트 ${sheetBlock ? '✓' : '✗'} · 25권 표 ${/<tbody>/.test(mdTable(DESIGN, 2)) ? '✓' : '✗'}`);
if (missingScene.length) console.log('⚠️ SCENE 없음: ' + missingScene.join(', '));

// ── 가드: 규칙을 문서에 적어 두지 말고 여기서 검사한다 ──
// mei-core.js 를 **파싱해서** 쓴다. 사본을 두면 갈라지고, 갈라져도 아무 데서도 안 터진다.
const CORE = fs.readFileSync(`${OUT}/mei-core.js`, 'utf8');
const cast = [...CORE.matchAll(/key: '(\w+)', name: '([^']+)', aliases: \[([^\]]+)\]/g)]
  .map((m) => ({ key: m[1], name: m[2], aliases: m[3].split(',').map((x) => x.trim().replace(/'/g, '')) }));
const coreVols = Object.fromEntries(
  [...CORE.matchAll(/([A-D]): \{ name: '[^']*', slug: '[^']*', vols: \[([^\]]*)\]/g)]
    .map((m) => [m[1], m[2].replace(/'/g, '').split(',')]));

// ① 앵커 배분: 설계서 표 ↔ core 가 일치하는가 (한쪽만 고치면 조용히 어긋난다)
let volMismatch = 0;
for (const m of DESIGN.matchAll(/^\| (\d\d) \| .+ \| ([A-D]) \|$/gm)) {
  if (!(coreVols[m[2]] || []).includes(m[1])) { console.log(`⚠️ 앵커 불일치 ${m[1]}권 — 설계표=${m[2]}`); volMismatch++; }
}
const volTotal = Object.values(coreVols).reduce((a, v) => a + v.length, 0);

// ② 별칭 부분문자열 충돌 (전래동화에서 Nolbu ⊂ NolbuWife 로 데인 적 있다)
for (const c of cast) for (const d of cast) if (c !== d)
  for (const x of c.aliases) for (const y of d.aliases)
    if (y.toLowerCase().includes(x.toLowerCase())) console.log(`⚠️ 별칭 충돌 ${c.name}「${x}」⊂ ${d.name}「${y}」`);

// ③ [등장]이 비는 쪽 — SCENE 이 우리말 대명사만 쓰면 캐릭터가 한 명도 안 잡혀 "(배경/사물 컷)" 으로 나간다
const empty = [];
for (const [v, pages] of Object.entries(SCENES)) for (const [p, t] of Object.entries(pages))
  if (!cast.some((c) => c.aliases.some((a) => t.toLowerCase().includes(a.toLowerCase())))) empty.push(`${v} ${p}`);

console.log(`가드 — 앵커 배분 ${volTotal}권/불일치 ${volMismatch} · 캐스트 ${cast.length}명 · [등장] 빈 쪽 ${empty.length}${empty.length ? ': ' + empty.join(' ') : ''}`);

// 창작동화 시리즈 저작도구 — 공용 빌더 (04~10 여덟 시리즈)
//
// 🔴 여덟 번 포크하지 않고 한 번 생성한다. 시리즈 01~03 을 포크하며 같은 버그를 세 번 옮겼다
//    (본문 파싱 `m` 플래그 · join('\n') 이스케이프 · index 들여쓰기 · 정의 안 된 CSS 변수).
//    템플릿을 고치면 여덟이 같이 고쳐진다.
//
//   node packages/client/scripts/build-series-html.mjs            # 전 시리즈
//   node packages/client/scripts/build-series-html.mjs dodo bruno # 일부만
//
// 읽는 것: docs/changjak-books/{key}/{_design.md,01-03.md,04-14.md,15-25.md,_scenes.json}
//          docs/art-direction/{key}-anchor.md   ← 앵커 영문 전문을 통째로 주입(사본 없음)
//          scripts/_series-config.mjs           ← 캐스트 토큰·팔레트·필명·쪽 라벨
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERIES, labelsFor } from './_series-config.mjs';
import { parseBooks, loadScenes } from './_series-parse.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.resolve(HERE, '../public');
const TEMPLATE = fs.readFileSync(path.join(HERE, '_series-core.template.js'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');

/** n번째 마크다운 표를 HTML 로. */
function mdTable(md, n) {
  const lines = md.split('\n');
  let seen = -1, buf = null, out = null;
  for (const line of lines) {
    if (line.startsWith('|')) { if (!buf) { buf = []; seen++; } buf.push(line); }
    else if (buf) { if (seen === n) { out = buf; break; } buf = null; }
  }
  if (out === null && seen === n) out = buf;
  if (!out || !out.length) return '';
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(out[0]);
  return `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
    out.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
    '</tbody></table>';
}

const CSS = (p) => `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root { --accent:${p.accent}; --slope:${p.overlap}; --peach:#F3E7DA; --cream:#FBF8F3;
          --ink:#2b2320; --ink-soft:#6b5d55; --line:#E6DED2; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif; background:var(--cream); color:var(--ink); line-height:1.75; }
  .wrap { max-width:940px; margin:0 auto; padding:24px 24px 120px; }
  header.hero { text-align:center; padding:30px 0; border-bottom:3px solid var(--slope); margin-bottom:22px; }
  .hero .kicker { color:var(--slope); font-weight:800; letter-spacing:.14em; font-size:12px; }
  .hero h1 { font-size:28px; font-weight:900; margin:8px 0 6px; word-break:keep-all; }
  .hero .sub { color:var(--ink-soft); font-size:13.5px; font-weight:600; word-break:keep-all; }
  .hero .by { margin-top:9px; font-size:12.5px; color:var(--ink-soft); }
  .hero .by b { color:var(--ink); }
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
  .paste-box { position:relative; border:2px dashed var(--line); border-radius:10px; min-height:64px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:12px; color:var(--ink-soft); font-weight:700; cursor:pointer; outline:none; padding:8px; background:#FFFDFA; margin-top:10px; }
  .paste-box:focus { border-color:var(--accent); }
  .paste-box.has-img { padding:0; min-height:0; border-style:solid; border-color:var(--slope); }
  .paste-box img { width:100%; border-radius:8px; display:block; }
  .paste-box.busy { opacity:.5; }
  .paste-del { position:absolute; top:6px; right:6px; border:0; border-radius:8px; background:#fff; padding:3px 9px; font-weight:800; cursor:pointer; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; margin:12px 0 20px; }
  .cast-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
  .cast-card .chead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
  .cast-card h4 { font-size:15px; font-weight:900; }
  .cast-card .copy-btn { margin-left:auto; padding:3px 11px; font-size:11.5px; }
  .cast-card p { font-size:12.5px; color:var(--ink-soft); line-height:1.65; word-break:keep-all; }
  .anchor-card { background:#fff; border:1.5px solid var(--slope); border-radius:16px; padding:16px 20px; margin:14px 0; }
  .anchor-card .ahead { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .anchor-card .ahead b { font-size:16px; }
  .anchor-card pre { white-space:pre-wrap; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:11.5px; line-height:1.65; background:#F7F4EF; border-radius:10px; padding:12px 14px; margin-top:8px; }
  .swatches { display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 18px; }
  .sw { display:flex; align-items:center; gap:7px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:4px 12px 4px 5px; font-size:12px; font-weight:700; }
  .sw i { width:22px; height:22px; border-radius:50%; border:1px solid rgba(0,0,0,.12); display:block; }
`;

const HEAD = (title, css, docTitle) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${docTitle || title}</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">`;

function buildSeries(key) {
  const cfg = SERIES[key];
  const SRC = path.join(ROOT, 'docs/changjak-books', key);
  const lab = labelsFor(key);

  const books = parseBooks(SRC);
  const SCENES = loadScenes(SRC);
  const DESIGN = fs.readFileSync(path.join(SRC, '_design.md'), 'utf8');

  // ── 앵커: 영문 전문을 통째로 (사본을 안 만드는 것이 핵심) ──
  const AMD = fs.readFileSync(path.join(ROOT, 'docs/art-direction', `${key}-anchor.md`), 'utf8');

  // ── 캐스트 규격: 한 사람씩 무엇이 다른가 ──
  // 🔴 이게 없으면 시트 프롬프트가 **이름만 다르고 지시가 같다** — 「타로」와 「타로 엄마」에게
  //    똑같은 문장을 주고 다르게 나오길 바란 셈이고, 실제로 「가족들이 너무 비슷하게 생겼다」가
  //    나왔다(2026-08-17 사용자). 앵커의 CHARACTER DESIGN LANGUAGE 는 **그 세계 전체**를 말하지
  //    한 사람을 말하지 않는다. 개체를 가르는 것은 여기 있어야 한다.
  const castMd = path.join(ROOT, 'docs/art-direction', `${key}-cast.md`);
  const CAST_SPEC = new Map();
  if (fs.existsSync(castMd)) {
    // 🔴 `\Z` 는 JS 정규식에 없다(리터럴 Z 가 된다) — 그러면 **마지막 인물이 통째로 빠지고**
    //    빈 spec 이라 시트가 앵커만 받는다. 문자열 끝은 `$(?![\s\S])`.
    for (const m of fs.readFileSync(castMd, 'utf8').matchAll(/^## +(.+?)\s*$([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
      // 감싼 코드펜스는 벗긴다 — 프롬프트에 ``` 이 그대로 실려 나가지 않게(작성자마다 스타일이 갈렸다).
      // 🔴 「절 전체가 펜스일 때만」 벗기면 **마지막 인물이 샌다** — 그 절은 뒤따르는 `### 이 문서를
      //    고칠 때` 까지 통째로 삼키므로 펜스가 절 끝이 아니게 되고, 프롬프트에 ``` 과 한국어 편집
      //    메모가 실려 나갔다(붕이 할아버지가 그 상태로 나갔다). 첫 펜스 블록만 집는다.
      const sec = m[2].trim();
      const fenced = sec.match(/```[a-z]*\n([\s\S]*?)\n```/);
      CAST_SPEC.set(m[1].trim(), (fenced ? fenced[1] : sec).trim());
    }
  }

  const anchorText = (AMD.match(/```\n(STYLE ANCHOR - [\s\S]*?)\n```/) || [])[1];
  const sheetText = (AMD.match(/```\n(CHARACTER SHEET[\s\S]*?)\n```/) || [])[1] || '';
  if (!anchorText) throw new Error(`${key}: 앵커 블록을 못 찾았다`);
  const slug = anchorText.match(/STYLE ANCHOR - ([a-z0-9-]+)/)[1];
  const anchorName = (AMD.match(/^\| \*\*A?\*?\*?[^|]*\|[^|]*\|/m) ? '' : '') ||
    `${cfg.no} · ${slug}`;

  // ── core.js 생성 ──
  const core = TEMPLATE
    .replace(/__KEY__/g, key)
    .replace(/__TITLE__/g, cfg.title)
    .replace(/__ANCHOR_SLUG__/g, slug)
    .replace(/__ANCHOR_NAME__/g, `앵커 ${slug}`)
    .replace('__ANCHOR_TEXT__', JSON.stringify(anchorText))
    .replace('__CAST__', JSON.stringify(cfg.cast.map(({ key: k, name, aliases }) => ({
      key: k, name, aliases,
      // 🔴 별칭 **전부**로 찾는다 — `aliases[1]` 만 보면 영문 토큰이 1번이 아닌 인물의 규격이
      //    조용히 안 붙는다. 하필 그런 인물 7명이 전부 **어른**(할아버지·아저씨·선생님)이라,
      //    「가족이 다 비슷하다」를 고치려고 만든 파일이 정작 그 어른들만 못 받았다.
      spec: [aliases[1], name, ...aliases].map((a) => CAST_SPEC.get(a)).find(Boolean) ?? '',
    })), null, 2))
    .replace('__FACE__', JSON.stringify(Object.fromEntries(cfg.cast.map((c) => [c.key, c.face]))));
  fs.writeFileSync(path.join(OUT, `${key}-core.js`), core);

  // ── 회차 25권 ──
  const css = CSS(cfg.palette);
  const byline = `글 <b>${cfg.pen.author}</b> · 그림 <b>${cfg.pen.illustrator}</b>`;
  const index = [{ file: `${key}-plan.html`, label: '📘 기획서' }];
  let made = 0; const missing = [];
  for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sc = SCENES[id] || {};
    if (!SCENES[id]) missing.push(id);
    const cards = bk.pages.map((p, i) => `<div class="page-card" data-page="p${p.n}">
  <div class="page-head"><span class="pnum">P${p.n}</span><b>${lab.fn[i] || ''}</b> <span class="tag">${lab.tag[i] || ''}</span> <button class="copy-btn">🎨 이미지 프롬프트 복사</button></div>
  <p class="ko">${esc(p.ko)}</p>
  <details><summary>SCENE 프롬프트 보기</summary><pre class="scene">${sc[`p${p.n}`] || '(SCENE 미작성)'}</pre></details>
</div>`).join('\n\n');

    fs.writeFileSync(path.join(OUT, `${key}-${id}.html`), `${HEAD(`${cfg.title} — ${bk.title}`, css)}
<header class="hero">
  <div class="kicker">${cfg.title} · ${id}</div>
  <h1>${bk.title}</h1>
  <div class="sub">${inline(bk.meta)}</div>
  <div class="by">${byline}</div>
</header>

<div class="note">🖼️ 상단 <b>[전체 프롬프트 복사]</b> = 앵커(1회) + 캐릭터 레퍼런스 + 전 페이지 장면을 한 번에. 쪽별 🎨 버튼은 그 쪽만. 생성한 그림은 각 박스에 붙여넣어 보관(R2).</div>

${cards}

</div>
<script src="/${key}-core.js"></script>
</body>
</html>
`);
    index.push({ file: `${key}-${id}.html`, label: `${id} ${bk.title}`, title: bk.title });
    made++;
  }
  // 🔴 들여쓰기 2 + 끝 개행 = prettier 기본값. 안 맞추면 커밋 훅이 되포맷하고 다음 빌드가 되돌린다.
  fs.writeFileSync(path.join(OUT, `${key}-index.json`), JSON.stringify(index, null, 2) + '\n');

  // ── 기획서 ──
  // 🔴 값이 hex 가 아닐 수 있다 — 아시아 매체 셋은 「겹침 색」이 아예 없다(전지는 한 장이라 겹칠 데가
  //    없고, 수묵은 먹 하나가 다섯 값이다). 없는 것을 있는 척 hex 로 채우지 말고 그대로 적는다.
  const sw = (label, v) => /^#[0-9A-Fa-f]{3,8}$/.test(v)
    ? `<span class="sw"><i style="background:${v}"></i>${label} <code>${v}</code></span>`
    : `<span class="sw">${label} ${esc(v)}</span>`;
  const plan = `${HEAD(cfg.title, css, `${cfg.title} — 기획서`)}
<header class="hero">
  <div class="kicker">창작동화 시리즈 ${cfg.no} · 25권 250쪽</div>
  <h1>${cfg.title}</h1>
  <div class="sub">${cfg.sub}</div>
  <div class="by">${byline}</div>
</header>

<div class="note">🔴 <b>이 기획서가 SSOT 가 아닙니다.</b> 본문은 <code>docs/changjak-books/${key}/*.md</code>, 앵커는 <code>docs/art-direction/${key}-anchor.md</code> 가 원본이고 이 페이지는 거기서 생성됩니다(<code>build-series-html.mjs</code>). 회차는 왼쪽 <b>☰ 회차</b>에서.</div>

<h2 class="sec">1. 축</h2>
${mdTable(DESIGN, 0)}

<h2 class="sec">2. 캐스트</h2>
<p class="lead">시트를 만들어 카드에 붙여넣으면 회차 페이지의 「🎬 이 화 등장」 스트립이 그 그림을 읽어 옵니다.
카드마다 <b>[📋 시트 프롬프트]</b> = 그 한 명만 그리는 프롬프트(앵커 + 규격 + 전신 정면·3/4·뒷모습).</p>
<div class="grid">
${cfg.cast.map((c) => `  <div class="cast-card">
    <div class="chead"><h4>${c.face} ${c.name}</h4><button class="copy-btn" data-sheet="${c.key}">📋 시트 프롬프트</button></div>
    <p><code>${c.aliases[1] || c.name}</code></p>
    <div data-paste="${c.key}"></div>
  </div>`).join('\n')}
</div>

<h2 class="sec">3. 25권</h2>
<p class="lead">🔴 <b>작가에게 빈칸을 주지 않는 것</b>이 이 체제의 전부입니다.</p>
${mdTable(DESIGN, 2) || mdTable(DESIGN, 1)}

<h2 class="sec">4. 앵커 — 한 시리즈 = 한 그림체</h2>
<p class="lead">시리즈 전권이 한 그림체입니다. 무대·계절 차이는 앵커 안 <b>무대 조항</b>이 처리합니다 — 매체·색은 그대로 두고 「두 색을 어디에 쓰고 무엇을 종이로 남기나」만 바뀝니다.
🔴 악센트 <b>${cfg.accentWhere}</b> 에만 닿습니다.</p>
<div class="swatches">
  ${sw('종이', cfg.palette.paper)}${sw('색1', cfg.palette.ink1)}${sw('색2', cfg.palette.ink2)}${sw('겹침', cfg.palette.overlap)}${sw('악센트', cfg.palette.accent)}
</div>
<div class="anchor-card">
  <div class="ahead"><b>${slug}</b><button class="copy-btn" data-copy="anchor">📋 앵커 프롬프트 복사</button></div>
  <details><summary>프롬프트 보기</summary><pre id="anchor">${esc(anchorText)}</pre></details>
  <div data-paste="anchor"></div>
</div>

<h2 class="sec">5. 캐스트 시트</h2>
<p class="lead">한 장에 전원을 그립니다. 🔴 <b>시트가 최종 그림을 지배</b>하므로 시트를 먼저 확정하고 쪽 삽화로 갑니다.</p>
<div class="anchor-card">
  <div class="ahead"><b>전원 시트</b><button class="copy-btn" data-copy="sheet">📋 시트 프롬프트 복사</button></div>
  <details open><summary>프롬프트 보기</summary><pre id="sheet">${esc(sheetText.replace(/\[여기에[^\]]*\]/, anchorText))}</pre></details>
  <div data-paste="cast-sheet"></div>
</div>

</div>
<script src="/${key}-core.js"></script>
<script>
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy'));
      if (el) window.SERIES.copyText(el.textContent, b);
    });
  });
  document.querySelectorAll('[data-sheet]').forEach(function (b) {
    b.addEventListener('click', function () {
      window.SERIES.copyText(window.SERIES.sheetPrompt(b.getAttribute('data-sheet')), b);
    });
  });
  window.SERIES.mountPasteSlots('${key}-plan');
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, `${key}-plan.html`), plan);

  // ── 가드 ──
  const warn = [];
  // ① 별칭 부분문자열 충돌
  for (const a of cfg.cast) for (const b of cfg.cast) if (a !== b)
    for (const x of a.aliases) for (const y of b.aliases)
      if (y.toLowerCase().includes(x.toLowerCase())) warn.push(`별칭 충돌 ${a.name}「${x}」⊂ ${b.name}「${y}」`);
  // ② [등장]이 비는 쪽
  // 🔴 여기는 **「인물이 하나라도 잡히나」 불리언**이라 단순 부분문자열로 충분하다. 누가 나오는지를
  //    정하는 진짜 감지는 `_series-core.template.js` 의 `detectChars`(긴 별칭 우선 + 매칭 자리 제거)다.
  //    두 판정은 여기서 갈리지 않는다 — naive 가 찾은 것들 중 **가장 긴 별칭은 엄격 판정에서도 살아남으므로**
  //    「하나도 없다」의 답이 같다. 🔴 감지를 고칠 일이 생기면 template 쪽을 고쳐라(여기는 개수만 센다).
  const empty = [];
  for (const [v, pp] of Object.entries(SCENES)) for (const [p, t] of Object.entries(pp))
    if (!cfg.cast.some((c) => c.aliases.some((al) => t.toLowerCase().includes(al.toLowerCase())))) empty.push(`${v} ${p}`);
  // ③ 쪽수
  const badPages = [...books.values()].filter((b) => b.pages.length !== 10).map((b) => `${b.id}:${b.pages.length}`);
  // ④ 🔴 캐스트 규격이 조용히 안 붙는 것 — 시트가 이름만 다르고 지시가 같아지는 그 병이다.
  //    `\Z` 오타로 마지막 인물이 통째로 빠졌던 적이 있다(2026-08-17). 제목 오타·미작성 둘 다 여기서 걸린다.
  if (CAST_SPEC.size) {
    const got = new Set();
    for (const c of cfg.cast) {
      // 🔴 위 주입과 **같은 순서**로 찾는다 — 한쪽만 고치면 붙었는데 경고가 나거나 그 반대가 된다
      const hit = [c.aliases[1], c.name, ...c.aliases].find((a) => CAST_SPEC.has(a)) ?? null;
      if (hit) got.add(hit); else warn.push(`캐스트 규격 없음 ${c.name}(${c.aliases[1]})`);
    }
    // 제목이 글자로 시작하는 것만 인물로 본다 — 🔴·이모지로 여는 해설 섹션은 프롬프트에 안 실릴 뿐 결함이 아니다
    for (const h of CAST_SPEC.keys())
      if (!got.has(h) && /^\p{L}/u.test(h)) warn.push(`캐스트 규격 「${h}」 가 아무에게도 안 붙었다`);
  }

  return { key, made, books: books.size, scenes: Object.keys(SCENES).length, missing, warn, empty, badPages };
}

const keys = process.argv.slice(2).filter((k) => SERIES[k]);
const targets = keys.length ? keys : Object.keys(SERIES);
let totalBooks = 0, totalCuts = 0;
for (const k of targets) {
  const r = buildSeries(k);
  totalBooks += r.made;
  totalCuts += r.scenes * 10;
  const bits = [`${r.made}권`, `SCENE ${r.scenes}권`];
  if (r.missing.length) bits.push(`⚠️ SCENE 없음 ${r.missing.join(',')}`);
  if (r.badPages.length) bits.push(`⚠️ 10쪽 아님 ${r.badPages.join(',')}`);
  if (r.warn.length) bits.push(`⚠️ ${r.warn.join(' / ')}`);
  if (r.empty.length) bits.push(`[등장] 빈 쪽 ${r.empty.length}`);
  console.log(`${k.padEnd(6)} ${bits.join(' · ')}`);
}
console.log(`\n합계 ${targets.length}시리즈 · ${totalBooks}권 · SCENE ${totalCuts}컷`);

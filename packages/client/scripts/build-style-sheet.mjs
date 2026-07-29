/**
 * 창작동화 앵커 후보 시트 생성기
 *
 * docs/art-direction/award-styles-20y.json → public/changjak-styles.html
 *
 * 후보는 계속 append 된다(69 → 100~150 목표). 그래서 일회성 HTML 이 아니라 다시 굽는 스크립트다.
 *   node packages/client/scripts/build-style-sheet.mjs
 *
 * 데이터는 HTML 안에 인라인한다 — docs/ 는 정적 서빙 대상이 아니고, 파일로 열어도 보여야 한다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../docs/art-direction/award-styles-20y.json');
const OUT = resolve(here, '../public/changjak-styles.html');

const items = JSON.parse(readFileSync(SRC, 'utf8'));
const missing = items.filter((e) => !e.imageUrl || !e.id);
if (missing.length) throw new Error(`imageUrl/id 없는 항목 ${missing.length}건 — JSON 을 먼저 고칠 것`);

const GROUPS = {
  A: '마음·감정', B: '상상·변신', C: '자연·계절·동물', D: '모험·여정',
  E: '웃음·말놀이', F: '집·가족', G: '용기·두려움', H: '호기심·만들기',
};
const clusters = [...new Set(items.map((e) => e.cluster))].sort();
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const card = (e) => `
<label class="c" data-cluster="${esc(e.cluster)}" data-groups="${esc((e.groups || []).join(','))}">
  <input type="checkbox" value="${esc(e.id)}" />
  <div class="ph"><img loading="lazy" src="${esc(e.imageUrl)}" alt="${esc(e.work)}" /></div>
  <div class="b">
    <div class="t">${esc(e.work)}</div>
    <div class="s">${esc(e.artist)} · ${esc(e.origin)}</div>
    <div class="aw">${esc(e.award)}</div>
    <div class="cl">${esc(e.cluster)}</div>
    <div class="m"><b>매체</b> ${esc(e.medium)}</div>
    <div class="m"><b>팔레트</b> ${esc(e.palette)}</div>
    <div class="m"><b>마감</b> ${esc(e.finish)}</div>
    ${e.character ? `<div class="m"><b>캐릭터</b> ${esc(e.character)}</div>` : ''}
    <div class="g">${(e.groups || []).map((g) => `<span>${g} ${esc(GROUPS[g] || '')}</span>`).join('')}</div>
    <details><summary>왜 이 라인에 맞나</summary><p>${esc(e.why)}</p></details>
    <code>${esc(e.id)}</code>
  </div>
</label>`;

const html = `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>창작동화 · 앵커 후보 시트</title>
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
:root{--coral:#ff7c5c;--coral-dark:#e85c3a;--peach:#ffe8d9;--cream:#fff8f0;--ink:#2b2320;--ink-soft:#6b5d55;--mint:#22b8a6;--line:#f0e0d2}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif;background:var(--cream);color:var(--ink);line-height:1.6}
.wrap{max-width:1400px;margin:0 auto;padding:20px 20px 120px}
h1{font-size:26px;font-weight:900;margin-bottom:4px}
.sub{color:var(--ink-soft);font-size:13.5px;margin-bottom:14px}
.bar{position:sticky;top:0;z-index:5;background:var(--cream);border-bottom:2px solid var(--line);padding:10px 0;margin-bottom:14px}
.row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}
.row .lbl{font-size:12px;font-weight:800;color:var(--ink-soft);min-width:52px}
button.f{background:#fff;border:1px solid var(--line);color:var(--ink-soft);border-radius:999px;padding:3px 11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
button.f.on{background:var(--coral);border-color:var(--coral);color:#fff}
#pickbar{background:var(--peach);border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#copy{background:#fff;color:var(--mint);border:1.5px solid var(--mint);border-radius:999px;padding:3px 14px;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit}
#copy:hover,#copy.done{background:var(--mint);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.c{display:block;background:#fff;border:2px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;position:relative}
.c:has(input:checked){border-color:var(--coral);box-shadow:0 0 0 3px rgba(255,124,92,.18)}
.c input{position:absolute;top:9px;left:9px;z-index:2;width:19px;height:19px;accent-color:var(--coral);cursor:pointer}
.ph{height:210px;background:#f4ece4;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ph img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.b{padding:10px 12px 12px}
.t{font-size:14px;font-weight:800;line-height:1.35}
.s{font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.aw{font-size:11px;color:var(--coral-dark);font-weight:800;margin-top:5px}
.cl{font-size:11px;font-weight:800;color:var(--mint);margin-top:2px}
.m{font-size:11.5px;color:var(--ink-soft);margin-top:4px}
.m b{color:var(--ink);font-weight:800}
.g{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.g span{background:var(--peach);color:var(--coral-dark);border-radius:999px;padding:1px 8px;font-size:10.5px;font-weight:800}
details{margin-top:6px}
summary{font-size:11.5px;font-weight:700;color:var(--ink-soft);cursor:pointer}
details p{font-size:11.5px;color:var(--ink-soft);margin-top:4px}
.b code{display:block;margin-top:7px;font-size:10.5px;color:var(--ink-soft);background:var(--cream);border-radius:5px;padding:1px 6px;width:fit-content}
.hide{display:none}
</style>
<div class="wrap">
<h1>🎨 창작동화 · 앵커 후보 시트</h1>
<div class="sub">최근 20년 수상 일러스트에서 추린 <b>${items.length}개 후보</b> · ${Math.min(...items.map((e) => e.year))}~${Math.max(...items.map((e) => e.year))} · 마음에 드는 것을 골라 체크하세요. 🔴 <b>그림체 문법을 참고하는 것이지 그림을 베끼는 게 아닙니다</b> — 앵커는 우리 렌더로 민팅하고 실명은 프롬프트에 넣지 않습니다.</div>

<div class="bar">
  <div class="row"><span class="lbl">클러스터</span><button class="f on" data-k="cluster" data-v="">전체</button>${clusters
    .map((c) => `<button class="f" data-k="cluster" data-v="${esc(c)}">${esc(c)}</button>`)
    .join('')}</div>
  <div class="row"><span class="lbl">주제군</span><button class="f on" data-k="group" data-v="">전체</button>${Object.entries(
    GROUPS
  )
    .map(([k, v]) => `<button class="f" data-k="group" data-v="${k}">${k} ${v}</button>`)
    .join('')}</div>
  <div id="pickbar"><span id="cnt">선택 0개</span><button id="copy">📋 선택 복사</button><span id="picked" style="font-weight:600;color:#6b5d55"></span></div>
</div>

<div class="grid">${items.map(card).join('')}</div>
</div>
<script>
var F={cluster:'',group:''};
function apply(){
  document.querySelectorAll('.c').forEach(function(c){
    var okC=!F.cluster||c.dataset.cluster===F.cluster;
    var okG=!F.group||(c.dataset.groups||'').split(',').indexOf(F.group)>=0;
    c.classList.toggle('hide',!(okC&&okG));
  });
}
document.querySelectorAll('button.f').forEach(function(b){
  b.addEventListener('click',function(){
    F[b.dataset.k]=b.dataset.v;
    document.querySelectorAll('button.f[data-k="'+b.dataset.k+'"]').forEach(function(o){o.classList.toggle('on',o===b);});
    apply();
  });
});
function picked(){return [].slice.call(document.querySelectorAll('.c input:checked')).map(function(i){return i.value;});}
function sync(){
  var p=picked();
  document.getElementById('cnt').textContent='선택 '+p.length+'개';
  document.getElementById('picked').textContent=p.slice(0,6).join(', ')+(p.length>6?' …':'');
}
document.addEventListener('change',function(e){if(e.target.matches('.c input'))sync();});
document.getElementById('copy').addEventListener('click',function(){
  var p=picked(); if(!p.length){alert('먼저 후보를 체크하세요');return;}
  navigator.clipboard.writeText(p.join(' ')).then(function(){
    var b=document.getElementById('copy'); b.textContent='복사됨 ✓'; b.classList.add('done');
    setTimeout(function(){b.textContent='📋 선택 복사';b.classList.remove('done');},1500);
  });
});
</script>
`;

writeFileSync(OUT, html, 'utf8');
console.log(`후보 ${items.length}개 → ${OUT}`);
console.log(`클러스터 ${clusters.length}종 · 연도 ${Math.min(...items.map((e) => e.year))}~${Math.max(...items.map((e) => e.year))}`);

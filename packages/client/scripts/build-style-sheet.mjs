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
// 🔴 반쪽 프롬프트를 내보내느니 굽지 않는다.
const noSpec = items.filter((e) => !e.styleSpec?.medium || !e.styleSpec?.palette || !e.styleSpec?.finish);
if (noSpec.length) throw new Error(`styleSpec 미완 ${noSpec.length}건: ${noSpec.map((e) => e.id).join(', ')}`);
const leak = items.filter((e) => /[가-힣]/.test(JSON.stringify(e.styleSpec)));
if (leak.length) throw new Error(`styleSpec 에 한글 ${leak.length}건: ${leak.map((e) => e.id).join(', ')}`);

const GROUPS = {
  A: '마음·감정', B: '상상·변신', C: '자연·계절·동물', D: '모험·여정',
  E: '웃음·말놀이', F: '집·가족', G: '용기·두려움', H: '호기심·만들기',
};
const clusters = [...new Set(items.map((e) => e.cluster))].sort();
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * 후보 → 탐색용 STYLE ANCHOR 프롬프트.
 *
 * 골격은 §7.4 파일럿(손으로 저작한 것)에서 가져왔다. 다만 파일럿은 책 하나에 묶여 있고(여우·알프스·화),
 * 앵커는 **그림체의 것**이라 여기서는 무대·서사를 빼고 스타일 축만 남긴다.
 *
 * 🔴 테스트 장면을 69개 전부 동일하게 고정한다 — 베이크오프 규칙(변수는 그림체 하나만).
 *    장면 지문에 색·매체 단어를 넣지 않는다. 넣으면 특정 후보에 유리해져 공정한 비교가 아니다.
 * 🔴 작가 실명은 넣지 않는다(매체·팔레트·마감·캐릭터 언어로만 기술).
 * 🔴 이건 **첫 렌더용 초안**이다. 문구는 모델의 기본 렌더를 못 이기므로(§2.3), 살아남은 후보만
 *    art-director 가 제대로 저작하고, 승인 렌더를 ref 로 고정해야 앵커가 완성된다.
 */
const TEST_SUBJECT = `TEST SUBJECT — identical for every candidate, so that only the style differs:
  a small animal child standing in the open doorway of a village lane house at midday,
  one wooden bucket on the ground beside them, a low wall and one window behind.
  Nothing else in the scene. The animal is the only character.`;

const NOT_COMMON = `NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render /
  NOT cel-shaded anime / NOT a texture filter laid over flat digital colour / NOT photographic /
  NOT a uniform finish across the page / NOT a hazy, blurry or desaturated background
  (that is blur, not un-drawn) / NOT any lettering, numerals or signage anywhere in the image /
  NOT wool felt, NOT stitched fabric, NOT sculpted clay (those belong to another Tangobook line)`;

// 🔴 프롬프트는 `styleSpec`(영문 지시문)만 쓴다. top-level medium/palette/finish/character 는
//    사람이 읽을 한국어 분석 노트라 그대로 꽂으면 한영이 섞이고 감상이 지시문 자리에 들어간다.
const DEFAULT_CHARACTER = `the animal reads as one soft mass plus a defining feature (ears, tail, snout)
  built from two or three strokes. Silhouette must be readable at thumbnail size.
  The face must be able to act - give it drawn eyes rather than plain dots.`;

const promptFor = (e) => {
  const s = e.styleSpec;
  return `STYLE ANCHOR (draft) — ${e.id}

Style: a hand-made picture-book page for 4-6 year olds. European. Warm and quiet, not cute-glossy.
  Made by a person - the marks of the tool stay visible.

MEDIUM: ${s.medium}
  The mark of the tool must be visible in every shape - edges happen where the medium runs out,
  never as a clean vector line. No blending into airbrush softness.

PALETTE: ${s.palette}
  Keep the number of colours low and let the paper or ground carry the rest of the page.

FINISH HIERARCHY: ${s.finish}
  This is about how FINISHED each area is, not about opacity - the un-drawn areas are simply
  not drawn, they are not blurred, faded or desaturated.
  Never draw every roof tile, fence post, leaf or window pane.

CHARACTER DESIGN: ${s.character || DEFAULT_CHARACTER}

COMPOSITION: leave real empty space - the blank ground is a component, not a gap.
  Big readable silhouette, subject off-centre, and keep the bottom 18% quiet for a caption band.

${TEST_SUBJECT}

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: ${NOT_COMMON}`;
};

const card = (e) => `
<label class="c" data-cluster="${esc(e.cluster)}" data-groups="${esc((e.groups || []).join(','))}">
  <input type="checkbox" value="${esc(e.id)}" />
  <div class="two">
    <div class="ph"><img loading="lazy" src="${esc(e.imageUrl)}" alt="${esc(e.work)}" /><span class="cap">수상작</span></div>
    <div class="ph mine" data-key="${esc(e.id)}" tabindex="0"><span class="cap">내 렌더</span></div>
  </div>
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
    <button class="pb" type="button" data-p="${esc(promptFor(e))}">📋 프롬프트 복사</button>
    <details><summary>프롬프트 보기</summary><pre>${esc(promptFor(e))}</pre></details>
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
.two{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--line)}
.ph{height:180px;background:#f4ece4;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.ph img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.ph .cap{position:absolute;left:0;bottom:0;background:rgba(43,35,32,.62);color:#fff;font-size:9.5px;font-weight:800;padding:1px 6px;border-radius:0 6px 0 0;pointer-events:none}
.ph.mine{background:#fffdfa;border:2px dashed var(--line);cursor:pointer;outline:none;font-size:10.5px;color:var(--ink-soft);font-weight:700;text-align:center;padding:6px}
.ph.mine:focus{border-color:var(--coral)}
.ph.mine.has{border-style:solid;border-color:var(--mint);padding:0}
.ph.mine .hint{opacity:.8}
.ph.mine .del{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(43,35,32,.6);color:#fff;font-weight:800;font-size:11px;cursor:pointer;z-index:2}
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
button.pb{margin-top:8px;background:#fff;color:var(--mint);border:1.5px solid var(--mint);border-radius:999px;padding:3px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}
button.pb:hover,button.pb.done{background:var(--mint);color:#fff}
details pre{white-space:pre-wrap;background:var(--cream);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:10.5px;line-height:1.55;color:var(--ink-soft);margin-top:5px;max-height:260px;overflow:auto}
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
// ── 내 렌더 붙여넣기 (R2: comic-assets/changjak-tryouts) ───────────────
// 🔴 앵커 보관함(changjak-anchors)과 분리한다 — 저건 확정 앵커의 ref 고, 이건 시험 렌더다.
var TRY='/api/comic-assets/changjak-tryouts';
function paintMine(box,url){
  box.classList.add('has');
  box.innerHTML='<img src="'+url+'" alt="" /><span class="cap">내 렌더</span><button type="button" class="del">✕</button>';
}
function resetMine(box){
  box.classList.remove('has');
  box.innerHTML='<span class="hint">🖼️ 클릭 후 Ctrl+V</span><span class="cap">내 렌더</span>';
}
document.querySelectorAll('.ph.mine').forEach(function(box){
  resetMine(box);
  box.addEventListener('paste',function(e){
    var items=(e.clipboardData&&e.clipboardData.items)||[];
    for(var i=0;i<items.length;i++){
      if(items[i].type&&items[i].type.indexOf('image/')===0){
        e.preventDefault(); e.stopPropagation();
        var fr=new FileReader();
        box.innerHTML='<span class="hint">올리는 중…</span>';
        fr.onload=function(){
          fetch(TRY,{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({key:box.dataset.key,dataUrl:fr.result})})
            .then(function(r){return r.json();})
            .then(function(j){ if(!j.success) throw new Error(); paintMine(box,j.data.url+'?t='+Date.now()); })
            .catch(function(){ alert('저장 실패 — 서버(3500)가 떠 있는지 확인하세요'); resetMine(box); });
        };
        fr.readAsDataURL(items[i].getAsFile());
        return;
      }
    }
  });
});
fetch(TRY).then(function(r){return r.json();}).then(function(j){
  var m=(j&&j.data)||{};
  document.querySelectorAll('.ph.mine').forEach(function(box){
    if(m[box.dataset.key]) paintMine(box,m[box.dataset.key]+'?t='+Date.now());
  });
}).catch(function(){});

// 카드가 <label> 이라 안쪽 클릭은 체크박스를 토글한다 — 프롬프트 버튼/붙여넣기/펼치기는 막아야 한다.
document.addEventListener('click',function(e){
  var del=e.target.closest('.ph.mine .del');
  if(del){ e.preventDefault(); e.stopPropagation();
    var box=del.closest('.ph.mine');
    if(confirm('이 렌더를 지울까요?')) fetch(TRY+'/'+box.dataset.key,{method:'DELETE'}).then(function(){resetMine(box);});
    return; }
  var mine=e.target.closest('.ph.mine');
  if(mine){ e.preventDefault(); e.stopPropagation(); mine.focus(); return; }
  var b=e.target.closest('button.pb');
  if(b){ e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(b.dataset.p).then(function(){
      b.textContent='복사됨 ✓'; b.classList.add('done');
      setTimeout(function(){b.textContent='📋 프롬프트 복사';b.classList.remove('done');},1500);
    }); return; }
  if(e.target.closest('.c details')) e.preventDefault();
},true);
function picked(){return [].slice.call(document.querySelectorAll('.c input:checked')).map(function(i){return i.value;});}
function sync(){
  var p=picked();
  document.getElementById('cnt').textContent='선택 '+p.length+'개';
  document.getElementById('picked').textContent=p.slice(0,6).join(', ')+(p.length>6?' …':'');
}
document.addEventListener('change',function(e){if(e.target.matches('.c input'))sync();});
// ☰ 회차 드로어는 core.js 가 붙인다(vault·탭 코드는 해당 요소가 없으면 스스로 빠진다).
document.getElementById('copy').addEventListener('click',function(){
  var p=picked(); if(!p.length){alert('먼저 후보를 체크하세요');return;}
  navigator.clipboard.writeText(p.join(' ')).then(function(){
    var b=document.getElementById('copy'); b.textContent='복사됨 ✓'; b.classList.add('done');
    setTimeout(function(){b.textContent='📋 선택 복사';b.classList.remove('done');},1500);
  });
});
</script>
<script src="/changjak-core.js"></script>
`;

writeFileSync(OUT, html, 'utf8');
console.log(`후보 ${items.length}개 → ${OUT}`);
console.log(`클러스터 ${clusters.length}종 · 연도 ${Math.min(...items.map((e) => e.year))}~${Math.max(...items.map((e) => e.year))}`);

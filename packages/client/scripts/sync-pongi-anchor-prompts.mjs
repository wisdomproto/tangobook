import fs from 'fs';
const ROOT = 'C:/projects/tangobook/.claude/worktrees/wizardly-feynman-3ee1cb';
const P = `${ROOT}/packages/client/public/pongi-plan.html`;
let s = fs.readFileSync(P, 'utf8');

// ① core script 태그 — 🔴 본문에 이름이 적혀 있어 includes() 가드가 거짓이 됐었다. 태그로 검사한다.
if (!/<script src="\/pongi-core\.js"/.test(s)) {
  s = s.replace('</body>', '<script src="/pongi-core.js"></script>\n</body>');
}

// ② 앵커 프롬프트를 md 에서 그대로 가져와 복사 버튼에 물린다
const MD = fs.readFileSync(`${ROOT}/docs/art-direction/pongi-anchor.md`, 'utf8');
const blocks = [...MD.matchAll(/```\n(STYLE ANCHOR - pongi-[\s\S]*?)\n```/g)].map(m => m[1]);
if (blocks.length !== 4) throw new Error(`앵커 블록 ${blocks.length}개 — 4개여야 한다`);

const KEYS = ['a', 'b', 'c', 'd'];
const DATA = KEYS.map((k, i) => ({ k, prompt: blocks[i] }));

// 기존 §9 스크립트의 ANCHORS 배열에 prompt 를 얹고 복사 버튼을 붙인다
const inject = `
<script>
(function () {
  var P = ${JSON.stringify(Object.fromEntries(DATA.map(d => [d.k, d.prompt])))};
  document.querySelectorAll('#anchor-list .card').forEach(function (card, i) {
    var k = ['a','b','c','d'][i]; if (!P[k]) return;
    var head = card.firstElementChild;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '📋 앵커 프롬프트 복사';
    btn.style.cssText = 'background:var(--coral);color:#fff;border:0;border-radius:9px;padding:5px 13px;font-size:12.5px;font-weight:800;cursor:pointer;margin-left:auto';
    var tail = head.lastElementChild;
    if (tail) tail.style.marginLeft = '0';
    head.appendChild(btn);
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(P[k]).then(function () {
        var o = btn.textContent; btn.textContent = '✅ 복사됨';
        setTimeout(function () { btn.textContent = o; }, 1400);
      });
    });
    var det = document.createElement('details');
    det.style.marginTop = '8px';
    det.innerHTML = '<summary class="muted" style="cursor:pointer;font-weight:800">프롬프트 보기</summary>' +
      '<pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.7;background:#f7f4ef;border-radius:10px;padding:11px 13px;margin-top:8px"></pre>';
    det.querySelector('pre').textContent = P[k];
    card.insertBefore(det, card.lastElementChild);
  });
})();
</script>
`;
if (!s.includes('앵커 프롬프트 복사')) s = s.replace('<script src="/pongi-core.js"></script>', inject + '<script src="/pongi-core.js"></script>');

fs.writeFileSync(P, s);

// 검증 — 문자열 포함이 아니라 태그로
const out = fs.readFileSync(P, 'utf8');
console.log('core 태그:', /<script src="\/pongi-core\.js"><\/script>/.test(out) ? '✅' : '❌');
console.log('앵커 프롬프트:', (out.match(/STYLE ANCHOR - pongi-/g) || []).length, '개 (4여야 함)');
console.log('script 태그 수:', (out.match(/<script/g) || []).length);

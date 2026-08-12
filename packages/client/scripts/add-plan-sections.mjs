import fs from 'fs';
const P = 'C:/projects/tangobook/.claude/worktrees/wizardly-feynman-3ee1cb/packages/client/public/pongi-plan.html';
let s = fs.readFileSync(P, 'utf8');
if (s.includes('id="cast-sheets"')) { console.log('이미 있음 — 중단'); process.exit(0); }

const BLOCK = String.raw`
<h2>8. 캐스트 시트 — 프롬프트 복사 · 그림 붙여넣기</h2>

<p>🔴 <b>여기 붙여넣은 그림이 회차 250쪽에 자동으로 뜬다.</b> <code>pongi-core.js</code> 가 각 회차에서
<code>/api/comic-assets/pongi-plan</code> 을 읽어 「🎬 이 화 등장」 스트립을 만든다. 키를 바꾸지 마라.</p>

<div class="card warn">
<p><b class="red">넷 다 「붉은색 없음」이 프롬프트에 들어 있다.</b> 레퍼런스에 붉은 끈이 있어서 모델이
따라 그리기 쉽고, 붉은 것이 둘이 되는 순간 「화면의 유일한 따뜻한 색 = 주인공」 규칙이 죽는다.</p>
<p>🔴 <b>아빠·엄마·동생 프롬프트에는 퐁이를 옆에 세우는 지시가 들어 있다</b> — 키 차이가 시트마다 따로
정해지면 250쪽에서 어른이 커졌다 작아졌다 한다.</p>
</div>

<div id="cast-sheets"></div>

<h2>9. 앵커 넷 — 렌더 보관</h2>

<p>묶음마다 매체와 잉크 두 도가 다르다. 프롬프트 본문·경위 = <code>docs/art-direction/pongi-anchor.md</code></p>

<div id="anchor-list"></div>

<script>
(function () {
  var API = '/api/comic-assets/pongi-plan';
  var ST = 'Keep the attached image as the exact style reference: silkscreen, two ink screens on cream paper, paper grain faintly visible inside each ink, zero shading, no gradient, no outline, no cast shadow. The face has NO eyebrows. Expression is made by the MOUTH CURVE only; the eyes just open or close and never change size.';
  var LO = 'SHEET LAYOUT - one cream sheet, three rows, generous space between figures, every figure whole and separate, no frames, no boxes, no text, no labels, no arrows, no colour swatches. TOP ROW - three full-body views, standing, arms relaxed, all exactly the same height: front view, side profile facing right, back view showing the tail. MIDDLE ROW - five heads only, larger than the bodies, front view, same size, evenly spaced: calm, surprised with a small round mouth, laughing with eyes closed, concentrating with a short straight mouth, disappointed with a shallow downward curve. BOTTOM ROW - four full-body postures, same height as the top row: walking, sitting on the ground with legs stretched out, both arms reaching straight forward at chest height, fallen backwards with both feet in the air.';
  var SCALE = 'Include ONE extra figure at the far right of the top row: the cub from the attached image standing beside this character for scale, the cub head reaching only to the waist.';

  var CAST = [
    { key:'pongi', img:1, name:'퐁이', sub:'아기 수달 · 주인공 · 25권 전부', done:true,
      p:'확정 — docs/art-direction/pongi-sheets/01-pongi-modelsheet.png' },
    { key:'dad', img:2, name:'아빠', sub:'20권에 나온다',
      p:'Using the attached image as the exact character reference for species, colour and drawing style, draw the FATHER of this cub. He is a GROWN ADULT otter: tall, with a round heavy belly, head roughly one quarter of his height - clearly not a cub. Same rounded head, short blunt muzzle and tiny low ears. Back and head in the dark overlap colour #21372E, chest and belly in earth #8C7C68. He wears loose baggy dungarees in earth brown #8C7C68 with wide straps over the shoulders. HE WEARS NO RED ANYWHERE - no cord, no ribbon, nothing red on him or near him. ' + SCALE + ' ' + ST + ' ' + LO },
    { key:'mom', img:3, name:'엄마', sub:'04 · 06 · 10 · 13 · 16 · 22 · 23',
      p:'Using the attached image as the exact character reference for species, colour and drawing style, draw the MOTHER of this cub. She is a GROWN ADULT otter, slimmer than the father, head roughly one quarter of her height - clearly not a cub. Same rounded head, short blunt muzzle and tiny low ears. Back and head in the dark overlap colour #21372E, chest and belly in earth #8C7C68. She wears a headscarf in deep pine green #21372E tied behind the head. SHE WEARS NO RED ANYWHERE - no cord, no ribbon, nothing red on her or near her. ' + SCALE + ' ' + ST + ' ' + LO },
    { key:'baby', img:4, name:'동생', sub:'02 · 03 · 04 · 05 · 07 · 09 · 17 · 23',
      p:'Using the attached image as the exact character reference, draw the YOUNGER SIBLING of this cub - a toddler otter. He is SMALLER and ROUNDER than the attached cub, with even shorter and stubbier limbs and a head close to a third of his height. Same colours: back and head #21372E, chest and belly #8C7C68. In every single figure on the sheet he holds ONE clam shell with both forepaws pressed against his chest - the shell is there in every view and every posture. HE WEARS NO RED ANYWHERE - no cord, nothing red on him. ' + SCALE + ' ' + ST + ' ' + LO },
    { key:'goose', img:5, name:'거위 할아버지', sub:'08 · 10 · 11 · 14 · 21 · 25',
      p:'Using the attached image ONLY as the style reference - the same silkscreen look, the same cream paper, the same flat inks - draw an ELDERLY GOOSE. He is a different species from the attached otter: a long neck, a rounded body in warm off-white #F6F4EE, and a broad flat beak in earth brown #8C7C68. He is the TALLEST and THINNEST character in this series - taller than an adult otter, mostly neck. His two eyes are the same small dark dots as the reference, clearly drawn on the head, and his beak is always visible. He wears tall rubber boots in earth brown #8C7C68. HE WEARS NO RED ANYWHERE - no cord, nothing red on him. ' + ST + ' ' + LO }
  ];

  function copy(t, btn) {
    navigator.clipboard.writeText(t).then(function () {
      var o = btn.textContent; btn.textContent = '✅ 복사됨';
      setTimeout(function () { btn.textContent = o; }, 1400);
    });
  }

  function pasteBox(key) {
    var box = document.createElement('div');
    box.style.cssText = 'border:2px dashed var(--line);border-radius:12px;min-height:140px;display:flex;align-items:center;justify-content:center;font-size:12.5px;color:var(--ink-soft);cursor:pointer;background:#fdfbf8;overflow:hidden;margin-top:10px;';
    box.tabIndex = 0; box.dataset.key = key;
    var HINT = '🖼️ 클릭 후 Ctrl+V — 시트 붙여넣기';
    function reset() { box.innerHTML = ''; box.textContent = HINT; }
    function setImg(u) {
      box.innerHTML = '<div style="position:relative;width:100%"><img src="' + u + '" style="width:100%;display:block;border-radius:10px" /><button type="button" style="position:absolute;top:6px;right:6px;border:0;border-radius:8px;background:#fff;padding:3px 9px;font-weight:800;cursor:pointer">✕</button></div>';
      box.querySelector('button').addEventListener('click', function (e) {
        e.stopPropagation(); if (!confirm('이 이미지를 삭제할까요?')) return;
        fetch(API + '/' + key, { method: 'DELETE' }).then(reset).catch(function () { alert('삭제 실패 — 서버(3500) 확인'); });
      });
    }
    function up(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      var fr = new FileReader();
      fr.onload = function () {
        fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, dataUrl: fr.result }) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.success) setImg(j.data.url + '?t=' + Date.now()); else alert('저장 실패: ' + (j.error || '')); })
          .catch(function () { alert('저장 실패 — 서버(3500) 확인'); });
      };
      fr.readAsDataURL(file);
    }
    box.addEventListener('paste', function (e) {
      var it = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < it.length; i++) {
        if (it[i].type && it[i].type.indexOf('image/') === 0) { e.preventDefault(); up(it[i].getAsFile()); return; }
      }
    });
    box.addEventListener('dragover', function (e) { e.preventDefault(); });
    box.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) up(f); });
    box.addEventListener('click', function () { box.focus(); });
    reset();
    return box;
  }

  var wrap = document.getElementById('cast-sheets');
  CAST.forEach(function (c) {
    var card = document.createElement('div'); card.className = 'card';
    var head = '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><b>@image' + c.img + ' · ' + c.name + '</b><span class="muted">' + c.sub + '</span>';
    head += c.done
      ? '<span class="pill" style="margin-left:auto">✅ 확정</span></div><p class="muted">' + c.p + '</p>'
      : '<button type="button" class="copy" style="margin-left:auto;background:var(--coral);color:#fff;border:0;border-radius:9px;padding:5px 13px;font-size:12.5px;font-weight:800;cursor:pointer">📋 시트 프롬프트 복사</button></div><details style="margin-top:8px"><summary class="muted" style="cursor:pointer;font-weight:800">프롬프트 보기</summary><pre style="white-space:pre-wrap;font-family:inherit;font-size:12.5px;line-height:1.75;background:#f7f4ef;border-radius:10px;padding:11px 13px;margin-top:8px"></pre></details>';
    card.innerHTML = head;
    if (!c.done) {
      card.querySelector('pre').textContent = c.p;
      card.querySelector('.copy').addEventListener('click', function () { copy(c.p, this); });
    }
    card.appendChild(pasteBox(c.key));
    wrap.appendChild(card);
  });

  var ANCHORS = [
    { k: 'A', slug: 'pongi-screenwater', t: '물 위 · 실크스크린', v: '02 · 07 · 09 · 12 · 17 · 24' },
    { k: 'B', slug: 'pongi-presshome', t: '집 안 · 활판', v: '04 · 05 · 08 · 11 · 16 · 22 · 23' },
    { k: 'C', slug: 'pongi-risosky', t: '마당·길 · 리소', v: '01 · 03 · 06 · 10 · 20 · 21' },
    { k: 'D', slug: 'pongi-cutvillage', t: '마을 · 리노컷', v: '13 · 14 · 15 · 18 · 19 · 25' }
  ];
  var al = document.getElementById('anchor-list');
  ANCHORS.forEach(function (a, i) {
    var d = document.createElement('div'); d.className = 'card';
    d.innerHTML = '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><b>' + a.k + ' · ' + a.t + '</b><code>' + a.slug + '</code><span class="muted">' + a.v + '</span><span class="muted" style="margin-left:auto">pongi-anchor.md §' + (i + 2) + '</span></div>';
    d.appendChild(pasteBox('anchor-' + a.k.toLowerCase()));
    al.appendChild(d);
  });

  fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    var d = (j && j.data) || {};
    document.querySelectorAll('[data-key]').forEach(function (b) {
      var u = d[b.dataset.key]; if (!u) return;
      b.innerHTML = '<div style="position:relative;width:100%"><img src="' + u + '?t=' + Date.now() + '" style="width:100%;display:block;border-radius:10px" /></div>';
    });
  }).catch(function () {});
})();
</script>
`;

s = s.replace('\n</div>\n</body>', BLOCK + '\n</div>\n</body>');
fs.writeFileSync(P, s);
console.log('§8 캐스트 · §9 앵커 추가:', s.includes('id="cast-sheets"') && s.includes('id="anchor-list"'));

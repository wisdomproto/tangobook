/*
 * saenghwal-core.js — 호리네 생활동화 회차 공용 스크립트
 * 회차 파일은 이 스크립트를 include 하기 전에 (선택) window.SH_GUESTS 만 정의한다.
 *   <script>window.SH_GUESTS=[{key:'doctor',name:'코끼리 의사 선생님',aliases:['doctor','elephant doctor'],desc:'...'}]</script>
 *   <script src="/saenghwal-core.js"></script>
 * 기능: 상단 탭, 쪽별/전체 묶음 이미지 프롬프트(스타일 1회 + @image1..8 고정캐스트 + @image9~ 단역 + 쪽별 [등장]),
 *       컷/캐릭터 이미지 붙여넣기(/api/comic-assets/{docId}).
 * 전제 마크업: 각 페이지 = <div class="page-card" data-page="pN"> ... <pre class="scene">영문 SCENE</pre> </div>
 */
(function () {
  'use strict';

  // ── 묶음바 CSS 주입 ──
  (function injectCss() {
    if (document.getElementById('sh-core-style')) return;
    var css = [
      '.batch-bar{background:#fff;border:1.5px solid var(--mint);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.batch-bar .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.batch-bar .bhint{font-size:12px;color:var(--ink-soft);margin-bottom:12px;line-height:1.6;}',
      '.batch-bar .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.batch-btn{background:var(--mint);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.batch-btn:hover{background:#1a9e8e;}',
      '.batch-btn.done{background:var(--coral);}',
      '.guest-section{background:#fff;border:1.5px solid var(--coral);border-radius:16px;padding:18px 20px;margin:16px 0 24px;}',
      '.guest-section h3{font-size:16px;font-weight:900;color:var(--coral-dark);margin:0 0 6px;}',
      '.guest-section .ghint{font-size:12px;color:var(--ink-soft);line-height:1.6;margin-bottom:12px;}',
      '.guest-section .char-prompt{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0;background:var(--cream);}',
      '.guest-section .char-prompt .head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.guest-section .char-prompt .head b{font-size:14px;}',
      '.guest-section .char-prompt .copy-btn{margin-left:auto;}',
      '.guest-section summary{cursor:pointer;font-size:12.5px;font-weight:700;color:var(--ink-soft);margin-top:6px;}',
      '.guest-section pre{white-space:pre-wrap;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:12px;line-height:1.6;margin-top:6px;color:var(--ink-soft);}',
      '.ref-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:8px 12px;margin:0 0 22px;}',
      '.ref-strip .ref-lab{font-size:11.5px;font-weight:800;color:var(--ink-soft);flex:0 0 auto;margin-right:2px;}',
      '.ref-chip{display:flex;align-items:center;gap:6px;background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:3px 11px 3px 3px;}',
      '.ref-chip img{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#fff;flex:0 0 auto;}',
      '.ref-chip .ph{width:30px;height:30px;border-radius:50%;background:var(--peach);display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;}',
      '.ref-chip b{font-size:11.5px;font-weight:800;color:var(--ink);white-space:nowrap;}',
      '.ref-chip .im{color:var(--coral-dark);font-weight:900;}',
      '.ref-chip.guest{border-color:var(--coral);}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'sh-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ── 🔴 STYLE SSOT — 그림체 = B 니들펠트 확정(2026-07-05). 변경 시 이 블록만 교체하면 전 회차·전 페이지 반영 ──
  var STYLE_PROMPT = [
    '[스타일] 호리네 생활동화 — 3~5세 유아 그림책. 그림체 = 니들펠트(양모 인형) 스톱모션 룩 (needle-felted wool plush, handmade felt stop-motion diorama).',
    '보송보송한 양모 펠트 섬유 질감이 살아있는 폭신한 3D 인형 캐릭터, 통통하고 둥글둥글한 형태, 부드러운 스튜디오 소프트박스 조명과 은은한 실제 그림자, 만지고 싶은 촉감, 밝고 채도 높은 색감.',
    '슈퍼-디폼드 치비 비율(머리≈몸통 1.3배, 짧고 통통한 팔다리, 크고 둥근 눈, 분홍 볼터치). 배경도 펠트·천·미니어처로 만든 듯한 아기자기한 디오라마.',
    '화면비 16:9 스프레드, 부드러운 심도 배경. 평면 2D 아님·그림물감 아님·매끈한 CG/클레이 아님 — 양모 섬유 질감이 반드시 보여야 함 (visible wool-felt fibers).',
    '그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않고, 상단에 캡션용 여백을 남긴다.',
  ].join(' ');

  // ── 고정 캐스트 8인 — 배치에서 항상 @image1..8 (순서 고정, 전 회차 공통) ──
  var FIXED_CHARS = [
    { key: 'hori',  name: '호리',  aliases: ['Hori', '호리'],
      desc: '아기 호랑이(5세) 주인공 — 주황 털(#F8A755)+갈색 줄무늬, 크림색 배, 분홍 볼터치, 크고 둥근 호기심 눈. 시그니처=용기의 순간 꼬리 줄무늬가 무지개로 반짝.' },
    { key: 'mom',   name: '엄마',  aliases: ['Mom tiger', 'Mom', 'mother tiger', '엄마'],
      desc: '엄마 호랑이 — 호리와 같은 팔레트의 둥근 치비(아이들과 같은 비율, 살짝만 큼 1.35배). 날씬X, 부드러운 속눈썹, 복숭아색 앞치마. 어린 인상.' },
    { key: 'dad',   name: '아빠',  aliases: ['Dad', 'father tiger', 'Daddy', '아빠'],
      desc: '아빠 호랑이 — 진한 주황 털의 둥근 치비(살짝만 큼 1.4배, 각진 턱X·근육X, 통통 포근). 작고 둥근 안경, cowlick, 큰 미소. 어린 인상.' },
    { key: 'hoya',  name: '호야',  aliases: ['Hoya', 'baby brother', 'little brother', '호야'],
      desc: '아기 동생 호랑이(2세) — 호리와 같은 팔레트지만 더 통통하고 머리 비율 큼, 노란 턱받이, 침 흘리는 행복한 얼굴.' },
    { key: 'toto',  name: '토토',  aliases: ['Toto', 'bunny', '토토'],
      desc: '토끼(5세) — 흰 털, 연하늘색 귀 안쪽, 길게 선 귀, 자신만만한 눈, 앞으로 기운 활발한 자세, 빨간 손수건.' },
    { key: 'bori',  name: '보리',  aliases: ['Bori', 'bear cub', 'bear Bori', '보리'],
      desc: '곰(6세) — 연갈색 통통한 몸, 수줍고 부드러운 표정, 큰 눈이 살짝 아래를 봄, 파란 멜빵바지.' },
    { key: 'kongi', name: '콩이',  aliases: ['Kongi', 'squirrel', '콩이'],
      desc: '다람쥐(5세) — 크고 줄무늬진 복슬 꼬리, 먹이를 문 듯 빵빵한 볼주머니, 장난스러운 미소, 도토리.' },
    { key: 'dubu',  name: '두부',  aliases: ['Dubu', 'puppy', '두부'],
      desc: '강아지 펫 — 동글동글 흰 몸, 한쪽만 접힌 갈색 귀, 크고 반짝이는 눈, 빨간 목줄, 혀 내밀고 행복.' },
  ];

  var GUESTS = (window.SH_GUESTS || []).slice(); // 화별 단역 → @image9~
  var ALL = FIXED_CHARS.concat(GUESTS);
  ALL.forEach(function (c, i) { c.img = i + 1; }); // 1..8 고정, 9~ 단역
  var IS_GUEST = {}; GUESTS.forEach(function (g) { IS_GUEST[g.key] = true; });
  // 레퍼런스 이미지 없을 때 폴백 얼굴 (고정 캐스트)
  var FACE = { hori: '🐯', mom: '🐯', dad: '🐯', hoya: '🐯', toto: '🐰', bori: '🐻', kongi: '🐿️', dubu: '🐶' };

  function sceneHasChar(sceneText, c) {
    var s = sceneText.toLowerCase();
    return (c.aliases || [c.name]).some(function (n) { return s.indexOf(n.toLowerCase()) !== -1; });
  }

  function composeBatchPrompt(pages) {
    // 이 회차(넘겨받은 pages) 전체에서 각 캐릭터 등장 여부
    var appearsAny = {};
    ALL.forEach(function (c) {
      appearsAny[c.key] = pages.some(function (p) { return sceneHasChar(p.scene, c); });
    });

    var legend = ALL.map(function (c) {
      var tail = appearsAny[c.key] ? '' : '  (이 화 미등장 — 첨부 불필요)';
      return '@image' + c.img + ' = ' + c.name + ': ' + c.desc + tail;
    }).join('\n');

    var head = [
      STYLE_PROMPT,
      '',
      '[캐릭터 레퍼런스] 아래 @imageN 순서대로 레퍼런스 이미지를 첨부하세요. 얼굴·헤어·비율·색은 @imageN 시트와 100% 동일하게 유지합니다. @image1~8 = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
      legend,
      '※ 각 쪽 [등장]에 적힌 @imageN 캐릭터만 그 컷에 그린다. 나머지는 넣지 않는다.',
      '',
      '[출력 규칙]',
      '- 아래 ' + pages.length + '개 장면을 각각 독립된 16:9 스프레드 일러스트로 그린다 (총 ' + pages.length + '장, 쪽 순서대로).',
      '- 같은 캐릭터의 얼굴·머리·비율·색은 모든 장면에서 동일하게 유지한다.',
      '- 그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않는다. 상단에 캡션용 여백을 남긴다.',
    ].join('\n');

    var body = pages.map(function (p) {
      var on = ALL.filter(function (c) { return sceneHasChar(p.scene, c); });
      var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
      return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경/사물 컷)') + '\n' + p.scene.trim();
    }).join('\n\n');

    return head + '\n\n' + body;
  }

  // ── 단역 캐릭터 레퍼런스 시트 프롬프트 (STYLE_PROMPT와 동일 그림체 = 니들펠트) ──
  function guestSheetPrompt(g) {
    return [
      'Style: Needle-felted wool plush look — a soft handmade 3D wool-felt doll with visible fuzzy felted-wool fibers, chunky huggable rounded forms, gentle soft studio lighting, vibrant saturated colors, stop-motion feel. NOT flat 2D, NOT painted, NOT smooth CG, NOT clay-smooth (wool fibers must be visible). Super-deformed chibi: head ~1.3x body, short chubby limbs, large round eyes, pink cheek blush. Canvas 1024x1024, solid pure magenta #FF00FF background, character centered, 8% padding. No ground shadow, no text, no labels, no extra characters.',
      'CHARACTER: ' + g.name + ' — ' + g.desc,
      'LAYOUT: one sheet with the SAME character — full-body front idle, 3/4 turn, and three face close-ups (happy, surprised, gentle). Single character only.',
    ].join('\n');
  }

  // ── 페이지 데이터 수집 ──
  function collectPages() {
    return Array.prototype.map.call(document.querySelectorAll('.page-card[data-page]'), function (card) {
      var pre = card.querySelector('pre.scene');
      var headB = card.querySelector('.page-head b');
      var pnum = card.querySelector('.pnum');
      var label = ((pnum ? pnum.textContent.trim() + ' ' : '') + (headB ? headB.textContent.trim() : card.getAttribute('data-page'))).trim();
      return { card: card, page: card.getAttribute('data-page'), label: label, scene: pre ? pre.textContent : '' };
    });
  }

  function flash(btn, label, done) {
    var orig = btn.getAttribute('data-orig') || btn.textContent;
    btn.setAttribute('data-orig', orig);
    btn.textContent = label; if (done) btn.classList.add('done');
    setTimeout(function () { btn.textContent = orig; btn.classList.remove('done'); }, 1600);
  }
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); flash(btn, '복사됨 ✓', true); }
    catch (e) { window.prompt('복사가 막혔어요 — 직접 복사하세요:', text); }
  }

  // ── 탭 (공용 인덱스 /saenghwal-index.json 기반, 실패 시 폴백) ──
  (function () {
    var nav = document.getElementById('doc-tabs');
    if (!nav) return;
    var fallback = [
      ['saenghwal-plan.html', '📘 기획서'],
      ['saenghwal-golgoru.html', '🥕 편식'],
      ['saenghwal-hospital.html', '🏥 병원'],
      ['saenghwal-sonssitgi.html', '🫧 손씻기'],
    ];
    var here = location.pathname.split('/').pop() || '';
    function render(items) {
      nav.innerHTML = items.map(function (it) {
        return '<a href="' + it[0] + '"' + (it[0] === here ? ' class="active"' : '') + '>' + it[1] + '</a>';
      }).join('');
    }
    fetch('/saenghwal-index.json').then(function (r) { return r.json(); }).then(function (j) {
      var items = (j && j.length) ? j.map(function (e) { return [e.file, e.label]; }) : fallback;
      render(items);
    }).catch(function () { render(fallback); });
  })();

  // ── 전체 묶음 프롬프트 바 (hero 뒤) + 쪽별 복사 버튼 + 붙여넣기 ──
  (async function () {
    var pages = collectPages();
    if (!pages.length) return;

    // 전체 묶음 바
    var anchor = document.querySelector('.refrain') || document.querySelector('header.hero');
    if (anchor) {
      var bar = document.createElement('div');
      bar.className = 'batch-bar';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에</div>' +
        '<div class="bhint">버튼을 누르면 <b>스타일(1회) + 캐릭터 레퍼런스(@image1~) + ' + pages.length + '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 레퍼런스 이미지를 첨부</b>하세요(1~8=고정 캐스트, 9~=이 화 단역). 각 쪽 [등장]이 그 컷에 넣을 캐릭터를 지정합니다.</div>' +
        '<div class="brow"><button type="button" class="batch-btn" id="copy-all-scene">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      document.getElementById('copy-all-scene').addEventListener('click', function () {
        copyText(composeBatchPrompt(pages.map(function (p) { return { label: p.label, scene: p.scene }; })), this);
      });
    }

    // 쪽별 복사 버튼(단일 쪽도 스타일+레퍼런스 포함 프롬프트)
    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (btn) {
        var clone = btn.cloneNode(true); btn.parentNode.replaceChild(clone, btn); // 기존 리스너 제거
        clone.addEventListener('click', function () {
          copyText(composeBatchPrompt([{ label: p.label, scene: p.scene }]), clone);
        });
      }
    });

    // 이미지 붙여넣기
    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var ASSET_API = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(ASSET_API); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}

    // ── 이 화 등장 캐릭터 레퍼런스 한 줄 스트립 (고정캐스트=기획서 저장분, 단역=이 화 저장분) ──
    (function () {
      var planAssets = {};
      // 기획서(saenghwal-plan)에 붙여넣어 확정한 고정 캐스트 레퍼런스 이미지를 끌어온다
      // (동기 흐름 유지를 위해 별도 즉시 fetch → 완료 후 img src 교체)
      var appearing = ALL.filter(function (c) { return pages.some(function (p) { return sceneHasChar(p.scene, c); }); });
      if (!appearing.length) return;
      var strip = document.createElement('div');
      strip.className = 'ref-strip';
      function chip(c, url) {
        var thumb = url
          ? '<img src="' + url + (url.indexOf('?') < 0 ? '?t=' + Date.now() : '') + '" alt="" />'
          : '<span class="ph">' + (FACE[c.key] || '🎭') + '</span>';
        return '<div class="ref-chip' + (IS_GUEST[c.key] ? ' guest' : '') + '" data-key="' + c.key + '" title="' +
          (c.desc || '').replace(/"/g, '') + '">' + thumb +
          '<b><span class="im">@image' + c.img + '</span> ' + c.name + '</b></div>';
      }
      strip.innerHTML = '<span class="ref-lab">🎬 이 화 등장</span>' +
        appearing.map(function (c) { return chip(c, IS_GUEST[c.key] ? assets[c.key] : null); }).join('');
      var firstPageEl = document.querySelector('.page-card');
      if (firstPageEl) firstPageEl.parentNode.insertBefore(strip, firstPageEl);
      // 고정 캐스트 이미지는 기획서 저장분을 비동기로 채워 넣는다
      fetch('/api/comic-assets/saenghwal-plan').then(function (r) { return r.json(); }).then(function (j) {
        planAssets = (j && j.data) || {};
        appearing.forEach(function (c) {
          if (IS_GUEST[c.key] || !planAssets[c.key]) return;
          var box = strip.querySelector('.ref-chip[data-key="' + c.key + '"]');
          if (!box) return;
          var ph = box.querySelector('.ph');
          if (ph) ph.outerHTML = '<img src="' + planAssets[c.key] + '?t=' + Date.now() + '" alt="" />';
        });
      }).catch(function () {});
    })();

    function createPasteBox(key) {
      var box = document.createElement('div'); box.className = 'paste-box'; box.tabIndex = 0;
      var hint = '🖼️ 클릭 후 Ctrl+V — 생성한 컷 붙여넣기';
      function reset() { box.classList.remove('has-img'); box.innerHTML = ''; box.textContent = hint; }
      function setImg(url) {
        box.classList.add('has-img');
        box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del">✕</button>';
        box.querySelector('.paste-del').addEventListener('click', async function (e) {
          e.stopPropagation(); if (!confirm('이 이미지를 삭제할까요?')) return;
          try { await fetch(ASSET_API + '/' + key, { method: 'DELETE' }); reset(); } catch (err) { alert('삭제 실패 — 서버(3500) 확인'); }
        });
      }
      if (assets[key]) setImg(assets[key] + '?t=' + Date.now()); else box.textContent = hint;
      async function upload(file) {
        if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
        box.classList.add('busy'); var fr = new FileReader();
        fr.onload = async function () {
          try {
            var r2 = await fetch(ASSET_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, dataUrl: fr.result }) });
            var j2 = await r2.json();
            if (j2.success) setImg(j2.data.url + '?t=' + Date.now()); else alert('저장 실패: ' + (j2.error || ''));
          } catch (e) { alert('저장 실패 — 서버(3500) 확인'); }
          box.classList.remove('busy');
        };
        fr.readAsDataURL(file);
      }
      box.addEventListener('paste', function (e) {
        var its = (e.clipboardData && e.clipboardData.items) || [];
        for (var i = 0; i < its.length; i++) { if (its[i].type && its[i].type.indexOf('image/') === 0) { e.preventDefault(); upload(its[i].getAsFile()); return; } }
      });
      box.addEventListener('dragover', function (e) { e.preventDefault(); });
      box.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) upload(f); });
      box.addEventListener('click', function () { box.focus(); });
      return box;
    }
    pages.forEach(function (p) { p.card.appendChild(createPasteBox(p.page)); });

    // ── 이 화 단역 레퍼런스 섹션 (SH_GUESTS 있을 때만) ──
    if (GUESTS.length) {
      var sec = document.createElement('div');
      sec.className = 'guest-section';
      var cards = GUESTS.map(function (g) {
        return '<div class="char-prompt" data-guest="' + g.key + '">' +
          '<div class="head"><b>@image' + g.img + ' · ' + g.name + '</b>' +
          '<button type="button" class="copy-btn">📋 시트 프롬프트 복사</button></div>' +
          '<details><summary>프롬프트 보기</summary><pre></pre></details></div>';
      }).join('');
      sec.innerHTML =
        '<h3>🎭 이 화 새 캐릭터(단역) 레퍼런스</h3>' +
        '<div class="ghint">이 화에만 나오는 단역입니다(@image9~). ① [시트 프롬프트 복사] → GPT에 넣어 니들펠트 시트 생성 → ② 아래 박스에 붙여넣어 확정하세요. 그러면 전체 프롬프트의 @image 번호와 이 시트가 1:1로 맞습니다. <b>@image1~8 고정 캐스트 시트는 📘 기획서 탭에서.</b></div>' +
        cards;
      var firstPage = document.querySelector('.page-card');
      if (firstPage) firstPage.parentNode.insertBefore(sec, firstPage);
      GUESTS.forEach(function (g) {
        var card = sec.querySelector('.char-prompt[data-guest="' + g.key + '"]');
        card.querySelector('pre').textContent = guestSheetPrompt(g);
        var btn = card.querySelector('.copy-btn');
        btn.addEventListener('click', function () { copyText(guestSheetPrompt(g), btn); });
        card.appendChild(createPasteBox(g.key));
      });
    }
  })();
})();

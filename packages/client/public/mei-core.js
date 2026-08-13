/*
 * mei-core.js — 메이네 산마을(창작동화 시리즈 02) 회차 공용 스크립트. pongi-core.js 포크.
 * 회차 파일은 include 전에 (선택) window.SH_GUESTS 만 정의한다.
 * 🔴 01 과 다른 점: 앵커가 넷이라 STYLE 이 하나가 아니다 — 권 번호로 A~D 를 골라 붙인다.
 *   SSOT = docs/art-direction/mei-anchor.md (아래 ANCHOR 블록은 그 사본이고, 고칠 땐 양쪽 다).
 * 전제 마크업: 각 페이지 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  (function injectCss() {
    if (document.getElementById('mei-core-style')) return;
    var css = [
      '.batch-bar{background:#fff;border:1.5px solid var(--slope);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.batch-bar .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.batch-bar .bhint{font-size:12px;color:var(--ink-soft);margin-bottom:12px;line-height:1.6;}',
      '.batch-bar .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.batch-btn{background:var(--slope);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.batch-btn:hover{filter:brightness(1.15);}',
      '.batch-btn.done{background:var(--accent);}',
      '.anchor-chip{display:inline-block;background:var(--peach);border-radius:999px;padding:2px 11px;font-size:11.5px;font-weight:800;margin-left:6px;}',
      '.guest-section{background:#fff;border:1.5px solid var(--accent);border-radius:16px;padding:18px 20px;margin:16px 0 24px;}',
      '.guest-section h3{font-size:16px;font-weight:900;color:var(--accent);margin:0 0 6px;}',
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
      '.ref-chip .im{color:var(--accent);font-weight:900;}',
      '.ref-chip.guest{border-color:var(--accent);}',
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:#fff;z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}',
      '#ep-summary{font-size:12px;color:var(--ink-soft);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft);padding:2px 4px;}',
      '.ep-plan{display:block;margin:10px 12px 6px;padding:10px 13px;border-radius:10px;background:var(--peach);color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;border:1px solid var(--line);}',
      '.ep-plan:hover,.ep-plan.active{background:var(--accent);color:#fff;border-color:var(--accent);}',
      '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1f1f1;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--accent);text-decoration:underline;}',
      '.ep-item.active a{color:var(--accent);font-weight:800;}',
      '.ep-item.done a{text-decoration:line-through;color:var(--ink-soft);}',
      '.ep-badge{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:15px;line-height:1;padding:3px;border-radius:6px;}',
      '.ep-badge:hover{background:#f1f1f1;}',
      '.ep-memo{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:14px;line-height:1;padding:3px;border-radius:6px;opacity:.35;}',
      '.ep-memo:hover{background:#f1f1f1;opacity:.75;}',
      '.ep-memo.has{opacity:1;}',
      '#ep-memo-modal{position:fixed;inset:0;z-index:1003;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;padding:16px;}',
      '#ep-memo-modal.on{display:flex;}',
      '#ep-memo-modal .box{background:#fff;border-radius:14px;width:min(480px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;}',
      '#ep-memo-modal .mhead{padding:14px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:15px;color:var(--ink);word-break:keep-all;}',
      '#ep-memo-modal textarea{border:0;outline:none;resize:none;padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.6;min-height:180px;flex:1;color:var(--ink);background:#fff;}',
      '#ep-memo-modal .mrow{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line);}',
      '#ep-memo-modal button{border:0;border-radius:9px;padding:9px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '#ep-memo-modal .save{background:var(--accent);color:#fff;}',
      '#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'mei-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ── 🔴 앵커 하나 — 한 시리즈 = 한 그림체 (2026-08-13 확정, 넷으로 쪼갰다가 뒤집음).
  //    SSOT = docs/art-direction/mei-anchor.md — 무대별 조항(산장·개울·광장·눈·숲)은 매체를 안 바꾸고
  //    「두 색을 어디에 쓰고 무엇을 종이로 남기나」만 정한다. 고칠 땐 문서와 여기 양쪽 다.
  var ANCHORS = {
    A: { name: '색연필 · 온회색 종이', slug: 'mei-pencilslope',
      vols: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25'],
      ko: [
        '[스타일] 메이네 산마을 — 4~6세 유아 그림책. 앵커 `mei-pencilslope` (시리즈 전권 공통).',
        '거친 온회색 종이(#EDE9E1) 위에 색연필 두 자루로만 그린다. 모든 면은 한 방향으로 그은 평행 획으로 채우고, 종이 결이 획을 끊어 어떤 면도 꽉 차지 않는다.',
        '두 색이 교차해 그은 자리에서만 어두운 색이 생긴다 — 이것 말고 다른 어두움은 없다. 칠하지 않은 종이가 하늘이고 눈이고 불빛이고 빛이다.',
        '음영·번짐·문지름·그라데이션·드리운 그림자·하이라이트가 전부 없다. 획 방향은 한 면 안에서 절대 안 바뀌고, 방향이 바뀌는 자리가 곧 경계다.',
        '색 두 가지: 이끼 초록 #6E7A5E(풀·물·덧문·천), 흙 갈색 #8A7358(나무·돌·바닥·지붕·땅). 교차한 자리 = 짙은 이탄 #40483A(동물 등·줄기·쇠·밤). 흰 색연필은 어디에도 없다.',
        '무대 조항 — 산장 안: 바닥=널 획 반복·벽=점선 반복·천=지그재그 반복, 같은 마크를 되풀이하고 찾는 물건만 제 윤곽으로. 불빛·등불은 칠하지 않은 종이이고 화면에서 가장 밝다.',
        '무대 조항 — 개울: 물은 가로 한 방향 이끼색 한 면, 물결·반짝임 0. 잠긴 것은 그 안에 교차색으로, 물 위 것은 윤곽이 다 보이게. 길은 맨 종이 띠.',
        '무대 조항 — 광장: 땅은 흙색 한 면, 지붕·종탑은 윤곽 있는 흙색, 군중은 얼굴·손 없는 실루엣 일곱 이하. 깊이는 어두워지는 게 아니라 촘촘해지는 것으로.',
        '🔴 눈 오는 권(01·13·16): 비탈·광장을 아예 안 긋는다 — 끝에서 끝까지 맨 종이이고, 두 색은 그 위에 선 것만 그린다.',
        '🔴 숲 권(04): 흙색이 나무 줄기를(줄기당 한 획, 아홉 이하, 전부 수직), 이끼색은 줄기 뒤 가로 한 면의 그늘. 깊이는 줄기 간격으로만.',
        '🔴 주황 #D4622A 은 다섯 아이가 하나씩 지닌 물건에만 쓴다 — 메이 목도리·루디 앞치마 주머니·삐노 장화·소소 리본·레오 목깃. 그 밖에는 절대 쓰지 않는다.',
        '화면비 16:9 스프레드. 사실적 렌더링·수채·3D·펠트 아님. 그림 안에 글자·말풍선·문자를 절대 넣지 않는다.',
      ].join(' ') },
  };

  var ANCHOR_KEY = 'A';
  var ANCHOR = ANCHORS.A;
  var STYLE_PROMPT = ANCHOR.ko;

  // ── 고정 캐스트 6인 — 배치에서 항상 @image1..6 (순서 고정, 전 회차 공통) ──
  var FIXED_CHARS = [
    { key: 'mei', name: '메이', aliases: ['메이', 'Mei'],
      desc: '아기 염소 — 흰 몸, 짧은 뿔 두 개, 늘어진 귀. 다섯 중 제일 작다. 겁이 많아 어깨가 자주 움츠러들어 있다. 🔴 주황 목도리 하나.' },
    { key: 'rudi', name: '루디', aliases: ['루디', 'Rudi'],
      desc: '다람쥐 — 등 뒤로 말려 올라간 큼직한 꼬리 하나가 실루엣을 만든다. 앞치마를 둘렀고 🔴 앞치마 주머니가 주황.' },
    { key: 'ppino', name: '삐노', aliases: ['삐노', 'Ppino'],
      desc: '토끼 — 곧게 선 긴 귀 두 개. 아이들 중 제일 키가 크다. 늘 앞으로 기울어진 자세. 🔴 주황 장화.' },
    { key: 'soso', name: '소소', aliases: ['소소', 'Soso'],
      desc: '고슴도치 — 짧은 가시가 덮인 낮고 둥근 등. 손을 앞으로 모으고 있다. 🔴 머리에 주황 리본.' },
    { key: 'leo', name: '레오', aliases: ['레오', 'Leo'],
      desc: '여우 — 뾰족한 주둥이와 길게 뻗은 꼬리 하나. 턱을 든 자세. 🔴 주황 목깃.' },
    // 🔴 SCENE 이 실제로 쓰는 토큰까지 넣는다 — 'Grandmother Bear' 만 뒀더니 04·05 p8 에서 할머니가 [등장]에서 빠졌다.
    { key: 'granny', name: '곰 할머니', aliases: ['곰 할머니', '할머니', 'Bear granny', 'granny', 'Grandmother Bear'],
      desc: '큰 곰 — 아이 키의 두 배, 전체가 둥글다. 산장 주인이자 이 마을의 유일한 어른. 🔴 주황색을 하나도 지니지 않는다. 아이들이 하던 그 일을 같이 하고 있는 모습으로만 등장한다.' },
  ];

  var GUESTS = (window.SH_GUESTS || []).slice(); // 화별 단역 → @image9~
  var ALL = FIXED_CHARS.concat(GUESTS);
  ALL.forEach(function (c, i) { c.img = i < 6 ? i + 1 : i + 3; }); // 1..6 고정, 9~ 단역
  var IS_GUEST = {}; GUESTS.forEach(function (g) { IS_GUEST[g.key] = true; });
  var FACE = { mei: '🐐', rudi: '🐿️', ppino: '🐰', soso: '🦔', leo: '🦊', granny: '🐻' };

  function sceneHasChar(sceneText, c) {
    var s = sceneText.toLowerCase();
    return (c.aliases || [c.name]).some(function (n) { return s.indexOf(n.toLowerCase()) !== -1; });
  }

  function composeBatchPrompt(pages) {
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
      '[캐릭터 레퍼런스] 아래 @imageN 순서대로 레퍼런스 이미지를 첨부하세요. 얼굴·비율·색은 @imageN 시트와 100% 동일하게 유지합니다. @image1~6 = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
      legend,
      '🔴 표정은 입 곡선과 눈썹 두 획으로만 만든다. 눈은 뜨거나 감기만 하고 크기는 절대 안 변한다. 얼굴을 사물이 가로지르지 않는다.',
      '※ 각 쪽 [등장]에 적힌 @imageN 캐릭터만 그 컷에 그린다. 나머지는 넣지 않는다.',
      '',
      '[출력 규칙]',
      '- 아래 ' + pages.length + '개 장면을 각각 독립된 16:9 스프레드 일러스트로 그린다 (총 ' + pages.length + '장, 쪽 순서대로).',
      '- 같은 캐릭터의 얼굴·비율·색은 모든 장면에서 동일하게 유지한다.',
      '- 그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않는다.',
    ].join('\n');

    var body = pages.map(function (p) {
      var on = ALL.filter(function (c) { return sceneHasChar(p.scene, c); });
      var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
      return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경/사물 컷)') + '\n' + p.scene.trim();
    }).join('\n\n');

    return head + '\n\n' + body;
  }

  // 캐릭터 한 명의 시트 프롬프트. 고정 캐스트·단역 공용 — 기획서 카드도 이걸 부른다(사본 금지).
  function sheetPrompt(charOrKey) {
    var g = typeof charOrKey === 'string'
      ? ALL.find(function (c) { return c.key === charOrKey; })
      : charOrKey;
    if (!g) return '';
    return [
      STYLE_PROMPT,
      '',
      '[출력] 정사각 1024x1024. 배경은 순수 마젠타 #FF00FF 단색, 캐릭터를 가운데 두고 여백 8%. 바닥 그림자 없음, 글자·라벨 없음, 다른 캐릭터 없음.',
      '[캐릭터] ' + g.name + ' — ' + g.desc,
      '🔴 표정은 입 곡선과 눈썹 두 획으로만 만든다. 눈은 뜨거나 감기만 하고 크기는 절대 안 변한다.',
      '[배치] 같은 캐릭터를 한 장에 — 전신 정면, 3/4 걷는 모습, 뒷모습. 이 캐릭터 하나만.',
    ].join('\n');
  }
  var guestSheetPrompt = sheetPrompt;

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
  // ── 붙여넣기 박스 (회차 쪽·단역·기획서 공용) ──
  function makePasteBox(assetApi, key, initialUrl) {
    var box = document.createElement('div'); box.className = 'paste-box'; box.tabIndex = 0;
    var hint = '🖼️ 클릭 후 Ctrl+V — 생성한 그림 붙여넣기';
    function reset() { box.classList.remove('has-img'); box.innerHTML = ''; box.textContent = hint; }
    function setImg(url) {
      box.classList.add('has-img');
      box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del">✕</button>';
      box.querySelector('.paste-del').addEventListener('click', async function (e) {
        e.stopPropagation(); if (!confirm('이 이미지를 삭제할까요?')) return;
        try { await fetch(assetApi + '/' + key, { method: 'DELETE' }); reset(); } catch (err) { alert('삭제 실패 — 서버(3500) 확인'); }
      });
    }
    if (initialUrl) setImg(initialUrl + '?t=' + Date.now()); else box.textContent = hint;
    async function upload(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      box.classList.add('busy'); var fr = new FileReader();
      fr.onload = async function () {
        try {
          var r2 = await fetch(assetApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, dataUrl: fr.result }) });
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

  // 기획서에서 쓴다: [data-paste="key"] 를 전부 붙여넣기 박스로 만든다 (fetch 1회)
  async function mountPasteSlots(docId, root) {
    var api = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(api); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-paste]'), function (slot) {
      var key = slot.getAttribute('data-paste');
      slot.appendChild(makePasteBox(api, key, assets[key]));
    });
  }

  window.MEI = {
    copyText: copyText, anchors: ANCHORS, cast: FIXED_CHARS,
    sheetPrompt: sheetPrompt, mountPasteSlots: mountPasteSlots,
  };

  // ── 좌측 회차 사이드바 (상태·메모는 /api/saenghwal-* 공유, docId 가 달라 무충돌) ──
  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 회차';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML =
      '<div class="ep-head"><b>회차 목록</b><span id="ep-summary"></span>' +
      '<button id="ep-close" type="button" aria-label="닫기">✕</button></div>' +
      '<a class="ep-plan" href="/mei-plan.html">📘 기획서 · 캐스트 시트 · 앵커</a>' +
      '<div id="ep-list"></div>';
    document.body.appendChild(toggle);
    document.body.appendChild(backdrop);
    document.body.appendChild(side);
    var list = side.querySelector('#ep-list');
    var summary = side.querySelector('#ep-summary');
    function open(o) { document.body.classList.toggle('ep-open', o); }
    toggle.addEventListener('click', function () { open(!document.body.classList.contains('ep-open')); });
    backdrop.addEventListener('click', function () { open(false); });
    side.querySelector('#ep-close').addEventListener('click', function () { open(false); });

    var STATUS_API = '/api/saenghwal-status';
    var status = {};
    try { var rs = await fetch(STATUS_API); var jss = await rs.json(); status = (jss && jss.data) || {}; } catch (e) {}
    var MEMO_API = '/api/saenghwal-memo';
    var memo = {};
    try { var rm = await fetch(MEMO_API); var jm = await rm.json(); memo = (jm && jm.data) || {}; } catch (e) {}

    var modal = document.createElement('div'); modal.id = 'ep-memo-modal';
    modal.innerHTML = '<div class="box"><div class="mhead"></div>' +
      '<textarea placeholder="이 회차 메모…"></textarea>' +
      '<div class="mrow"><button class="cancel" type="button">취소</button><button class="save" type="button">저장</button></div></div>';
    document.body.appendChild(modal);
    var mHead = modal.querySelector('.mhead');
    var mTa = modal.querySelector('textarea');
    var cur = null;
    function closeModal() { modal.classList.remove('on'); cur = null; }
    function openMemo(docId, title, onSaved) {
      cur = { docId: docId, onSaved: onSaved };
      mHead.textContent = title;
      mTa.value = memo[docId] || '';
      modal.classList.add('on');
      setTimeout(function () { mTa.focus(); }, 30);
    }
    modal.querySelector('.cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelector('.save').addEventListener('click', async function () {
      if (!cur) return;
      var docId = cur.docId, onSaved = cur.onSaved, text = mTa.value, prev = memo[docId] || '';
      if (text.trim()) memo[docId] = text; else delete memo[docId];
      if (onSaved) onSaved(!!text.trim());
      closeModal();
      try {
        var r = await fetch(MEMO_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId: docId, memo: text }) });
        if (!r.ok) throw new Error('http');
      } catch (err) {
        if (prev) memo[docId] = prev; else delete memo[docId];
        if (onSaved) onSaved(!!prev);
        alert('메모 저장 실패 — 서버 확인');
      }
    });

    var idx = [];
    try { var ri = await fetch('/mei-index.json'); idx = await ri.json(); } catch (e) {}
    var eps = idx
      .filter(function (e) { return e.file && e.file !== 'mei-plan.html'; })
      .map(function (e) {
        var m = (e.label || '').match(/(\d+)/);
        return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || (e.label || '').replace(/^\s*\d+\s*/, '') };
      })
      .sort(function (a, b) { return a.num - b.num; });

    var here = location.pathname.split('/').pop() || '';
    if (here === 'mei-plan.html' || here === '') {
      var pl = side.querySelector('.ep-plan'); if (pl) pl.classList.add('active');
    }
    var CYCLE = { '': 'wip', 'wip': 'done', 'done': '' };
    var ICON = { '': '⬜', 'wip': '🟡', 'done': '✅' };
    var LABEL = { '': '미정', 'wip': '진행 중', 'done': '완성' };
    function updateSummary() {
      var d = 0, w = 0;
      eps.forEach(function (e) { var s = status[e.docId] || ''; if (s === 'done') d++; else if (s === 'wip') w++; });
      summary.textContent = '✅ ' + d + ' · 🟡 ' + w + ' / ' + eps.length;
    }
    eps.forEach(function (e) {
      var s = status[e.docId] || '';
      var row = document.createElement('div');
      row.className = 'ep-item' + (e.file === here ? ' active' : '') + (s === 'done' ? ' done' : '');
      var n = document.createElement('span'); n.className = 'n'; n.textContent = e.num;
      var a = document.createElement('a'); a.href = e.file; a.textContent = e.title;
      var mbtn = document.createElement('button');
      mbtn.type = 'button'; mbtn.className = 'ep-memo' + (memo[e.docId] ? ' has' : ''); mbtn.textContent = '📝';
      mbtn.title = (memo[e.docId] ? '메모 있음' : '메모 없음') + ' (클릭하여 편집)';
      mbtn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        openMemo(e.docId, e.title, function (has) {
          mbtn.classList.toggle('has', has);
          mbtn.title = (has ? '메모 있음' : '메모 없음') + ' (클릭하여 편집)';
        });
      });
      var badge = document.createElement('button');
      badge.type = 'button'; badge.className = 'ep-badge'; badge.textContent = ICON[s]; badge.title = LABEL[s] + ' (클릭하여 변경)';
      badge.addEventListener('click', async function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var prev = status[e.docId] || '';
        var next = CYCLE[prev];
        if (next) status[e.docId] = next; else delete status[e.docId];
        badge.textContent = ICON[next]; badge.title = LABEL[next] + ' (클릭하여 변경)';
        row.classList.toggle('done', next === 'done'); updateSummary();
        try {
          var r = await fetch(STATUS_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId: e.docId, status: next }) });
          if (!r.ok) throw new Error('http');
        } catch (err) {
          if (prev) status[e.docId] = prev; else delete status[e.docId];
          badge.textContent = ICON[prev]; badge.title = LABEL[prev] + ' (클릭하여 변경)';
          row.classList.toggle('done', prev === 'done'); updateSummary();
          alert('상태 저장 실패 — 서버 확인');
        }
      });
      row.appendChild(n); row.appendChild(a); row.appendChild(mbtn); row.appendChild(badge);
      list.appendChild(row);
    });
    updateSummary();
    if (window.innerWidth >= 1024) open(true);
  })();

  // ── 전체 묶음 프롬프트 바 + 쪽별 복사 + 붙여넣기 ──
  (async function () {
    var pages = collectPages();
    if (!pages.length) return;

    var anchorEl = document.querySelector('header.hero');
    if (anchorEl) {
      var bar = document.createElement('div');
      bar.className = 'batch-bar';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에<span class="anchor-chip">앵커 ' + ANCHOR_KEY + ' · ' + ANCHOR.name + '</span></div>' +
        '<div class="bhint">버튼을 누르면 <b>이 권의 앵커(1회) + 캐릭터 레퍼런스(@image1~6) + ' + pages.length + '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 캐스트 시트를 첨부</b>하세요(메이·루디·삐노·소소·레오·곰 할머니). 각 쪽 [등장]이 그 컷에 넣을 캐릭터를 지정합니다.</div>' +
        '<div class="brow"><button type="button" class="batch-btn" id="copy-all-scene">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      anchorEl.parentNode.insertBefore(bar, anchorEl.nextSibling);
      document.getElementById('copy-all-scene').addEventListener('click', function () {
        copyText(composeBatchPrompt(pages.map(function (p) { return { label: p.label, scene: p.scene }; })), this);
      });
    }

    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (btn) {
        var clone = btn.cloneNode(true); btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener('click', function () {
          copyText(composeBatchPrompt([{ label: p.label, scene: p.scene }]), clone);
        });
      }
    });

    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var ASSET_API = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(ASSET_API); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}

    // ── 이 화 등장 캐릭터 스트립 (고정캐스트=기획서 저장분, 단역=이 화 저장분) ──
    (function () {
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
      fetch('/api/comic-assets/mei-plan').then(function (r) { return r.json(); }).then(function (j) {
        var planAssets = (j && j.data) || {};
        appearing.forEach(function (c) {
          if (IS_GUEST[c.key] || !planAssets[c.key]) return;
          var box = strip.querySelector('.ref-chip[data-key="' + c.key + '"]');
          if (!box) return;
          var ph = box.querySelector('.ph');
          if (ph) ph.outerHTML = '<img src="' + planAssets[c.key] + '?t=' + Date.now() + '" alt="" />';
        });
      }).catch(function () {});
    })();

    var createPasteBox = function (key) { return makePasteBox(ASSET_API, key, assets[key]); };
    pages.forEach(function (p) { p.card.appendChild(createPasteBox(p.page)); });

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
        '<div class="ghint">이 화에만 나오는 단역입니다(@image9~). ① [시트 프롬프트 복사] → GPT에 넣어 시트 생성 → ② 아래 박스에 붙여넣어 확정하세요. <b>@image1~6 고정 캐스트 시트는 📘 기획서에서.</b></div>' +
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

/* 본문 인라인 편집 — 각 쪽 본문을 브라우저에서 고쳐 R2 에 저장한다.
 * 🔴 SSOT 는 docs/changjak-books/mei/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 때는 이 오버레이부터 확인해야 한다.
 * 저장 = PUT /api/changjak-text/<docId> {page,text} · 로드 = GET → {p1:text,…} · 빈 값이면 원본 복귀. */
(function () {
  var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (!/^mei-\d+$/.test(docId)) return;
  var API = '/api/changjak-text/' + docId;

  var st = document.createElement('style');
  st.textContent =
    '.page-card p.ko{outline:none;border-radius:8px;margin:8px -6px 10px;padding:4px 6px;transition:background .12s}' +
    '.page-card p.ko:hover{background:#fff6ec}' +
    '.page-card p.ko:focus{background:#fff6ec;box-shadow:0 0 0 2px #ffc7b0}' +
    '.page-card{position:relative}' +
    '.ko-tag{position:absolute;top:14px;right:16px;font-size:10.5px;font-weight:800;opacity:0;transition:opacity .15s;pointer-events:none}' +
    '.ko-tag.on{opacity:1}' +
    '.ko-tag.saving{color:var(--ink-soft)}.ko-tag.saved{color:var(--slope)}.ko-tag.err{color:var(--accent)}' +
    '.ko-edited{border-color:var(--accent)}' +
    '.edit-hint{background:#fff6f2;border:1px solid var(--accent);border-radius:12px;padding:11px 15px;font-size:12.5px;margin:14px 0}';
  document.head.appendChild(st);

  var hint = document.createElement('div');
  hint.className = 'edit-hint';
  hint.innerHTML = '✏️ <b>본문을 눌러 바로 고칠 수 있습니다.</b> 고친 내용은 R2 에 저장되어 이 화면에만 얹힙니다 — ' +
    '<b>원고 파일(.md)은 안 바뀝니다.</b> 되돌리려면 내용을 비우고 화면을 벗어나세요.';

  var cards = Array.prototype.slice.call(document.querySelectorAll('.page-card[data-page]'));
  if (!cards.length) return;
  cards[0].parentNode.insertBefore(hint, cards[0]);

  var items = cards.map(function (card) {
    var ko = card.querySelector('p.ko');
    if (!ko) return null;
    var page = card.dataset.page;
    var base = ko.innerText.replace(/\s+$/, '');
    var tag = document.createElement('span');
    tag.className = 'ko-tag';
    card.appendChild(tag);
    ko.contentEditable = 'plaintext-only';

    var timer = null, saved = base;
    function flash(cls, txt) {
      tag.className = 'ko-tag on ' + cls; tag.textContent = txt;
      if (cls !== 'saving') setTimeout(function () { tag.className = 'ko-tag'; }, 1600);
    }
    function save() {
      var text = ko.innerText.replace(/\s+$/, '');
      if (text === saved) return;
      flash('saving', '저장 중…');
      fetch(API, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: page, text: text === base ? '' : text })
      }).then(function (r) {
        if (!r.ok) throw new Error('http');
        saved = text;
        card.classList.toggle('ko-edited', text !== base);
        flash('saved', text === base ? '원본 복귀' : '저장됨');
      }).catch(function () { flash('err', '저장 실패 — 서버 확인'); });
    }
    ko.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(save, 900); });
    ko.addEventListener('blur', function () { clearTimeout(timer); save(); });
    return { page: page, ko: ko, card: card, base: base, apply: function (t) {
      ko.innerText = t; saved = t; card.classList.add('ko-edited');
    } };
  }).filter(Boolean);

  fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    var d = (j && j.data) || {};
    var n = 0;
    items.forEach(function (it) { if (typeof d[it.page] === 'string' && d[it.page] !== '') { it.apply(d[it.page]); n++; } });
    if (n) hint.innerHTML = '✏️ <b>이 화면의 ' + n + '쪽은 여기서 고친 내용입니다</b> — 원고 파일(.md)과 다릅니다. ' +
      '원고를 고칠 때는 이 오버레이를 먼저 확인하세요. 되돌리려면 그 쪽을 비우고 화면을 벗어나세요.';
  }).catch(function () {});
})();

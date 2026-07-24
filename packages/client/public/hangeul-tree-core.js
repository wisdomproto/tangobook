/*
 * hangeul-tree-core.js — 「한글 나무 · 호리네 파닉스 동화」 공용 스크립트 (jeonrae/saenghwal 포크)
 * 기획서·회차 HTML 하단에 <script src="/hangeul-tree-core.js"></script> 로 include.
 * 기능:
 *   ① 좌측 슬라이드 사이드바 — hangeul-tree-index.json 기반 유닛 목록 + 완성/진행 배지(R2) + 메모(R2).
 *      상태·메모는 saenghwal 라우트 공유(docId=파일명이라 무충돌): /api/saenghwal-{status,memo}
 *   ② window.HT_EPISODE={cast:[...]} 정의된 회차 → 전체/쪽별 이미지 프롬프트 복사 + 컷 붙여넣기(R2).
 *      니들펠트 스타일은 이 core 에 SSOT(STYLE_PROMPT)로 박아둠 — 변경 시 이 블록만 교체하면 전 회차 반영.
 */
(function () {
  'use strict';

  // ── 🔴 STYLE SSOT — 그림체 = 니들펠트(생활동화와 동일). 단, 한글 학습책이라 글자/타겟단어는 그리게 허용 ──
  var STYLE_PROMPT = [
    '[스타일] 한글 나무 · 호리네 파닉스 동화 — 4~5세 유아 한글 학습 그림책. 그림체 = 니들펠트(양모 인형) 스톱모션 룩 (needle-felted wool plush, handmade felt stop-motion diorama).',
    '보송보송한 양모 펠트 섬유 질감이 살아있는 폭신한 3D 인형 캐릭터, 통통하고 둥글둥글한 형태, 부드러운 스튜디오 조명과 은은한 실제 그림자, 밝고 채도 높은 색감.',
    '슈퍼-디폼드 치비 비율(머리≈몸통 1.3배, 짧고 통통한 팔다리, 크고 둥근 눈, 분홍 볼터치). 배경도 펠트·천·미니어처로 만든 듯한 아기자기한 디오라마. 중심 배경 = 커다란 한글 나무(펠트 잎·열매).',
    '화면비 16:9 스프레드. 평면 2D 아님·그림물감 아님·매끈한 CG/클레이 아님 — 양모 섬유 질감이 반드시 보여야 함 (visible wool-felt fibers).',
    '🔴 이 책은 한글 학습책이라, 오늘의 글자와 타겟 단어는 SCENE 지시대로 나무 열매 표면·나뭇잎 글자판 위에 또렷한 한글(니들펠트 자수/펠트 글자 느낌)로 그린다. 그 외의 임의 문자·말풍선·설명 캡션은 넣지 않고, 상단에 캡션용 여백을 남긴다.',
  ].join(' ');

  (function injectCss() {
    if (document.getElementById('ht-core-style')) return;
    var css = [
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--leaf,#3f8f52);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:var(--paper,#fff);z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line,#e6dccb);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}',
      '#ep-summary{font-size:12px;color:var(--ink-soft,#6b5b4a);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft,#6b5b4a);padding:2px 4px;}',
      '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-plan{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:2px solid var(--line,#e6dccb);background:var(--leaf-50,#eaf5ec);}',
      '.ep-plan a{flex:1;color:var(--leaf-dark,#2f6b3d);text-decoration:none;font-size:13.5px;font-weight:800;}',
      '.ep-plan a:hover{text-decoration:underline;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1ece0;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft,#6b5b4a);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink,#2c2015);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--apple,#e0533b);text-decoration:underline;}',
      '.ep-item.active a{color:var(--apple,#e0533b);font-weight:800;}',
      '.ep-item.done a{text-decoration:line-through;color:var(--ink-soft,#6b5b4a);}',
      '.ep-badge{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:15px;line-height:1;padding:3px;border-radius:6px;}',
      '.ep-badge:hover{background:#f1ece0;}',
      '.ep-memo{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:14px;line-height:1;padding:3px;border-radius:6px;opacity:.35;}',
      '.ep-memo:hover{background:#f1ece0;opacity:.75;}',
      '.ep-memo.has{opacity:1;}',
      '#ep-memo-modal{position:fixed;inset:0;z-index:1003;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;padding:16px;}',
      '#ep-memo-modal.on{display:flex;}',
      '#ep-memo-modal .box{background:var(--paper,#fff);border-radius:14px;width:min(480px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;}',
      '#ep-memo-modal .mhead{padding:14px 16px;border-bottom:1px solid var(--line,#e6dccb);font-weight:800;font-size:15px;color:var(--ink,#2c2015);word-break:keep-all;}',
      '#ep-memo-modal textarea{border:0;outline:none;resize:none;padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.6;min-height:180px;flex:1;color:var(--ink,#2c2015);background:var(--paper,#fff);}',
      '#ep-memo-modal .mrow{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line,#e6dccb);}',
      '#ep-memo-modal button{border:0;border-radius:9px;padding:9px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '#ep-memo-modal .save{background:var(--leaf,#3f8f52);color:#fff;}',
      '#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft,#6b5b4a);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
      '.ht-batch{background:var(--paper,#fff);border:1.5px solid var(--mint,#3f8f52);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.ht-batch .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.ht-batch .bhint{font-size:12px;color:var(--ink-soft,#6b5b4a);margin-bottom:12px;line-height:1.6;}',
      '.ht-batch .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.ht-batch-btn{background:var(--leaf,#3f8f52);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.ht-batch-btn:hover{background:var(--leaf-dark,#2f6b3d);}',
      '.ht-batch-btn.done{background:var(--apple,#e0533b);}',
      '.ref-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;background:#fff;border:1.5px solid var(--line,#e6dccb);border-radius:12px;padding:8px 12px;margin:0 0 22px;}',
      '.ref-strip .ref-lab{font-size:11.5px;font-weight:800;color:var(--ink-soft,#6b5b4a);flex:0 0 auto;margin-right:2px;}',
      '.ref-chip{display:flex;align-items:center;gap:6px;background:var(--cream,#fbf7ef);border:1px solid var(--line,#e6dccb);border-radius:999px;padding:3px 11px 3px 3px;}',
      '.ref-chip img{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#fff;flex:0 0 auto;}',
      '.ref-chip .ph{width:30px;height:30px;border-radius:50%;background:var(--peach,#ffe9d6);display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;}',
      '.ref-chip b{font-size:11.5px;font-weight:800;color:var(--ink,#2c2015);white-space:nowrap;}',
      '.ref-chip .im{color:var(--leaf-dark,#2f6b3d);font-weight:900;}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'ht-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ── ① 사이드바 (유닛 네비 + 상태/메모) ──
  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 유닛';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML =
      '<div class="ep-head"><b>한글 나무 유닛</b><span id="ep-summary"></span>' +
      '<button id="ep-close" type="button" aria-label="닫기">✕</button></div><div id="ep-list"></div>';
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
      '<textarea placeholder="이 유닛 메모…"></textarea>' +
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
    try { var ri = await fetch('/hangeul-tree-index.json'); idx = await ri.json(); } catch (e) {}

    var planEntry = idx.filter(function (e) { return e.file === 'hangeul-tree-plan.html'; })[0];
    if (planEntry) {
      var prow = document.createElement('div'); prow.className = 'ep-plan';
      var pa = document.createElement('a'); pa.href = planEntry.file; pa.textContent = planEntry.label || '📘 기획서';
      prow.appendChild(pa); list.appendChild(prow);
    }

    var eps = idx
      .filter(function (e) { return e.file && e.file !== 'hangeul-tree-plan.html'; })
      .map(function (e) {
        var m = (e.label || '').match(/(\d+)/);
        return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || (e.label || '').replace(/^\s*\d+\s*/, '') };
      })
      .sort(function (a, b) { return a.num - b.num; });

    var here = location.pathname.split('/').pop() || '';
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

  // ── ② 회차 이미지 프롬프트 도구 (window.HT_EPISODE 정의된 회차) ──
  (async function () {
    var ep = window.HT_EPISODE;
    if (!ep) return;
    var pageCards = document.querySelectorAll('.page-card[data-page]');
    if (!pageCards.length) return;
    var cast = (ep.cast || []).slice();
    cast.forEach(function (c, i) { c.img = i + 1; });
    var style = ep.style || STYLE_PROMPT;

    function flash(btn, label) {
      var orig = btn.getAttribute('data-orig') || btn.textContent;
      btn.setAttribute('data-orig', orig);
      btn.textContent = label; btn.classList.add('done');
      setTimeout(function () { btn.textContent = orig; btn.classList.remove('done'); }, 1600);
    }
    async function copyText(text, btn) {
      try { await navigator.clipboard.writeText(text); flash(btn, '복사됨 ✓'); }
      catch (e) { window.prompt('복사가 막혔어요 — 직접 복사하세요:', text); }
    }
    function sceneOf(card) { var pre = card.querySelector('pre.scene'); return pre ? (pre.innerText || pre.textContent) : ''; }
    function labelOf(card) {
      var pnum = card.querySelector('.pnum'); var b = card.querySelector('.page-head b');
      return ((pnum ? pnum.textContent.trim() + ' ' : '') + (b ? b.textContent.trim() : card.getAttribute('data-page'))).trim();
    }
    function hasChar(scene, c) {
      var s = scene.toLowerCase();
      return (c.aliases || [c.token || c.name]).some(function (n) { return s.indexOf(String(n).toLowerCase()) !== -1; });
    }
    var pages = Array.prototype.map.call(pageCards, function (card) {
      return { card: card, page: card.getAttribute('data-page'), label: labelOf(card), scene: sceneOf(card) };
    });

    function compose(subset) {
      var appearsAny = {};
      cast.forEach(function (c) { appearsAny[c.img] = subset.some(function (p) { return hasChar(p.scene, c); }); });
      var legend = cast.map(function (c) {
        return '@image' + c.img + ' = ' + c.name + ': ' + (c.desc || '') + (appearsAny[c.img] ? '' : '  (이 배치 미등장 — 첨부 불필요)');
      }).join('\n');
      var head = [
        style,
        '',
        '[캐릭터 레퍼런스] 아래 @imageN 순서대로 니들펠트 레퍼런스 시트를 첨부하세요. 얼굴·헤어·비율·색을 @imageN 시트와 100% 동일하게 유지합니다. @image1~ = 이 유닛 등장인물(호리 고정 + 로테이션).',
        legend,
        '※ 각 쪽 [등장]에 적힌 @imageN 캐릭터만 그 컷에 그린다.',
        '',
        '[출력 규칙]',
        '- 아래 ' + subset.length + '개 장면을 각각 독립된 16:9 스프레드 일러스트로 그린다 (총 ' + subset.length + '장, 쪽 순서대로).',
        '- 같은 캐릭터의 얼굴·머리·비율·색은 모든 장면에서 동일하게 유지한다.',
        '- 오늘의 글자·타겟 단어는 SCENE 지시대로 나무 열매·나뭇잎에 또렷한 한글로 그리되, 그 외 임의 문자·말풍선·캡션은 넣지 않는다.',
      ].join('\n');
      var body = subset.map(function (p) {
        var on = cast.filter(function (c) { return hasChar(p.scene, c); });
        var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
        return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경 컷)') + '\n' + p.scene.trim();
      }).join('\n\n');
      return head + '\n\n' + body;
    }

    // 전체 묶음 바 (meta-card 뒤 또는 hero 뒤)
    var anchor = document.querySelector('.meta-card') || document.querySelector('header.hero');
    if (anchor && anchor.parentNode) {
      var bar = document.createElement('div');
      bar.className = 'ht-batch';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에</div>' +
        '<div class="bhint">버튼을 누르면 <b>니들펠트 스타일 + 등장인물 레퍼런스(@image1~) + ' + pages.length + '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 니들펠트 레퍼런스 시트를 첨부</b>하세요(기획서 저장분). 각 쪽 [등장]이 그 컷에 넣을 캐릭터를 지정합니다.</div>' +
        '<div class="brow"><button type="button" class="ht-batch-btn" id="ht-copy-all">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      document.getElementById('ht-copy-all').addEventListener('click', function () { copyText(compose(pages), this); });
    }

    // ── 🎬 이 화 등장 캐릭터 레퍼런스 한 줄 스트립 (고정 캐스트 = 기획서 saenghwal-plan 저장분 재사용) ──
    (function () {
      var NAME2KEY = { '호리': 'hori', '토토': 'toto', '보리': 'bori', '콩이': 'kongi', '두부': 'dubu', '호야': 'hoya', '엄마': 'mom', '아빠': 'dad' };
      var FACE = { hori: '🐯', toto: '🐰', bori: '🐻', kongi: '🐿️', dubu: '🐶', hoya: '🍼', mom: '🐯', dad: '🐯' };
      if (!cast.length) return;
      cast.forEach(function (c) { c.refKey = NAME2KEY[c.name] || NAME2KEY[c.token]; });
      var strip = document.createElement('div');
      strip.className = 'ref-strip';
      strip.innerHTML = '<span class="ref-lab">🎬 이 화 등장</span>' +
        cast.map(function (c) {
          return '<div class="ref-chip" data-ref="' + (c.refKey || '') + '" title="' + (c.desc || '').replace(/"/g, '') + '">' +
            '<span class="ph">' + (FACE[c.refKey] || '🎭') + '</span>' +
            '<b><span class="im">@image' + c.img + '</span> ' + c.name + '</b></div>';
        }).join('');
      var firstPageEl = pages[0] && pages[0].card;
      if (firstPageEl && firstPageEl.parentNode) firstPageEl.parentNode.insertBefore(strip, firstPageEl);
      // 고정 캐스트 이미지는 기획서(saenghwal-plan) 저장분을 비동기로 채워 넣는다
      fetch('/api/comic-assets/saenghwal-plan').then(function (r) { return r.json(); }).then(function (j) {
        var plan = (j && j.data) || {};
        cast.forEach(function (c) {
          if (!c.refKey || !plan[c.refKey]) return;
          var box = strip.querySelector('.ref-chip[data-ref="' + c.refKey + '"] .ph');
          if (box) box.outerHTML = '<img src="' + plan[c.refKey] + '?t=' + Date.now() + '" alt="" />';
        });
      }).catch(function () {});
    })();

    // 쪽별 복사 버튼
    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (btn) { var c2 = btn.cloneNode(true); btn.parentNode.replaceChild(c2, btn); c2.addEventListener('click', function () { copyText(compose([p]), c2); }); }
    });

    // 컷 붙여넣기 (page data-page) → R2 comic-assets/{docId}
    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var ASSET_API = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(ASSET_API); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}
    function createPasteBox(key, hint) {
      var box = document.createElement('div'); box.className = 'paste-box'; box.tabIndex = 0;
      hint = hint || '🖼️ 클릭 후 Ctrl+V — 이미지 붙여넣기';
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
    pages.forEach(function (p) { p.card.appendChild(createPasteBox(p.page, '🖼️ 클릭 후 Ctrl+V — 생성한 컷 붙여넣기')); });
  })();
})();

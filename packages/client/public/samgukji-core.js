/*
 * samgukji-core.js — 탱고북 삼국지 공용 스크립트 (경량: 회차 네비게이션 전용)
 * 기획서·회차 HTML 하단에 <script src="/samgukji-core.js"></script> 로 include.
 * 기능: 좌측 슬라이드 사이드바(☰ 회차) — samgukji-index.json 기반 회차 목록 + 완성/진행 상태 배지(R2) + 메모(R2).
 *   상태·메모는 saenghwal 라우트를 공유(docId=파일명이라 무충돌): /api/saenghwal-{status,memo}
 * 회차의 이미지 프롬프트 복사·붙여넣기는 각 회차 파일의 인라인 스크립트가 담당(이 core는 관여 안 함).
 */
(function () {
  'use strict';

  (function injectCss() {
    if (document.getElementById('sg-core-style')) return;
    var css = [
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--jade,#1f7a6d);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:var(--paper,#fffdf7);z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line,#e7dcc6);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}',
      '#ep-summary{font-size:12px;color:var(--ink-soft,#6d645a);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft,#6d645a);padding:2px 4px;}',
      '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-plan{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:2px solid var(--line,#e7dcc6);background:var(--sky,#eaf3ef);}',
      '.ep-plan a{flex:1;color:var(--jade-dark,#145c52);text-decoration:none;font-size:13.5px;font-weight:800;}',
      '.ep-plan a:hover{text-decoration:underline;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1ece0;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft,#6d645a);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink,#2a2620);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--vermilion,#cf4b34);text-decoration:underline;}',
      '.ep-item.active a{color:var(--vermilion,#cf4b34);font-weight:800;}',
      '.ep-item.done a{text-decoration:line-through;color:var(--ink-soft,#6d645a);}',
      '.ep-badge{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:15px;line-height:1;padding:3px;border-radius:6px;}',
      '.ep-badge:hover{background:#f1ece0;}',
      '.ep-memo{flex:0 0 auto;cursor:pointer;border:0;background:transparent;font-size:14px;line-height:1;padding:3px;border-radius:6px;opacity:.35;}',
      '.ep-memo:hover{background:#f1ece0;opacity:.75;}',
      '.ep-memo.has{opacity:1;}',
      '#ep-memo-modal{position:fixed;inset:0;z-index:1003;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;padding:16px;}',
      '#ep-memo-modal.on{display:flex;}',
      '#ep-memo-modal .box{background:var(--paper,#fffdf7);border-radius:14px;width:min(480px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;}',
      '#ep-memo-modal .mhead{padding:14px 16px;border-bottom:1px solid var(--line,#e7dcc6);font-weight:800;font-size:15px;color:var(--ink,#2a2620);word-break:keep-all;}',
      '#ep-memo-modal textarea{border:0;outline:none;resize:none;padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.6;min-height:180px;flex:1;color:var(--ink,#2a2620);background:var(--paper,#fffdf7);}',
      '#ep-memo-modal .mrow{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line,#e7dcc6);}',
      '#ep-memo-modal button{border:0;border-radius:9px;padding:9px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '#ep-memo-modal .save{background:var(--jade,#1f7a6d);color:#fff;}',
      '#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft,#6d645a);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
      // ── 회차 전체 프롬프트 바 ──
      '.sg-batch{background:var(--paper,#fffdf7);border:1.5px solid var(--mint,#2fa38f);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.sg-batch .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.sg-batch .bhint{font-size:12px;color:var(--ink-soft,#6d645a);margin-bottom:12px;line-height:1.6;}',
      '.sg-batch .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.sg-batch-btn{background:var(--jade,#1f7a6d);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.sg-batch-btn:hover{background:var(--jade-dark,#145c52);}',
      '.sg-batch-btn.done{background:var(--vermilion,#cf4b34);}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'sg-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 회차';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML =
      '<div class="ep-head"><b>삼국지 회차</b><span id="ep-summary"></span>' +
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
    try { var ri = await fetch('/samgukji-index.json'); idx = await ri.json(); } catch (e) {}

    // 📘 기획서 링크 (항상 상단)
    var planEntry = idx.filter(function (e) { return e.file === 'samgukji-plan.html'; })[0];
    if (planEntry) {
      var prow = document.createElement('div'); prow.className = 'ep-plan';
      var pa = document.createElement('a'); pa.href = planEntry.file; pa.textContent = planEntry.label || '📘 기획서';
      prow.appendChild(pa); list.appendChild(prow);
    }

    var eps = idx
      .filter(function (e) { return e.file && e.file !== 'samgukji-plan.html'; })
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

  // ── 회차 이미지 프롬프트 도구 (window.SG_EPISODE 정의된 회차에서만) ──
  //   회차 파일은 <script>window.SG_EPISODE={style:'...',cast:[{token,name,desc,aliases}]}</script> 를
  //   이 core include 앞에 두기만 하면, 전체 프롬프트 바 + 쪽별 복사 + 카드 복사 + 붙여넣기가 자동 생성된다.
  (async function () {
    var ep = window.SG_EPISODE;
    if (!ep) return;
    if (!ep.style) {
      // 그림체(스타일 앵커) 미확정 — 빈 발주는 막되, 왜 막혔는지는 버튼에 보이게 한다.
      document.querySelectorAll('.page-card .copy-btn').forEach(function (b) {
        b.disabled = true;
        b.title = '그림체(스타일 앵커)가 확정되어야 발주할 수 있습니다 — SG_EPISODE.style 을 채우세요';
        b.style.opacity = '.4'; b.style.cursor = 'not-allowed';
      });
      return;
    }
    var pageCards = document.querySelectorAll('.page-card[data-page]');
    if (!pageCards.length) return;
    var cast = (ep.cast || []).slice();
    cast.forEach(function (c, i) { c.img = i + 1; });

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
    // 🔴 [등장] 판정은 영문 토큰만 본다 — 한글 이름으로 재면 두 가지가 새어 들어온다.
    //   ① 흔한 말과 겹치는 이름: 「제갈량이 서서 본다」의 '서서'가 서서(徐庶)로 잡혔다.
    //   ② 연출 메모의 회차 참조: 「5권에서 동탁의 말이 그랬듯이」 때문에 5권에서 죽은 동탁이
    //      16권 컷의 등장인물로 붙었다(원소·손견·전위도 같은 이유로 죽은 뒤에 다시 나왔다).
    //   실제로 그리는 인물은 SCENE 「인물」 줄에 Token(한글) 로 적는 것이 이 시리즈의 규칙이므로,
    //   토큰만 보면 둘 다 사라진다. 🔴 한글 별칭을 이 판정에 되돌리지 마라.
    function hasChar(scene, c) {
      if (!c.token) return false;
      return scene.indexOf(c.token) !== -1;
    }
    var pages = Array.prototype.map.call(pageCards, function (card) {
      return { card: card, page: card.getAttribute('data-page'), label: labelOf(card), scene: sceneOf(card) };
    });

    function compose(subset) {
      var appearsAny = {};
      cast.forEach(function (c) { appearsAny[c.img] = subset.some(function (p) { return hasChar(p.scene, c); }); });
      var legend = cast.map(function (c) {
        return '@image' + c.img + ' = ' + c.name + (c.token ? '(' + c.token + ')' : '') + ': ' + (c.desc || '') + (appearsAny[c.img] ? '' : '  (이 배치 미등장 — 첨부 불필요)');
      }).join('\n');
      var head = [
        ep.style,
        '',
        '[캐릭터 레퍼런스] 아래 @imageN 순서대로 확정 레퍼런스 시트를 첨부하세요. 얼굴·의상·비율·색을 @imageN 시트와 100% 동일하게 유지합니다. @image1~ = 이 편 등장인물.',
        legend,
        '※ 각 쪽 [등장]에 적힌 @imageN 인물만 그 컷에 그린다. 그 밖의 사물·배경은 SCENE 지시대로 그린다.',
        '',
        '[출력 규칙]',
        '- 아래 ' + subset.length + '개 장면을 각각 독립된 16:9 스프레드 일러스트로 그린다 (총 ' + subset.length + '장, 쪽 순서대로).',
        '- 같은 인물의 얼굴·의상·비율·색은 모든 장면에서 동일하게 유지한다.',
        '- 그림 안에 글자·말풍선·문자를 절대 넣지 않는다. 하단에 캡션용 여백을 남긴다.',
      ].join('\n');
      var body = subset.map(function (p) {
        var on = cast.filter(function (c) { return hasChar(p.scene, c); });
        var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
        return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경·사물 컷)') + '\n' + p.scene.trim();
      }).join('\n\n');
      return head + '\n\n' + body;
    }

    // 전체 묶음 바 (후렴 뒤 또는 hero 뒤)
    var anchor = document.querySelector('.refrain') || document.querySelector('header.hero');
    if (anchor && anchor.parentNode) {
      var bar = document.createElement('div');
      bar.className = 'sg-batch';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에</div>' +
        '<div class="bhint">버튼을 누르면 <b>스타일(1회) + 등장인물 레퍼런스(@image1~) + ' + pages.length + '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 확정 레퍼런스 시트를 첨부</b>하세요. 각 쪽 [등장]이 그 컷에 넣을 인물을 지정합니다. (핵심단어 사물 카드는 개별 복사.)</div>' +
        '<div class="brow"><button type="button" class="sg-batch-btn" id="sg-copy-all">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      document.getElementById('sg-copy-all').addEventListener('click', function () { copyText(compose(pages), this); });
    }

    // 쪽별 복사 버튼 (단일 쪽도 스타일+레퍼런스 포함)
    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (btn) { var c2 = btn.cloneNode(true); btn.parentNode.replaceChild(c2, btn); c2.addEventListener('click', function () { copyText(compose([p]), c2); }); }
    });

    // 캐릭터/사물 카드 개별 복사 — 스타일 자리표시자를 실제 스타일로 치환해 자족적 프롬프트로 복사
    function resolveCardPrompt(text) {
      var t = text.trim();
      if (ep.style) t = t.replace(/^\s*\[공통 스타일 앵커\][^\n]*\n?/, ep.style + '\n\n');
      if (ep.objectStyle) t = t.replace(/^\s*\[전통 사물 단어카드 스타일 노트\][^\n]*\n?/, ep.objectStyle + '\n\n');
      return t;
    }
    document.querySelectorAll('.char-prompt').forEach(function (card) {
      var btn = card.querySelector('.copy-btn'); var pre = card.querySelector('pre');
      if (btn && pre) { var c3 = btn.cloneNode(true); btn.parentNode.replaceChild(c3, btn); c3.addEventListener('click', function () { copyText(resolveCardPrompt(pre.textContent), c3); }); }
    });

    // 이미지 붙여넣기 (char/obj data-key + page data-page) → R2 comic-assets/{docId}
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
    document.querySelectorAll('.char-prompt[data-key]').forEach(function (card) {
      card.appendChild(createPasteBox(card.getAttribute('data-key'), '🖼️ 클릭 후 Ctrl+V — 확정 레퍼런스 시트 붙여넣기'));
    });
    pages.forEach(function (p) { p.card.appendChild(createPasteBox(p.page, '🖼️ 클릭 후 Ctrl+V — 생성한 컷 붙여넣기')); });
  })();
})();

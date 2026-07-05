/*
 * learning-comic-core.js — 「타임 티코」 회차 콘티 공용 스크립트
 * 회차 파일은 이 파일을 include 하기 전에 window.EP_GUESTS / window.COSTUME_ZONES 만 정의한다.
 *   <script>window.EP_GUESTS=[...]; window.COSTUME_ZONES=[...];</script>
 *   <script src="/learning-comic-core.js"></script>
 * 기능: 탭 네비, 쪽별/10쪽 묶음 이미지 프롬프트(@imageN·[등장]·[의상]·집합어 주석),
 *       의상 변형 레퍼런스 섹션(자동 주입), 캐스트/게스트 레퍼런스 붙여넣기, 리뷰 모드.
 * 스타일(배터리·33쪽·부록 정책은 기획서 SSOT) 및 고정 캐스트는 여기 고정.
 */
(function () {
  'use strict';

  // ── 배터리바/묶음바 CSS 주입 (회차 파일엔 게스트/캐스트 CSS만 있으므로 batch-bar 만 보강) ──
  (function injectCss() {
    if (document.getElementById('comic-core-style')) return;
    var css = [
      '.batch-bar{background:#fff;border:1.5px solid var(--mint);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.batch-bar .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.batch-bar .bhint{font-size:12px;color:var(--ink-soft);margin-bottom:12px;line-height:1.6;}',
      '.batch-bar .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.batch-btn{background:var(--mint);color:#fff;border:none;border-radius:999px;padding:8px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.batch-btn:hover{background:#1a9e8e;}',
      '.batch-btn.done{background:var(--coral);}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'comic-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ── 의상 변형 레퍼런스 섹션 주입 (게스트 섹션 뒤, 없을 때만) ──
  (function injectCostumeSection() {
    if (document.getElementById('costume-section')) return;
    var gs = document.querySelector('.guest-section');
    if (!gs) return;
    var sec = document.createElement('div');
    sec.className = 'guest-section';
    sec.id = 'costume-section';
    sec.innerHTML =
      '<h2>🎽 이 화 의상 레퍼런스 (보리 · 노아)</h2>' +
      '<div class="hint">아이들은 시대마다 옷이 바뀝니다. 이 화의 <b>과거(시대) 의상</b> 버전 시트를 만들어두면 컷마다 옷이 흔들리지 않습니다. ① [시트 프롬프트 복사] → GPT에 <b>그 아이의 기본 레퍼런스와 함께</b> 넣어 생성 → ② 아래 칸에 붙여넣기. 그러면 과거 씬이 든 묶음 프롬프트가 이 레퍼런스를 <b>자동으로</b> 씁니다(보리·노아가 현대/과거로 분리 표기). <b>붙여넣은 뒤 새로고침</b>하면 반영됩니다.</div>' +
      '<div class="char-prompt" data-costume="bori" data-key="bori-costume">' +
      '<div class="head"><span style="font-size:20px">👧</span><b>보리 — 과거(시대) 의상</b> <button type="button" class="copy-btn">📋 시트 프롬프트 복사</button></div>' +
      '<details><summary>프롬프트 보기</summary><pre></pre></details></div>' +
      '<div class="char-prompt" data-costume="noa" data-key="noa-costume">' +
      '<div class="head"><span style="font-size:20px">👦</span><b>노아 — 과거(시대) 의상</b> <button type="button" class="copy-btn">📋 시트 프롬프트 복사</button></div>' +
      '<details><summary>프롬프트 보기</summary><pre></pre></details></div>';
    gs.parentNode.insertBefore(sec, gs.nextSibling);
  })();

  // ── 공용 탭 네비 — 기획서 + 존재하는 회차 파일 자동 감지 ─────────────────
  (function () {
    var nav = document.getElementById('comic-tabs');
    if (!nav) return;
    var here = (location.pathname.split('/').pop() || '');
    var items = [['learning-comic-plan.html', '📘 기획서']];
    (async function () {
      for (var i = 1; i <= 12; i++) {
        var f = 'learning-comic-ep' + String(i).padStart(2, '0') + '.html';
        try {
          var r = await fetch(f);
          var t = await r.text();
          if (r.ok && t.includes('data-comic-doc')) items.push([f, i + '화']);
        } catch (e) { /* skip */ }
      }
      nav.innerHTML = items.map(function (it) {
        return '<a href="' + it[0] + '"' + (it[0] === here ? ' class="active"' : '') + '>' + it[1] + '</a>';
      }).join('');
    })();
  })();

  // ── 이미지 생성 프롬프트 합성 — 스타일(SSOT: 기획서 §6과 동기 유지) ─────────
  var STYLE_PROMPT = [
    '[스타일] 한국 아동 학습만화 일러스트, 초등 저학년(8-10세) 대상.',
    '밝고 따뜻한 색감, 깨끗하고 일정한 굵기의 다크브라운 외곽선, 부드러운 셀 셰이딩과 은은한 그라데이션.',
    '캐릭터는 둥글고 친근한 3등신 카툰 비율, 표정은 크고 풍부하게.',
    '시대 배경(건축·의상·소품)은 고증에 맞게 세밀하고 사실적으로 묘사.',
    '화면비 16:9 와이드 일러스트.',
    '그림 안에 글자, 말풍선, 문자 텍스트를 절대 넣지 않는다.',
  ].join(' ');

  // 고정 캐릭터(메인) — 배치 안에서 항상 @image1 부터 순서대로. (전 회차 공통)
  var FIXED_CHARS = [
    { key: 'bori',   name: '보리',     aliases: ['보리'],        desc: '9세 여자아이 — 짧은 단발머리에 붉은 머리끈, 씩씩하고 활기찬 표정, 몸이 앞으로 기운 자세.' },
    { key: 'noa',    name: '노아',     aliases: ['노아'],        desc: '9세 남자아이 — 둥근 안경, 단정한 머리, 조심스러운 표정, 놀라면 안경이 흘러내림.' },
    { key: 'tico',   name: '티코',     aliases: ['티코'],        desc: '30cm 소형 로봇 — 흰 몸체에 민트색 라인, 가슴에 시계 문양 코어(게이지 12칸), 감정에 따라 모양이 변하는 둥근 눈.' },
    { key: 'bongsu', name: '봉수 박사', aliases: ['봉수', '박사'], desc: '68세 할아버지 — 부스스한 백발, 두꺼운 돋보기안경, 기름때 묻은 카키색 작업조끼.' },
    { key: 'zero',   name: '0호',      aliases: ['0호'],         desc: '그림자 — 어둠 속 검은 실루엣에 붉은 외눈 한 점만 보인다.' },
  ];

  // 이 화의 게스트 캐릭터 / 의상 구간 — 회차 파일이 window 로 주입.
  var EP_GUESTS = (window.EP_GUESTS || []).slice();
  var COSTUME_ZONES = (window.COSTUME_ZONES || []).slice();

  var ALL_CHARS = FIXED_CHARS.concat(EP_GUESTS);
  var ALL_CHARS_BY_KEY = {};
  ALL_CHARS.forEach(function (c) { ALL_CHARS_BY_KEY[c.key] = c; });

  var EP_COSTUME = '[이 화의 의상 개요] 아이들은 시대에 따라 옷이 바뀐다 — 각 쪽 [의상] 지시를 반드시 따를 것. 다른 캐릭터(주인공 외)는 레퍼런스 그대로.';

  function costumeZoneFor(pno) {
    var n = parseInt(pno, 10);
    return COSTUME_ZONES.find(function (z) { return n >= z.from && n <= z.to; }) || null;
  }
  function pageIsVariant(pno) {
    var z = costumeZoneFor(pno);
    return !!(z && z.variant);
  }
  var EP_ERA_ZONE = COSTUME_ZONES.find(function (z) { return z.variant; }) || null;
  var EP_BASE_ZONE = COSTUME_ZONES.find(function (z) { return !z.variant; }) || null;

  var COSTUME_REF = { bori: false, noa: false };

  function costumeSheetPrompt(kidKey) {
    var c = ALL_CHARS_BY_KEY[kidKey];
    var outfit = EP_ERA_ZONE ? EP_ERA_ZONE[kidKey] : '';
    return [
      '한국 아동 학습만화 캐릭터 레퍼런스 시트(설정화). 밝고 따뜻한 색감, 깨끗하고 일정한 굵기의 다크브라운 외곽선, 부드러운 셀 셰이딩. 둥글고 친근한 3등신 카툰 비율. 순백 배경. 그림 안에 글자·라벨·텍스트 절대 금지.',
      '',
      '[가장 중요] 함께 첨부한 기본 레퍼런스(@image1)의 얼굴·헤어·이목구비·비율을 100% 그대로 유지하고, 옷만 아래 [의상]으로 갈아입힌 "같은 아이의 다른 옷차림" 시트를 그린다.',
      '',
      '[시트 구성] 전신 3면(정면·옆·뒤), 표정 4종(활짝 웃음·놀람·골똘·시무룩), 대표 포즈 2개. 단일 캐릭터만.',
      '',
      '[캐릭터] ' + (c ? c.name + ': ' + c.desc : kidKey),
      '[의상] ' + outfit,
    ].join('\n');
  }

  var DUO_TERMS = ['아이들', '두 아이', '아이 둘'];        // 보리 + 노아
  var TRIO_TERMS = ['셋이', '셋 다', '세 사람', '세 명'];  // 보리 + 노아 + 티코

  function sceneHasChar(sceneText, c) {
    if ((c.aliases || [c.name]).some(function (n) { return sceneText.indexOf(n) !== -1; })) return true;
    if (c.key === 'bori' || c.key === 'noa') {
      if (DUO_TERMS.concat(TRIO_TERMS).some(function (n) { return sceneText.indexOf(n) !== -1; })) return true;
    }
    if (c.key === 'tico') {
      if (TRIO_TERMS.some(function (n) { return sceneText.indexOf(n) !== -1; })) return true;
    }
    return false;
  }

  function annotateCollective(sceneText, on) {
    var labelOf = {};
    on.forEach(function (e) { labelOf[e.charKey] = e.label + '(@image' + e.img + ')'; });
    var clause = function (keys) {
      return keys.map(function (k) { return labelOf[k]; }).filter(Boolean).join('·');
    };
    var s = sceneText;
    DUO_TERMS.forEach(function (t) {
      if (s.indexOf(t) !== -1) {
        var c = clause(['bori', 'noa']);
        if (c) s = s.replace(t, t + '[= 주인공 ' + c + ', 지나가는 단역 아이 아님]');
      }
    });
    TRIO_TERMS.forEach(function (t) {
      if (s.indexOf(t) !== -1) {
        var c = clause(['bori', 'noa', 'tico']);
        if (c) s = s.replace(t, t + '[= 주인공 ' + c + ']');
      }
    });
    return s;
  }

  function composeBatchPrompt(pages) {
    var entities = [];
    ALL_CHARS.forEach(function (c) {
      var isKid = c.key === 'bori' || c.key === 'noa';
      if (isKid && COSTUME_REF[c.key]) {
        var baseAppears = pages.some(function (p) { return sceneHasChar(p.scene, c) && !pageIsVariant(p.pno); });
        var eraAppears = pages.some(function (p) { return sceneHasChar(p.scene, c) && pageIsVariant(p.pno); });
        if (baseAppears) entities.push({ charKey: c.key, look: 'base', label: c.name + '(현대)',
          desc: c.desc + ' | 의상: ' + (EP_BASE_ZONE ? EP_BASE_ZONE[c.key] : '평상복') + ' — 기본(현대) 레퍼런스 첨부' });
        if (eraAppears) entities.push({ charKey: c.key, look: 'era', label: c.name + '(과거)',
          desc: c.desc + ' | 의상: ' + (EP_ERA_ZONE ? EP_ERA_ZONE[c.key] : '') + ' — 이 화 과거 의상 레퍼런스 첨부' });
      } else {
        var appears = pages.some(function (p) { return sceneHasChar(p.scene, c); });
        if (appears) entities.push({ charKey: c.key, look: 'any', label: c.name, desc: c.desc });
      }
    });
    entities.forEach(function (e, i) { e.img = i + 1; });

    var matchesLook = function (e, pno) {
      if (e.look === 'any') return true;
      return (e.look === 'era') === pageIsVariant(pno);
    };

    var attachList = entities.map(function (e) {
      return '@image' + e.img + ' = ' + e.label + ': ' + e.desc;
    }).join('\n');

    var head = [
      STYLE_PROMPT,
      '',
      '[캐릭터 레퍼런스 — 아래 순서 그대로 이미지를 첨부하세요. 얼굴·헤어·비율은 @imageN 과 동일하게. 보리/노아가 (현대)·(과거)로 나뉘어 있으면 서로 다른 의상 레퍼런스이니 각각 첨부하세요]',
      attachList,
      '※ 각 쪽 [등장]의 @imageN 만 그린다. 없는 캐릭터는 넣지 않는다. 옷은 각 쪽 [의상]을 따른다.',
      '',
      EP_COSTUME,
      '',
      '[출력 규칙]',
      '- 아래 ' + pages.length + '개 장면을 각각 독립된 16:9 일러스트로 그린다 (총 ' + pages.length + '장, 쪽 순서대로).',
      '- 같은 캐릭터의 얼굴·머리·비율은 모든 장면에서 동일하게 유지하되, 옷은 각 쪽 [의상] 지시대로 갈아입힌다.',
      '- 그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않는다.',
    ].join('\n');

    var body = pages.map(function (p) {
      var on = entities.filter(function (e) {
        return sceneHasChar(p.scene, ALL_CHARS_BY_KEY[e.charKey]) && matchesLook(e, p.pno);
      });
      var appear = on.map(function (e) { return '@image' + e.img + '(' + e.label + ')'; }).join(', ');
      var zone = costumeZoneFor(p.pno);
      var kids = on.filter(function (e) { return e.charKey === 'bori' || e.charKey === 'noa'; });
      var costumeLine = (kids.length && zone)
        ? '\n[의상] ' + kids.map(function (e) { return ALL_CHARS_BY_KEY[e.charKey].name + ' = ' + zone[e.charKey]; }).join(' · ')
        : '';
      var sceneOut = annotateCollective(p.scene.trim(), on);
      return '━━━━━━━━━━ ' + p.pno + '쪽 ━━━━━━━━━━\n[등장] ' + (appear || '(배경/사물 컷)') + costumeLine + '\n' + sceneOut;
    }).join('\n\n');

    return head + '\n\n' + body;
  }

  function composeImagePrompt(pno, sceneText) {
    return composeBatchPrompt([{ pno: pno, scene: sceneText }]);
  }

  // ── 게스트/의상 카드 시트 프롬프트 복사 ──────────────────────────────────
  (function () {
    document.querySelectorAll('.char-prompt').forEach(function (card) {
      var btn = card.querySelector('.copy-btn');
      var pre = card.querySelector('pre');
      if (!btn || !pre) return;
      btn.addEventListener('click', async function () {
        var text = pre.textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = '복사됨 ✓';
          btn.classList.add('done');
        } catch (e) {
          window.prompt('복사가 막혔어요 — 직접 복사하세요:', text);
        }
        setTimeout(function () {
          btn.textContent = '📋 시트 프롬프트 복사';
          btn.classList.remove('done');
        }, 1600);
      });
    });
  })();

  // ── 이미지 자산 붙여넣기 — 저장은 /api/comic-assets ─────────────
  var ASSET_DOC_ID = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var ASSET_API = '/api/comic-assets/' + ASSET_DOC_ID;

  async function loadComicAssets() {
    try {
      var r = await fetch(ASSET_API);
      var j = await r.json();
      return (j && j.data) || {};
    } catch (e) { return {}; }
  }

  function createPasteBox(key, assets, hint) {
    var box = document.createElement('div');
    box.className = 'paste-box';
    box.tabIndex = 0;
    box.title = '클릭해 선택한 뒤 Ctrl+V 로 이미지를 붙여넣으세요 (드래그&드롭도 가능)';
    var hintText = hint || '🖼️ 클릭 후 Ctrl+V — 생성 이미지 붙여넣기';
    var reset = function () {
      box.classList.remove('has-img');
      box.innerHTML = '';
      box.textContent = hintText;
    };
    var setImg = function (url) {
      box.classList.add('has-img');
      box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del" title="이미지 삭제">✕</button>';
      box.querySelector('.paste-del').addEventListener('click', async function (e) {
        e.stopPropagation();
        if (!confirm('이 이미지를 삭제할까요?')) return;
        try {
          await fetch(ASSET_API + '/' + key, { method: 'DELETE' });
          reset();
        } catch (err) { alert('삭제 실패 — 서버(3500)를 확인하세요'); }
      });
    };
    if (assets[key]) setImg(assets[key] + '?t=' + Date.now());
    else box.textContent = hintText;

    async function upload(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      box.classList.add('busy');
      var fr = new FileReader();
      fr.onload = async function () {
        try {
          var r = await fetch(ASSET_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, dataUrl: fr.result }),
          });
          var j = await r.json();
          if (j.success) setImg(j.data.url + '?t=' + Date.now());
          else alert('저장 실패: ' + (j.error || ''));
        } catch (e) {
          alert('저장 실패 — 서버(3500)를 확인하세요');
        }
        box.classList.remove('busy');
      };
      fr.readAsDataURL(file);
    }

    box.addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.type && it.type.indexOf('image/') === 0) { e.preventDefault(); upload(it.getAsFile()); return; }
      }
    });
    box.addEventListener('dragover', function (e) { e.preventDefault(); });
    box.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) upload(f);
    });
    box.addEventListener('click', function () { box.focus(); });
    return box;
  }

  // ── 고정 캐릭터 확정 시트 표시 — 기획서(learning-comic-plan) 자산 ──
  (async function () {
    var grid = document.getElementById('cast-grid');
    if (!grid) return;
    var planAssets = {};
    try {
      var r = await fetch('/api/comic-assets/learning-comic-plan');
      var j = await r.json();
      planAssets = (j && j.data) || {};
    } catch (e) { /* 서버 미기동 — 플레이스홀더 유지 */ }
    grid.querySelectorAll('.cast-item').forEach(function (item) {
      var key = item.getAttribute('data-key');
      if (planAssets[key]) {
        var frame = item.querySelector('.frame');
        frame.innerHTML = '<img src="' + planAssets[key] + '?t=' + Date.now() + '" alt="" />';
      }
    });
  })();

  // ── 콘티 리뷰 모드 + 쪽별/묶음 프롬프트 ──────────────────
  (function () {
    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    if (!/^[a-z0-9-]+$/.test(docId)) return;
    var api = '/api/comic-feedback/' + docId;

    function updateBar(total) {
      var bar = document.getElementById('feedback-cnt');
      if (bar) bar.textContent = total;
    }

    async function loadNotes() {
      try {
        var r = await fetch(api);
        var j = await r.json();
        return (j && j.data && j.data.pages) || {};
      } catch (e) { return {}; }
    }

    async function saveNote(page, note, statusEl, ta) {
      statusEl.textContent = '저장 중…';
      try {
        var r = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: page, note: note }),
        });
        var j = await r.json();
        if (!j.success) throw new Error(j.error || 'save failed');
        statusEl.textContent = note.trim() ? '저장됨 ✓' : '삭제됨';
        ta.classList.toggle('has-note', !!note.trim());
        updateBar(j.data.total);
        setTimeout(function () { statusEl.textContent = note.trim() ? '✓' : ''; }, 1500);
      } catch (e) {
        statusEl.textContent = '저장 실패 — 서버(3500) 확인';
        statusEl.style.color = '#e85c3a';
      }
    }

    async function init() {
      var pages = document.querySelectorAll('.page');
      if (!pages.length) return;
      var loaded = await Promise.all([loadNotes(), loadComicAssets()]);
      var notes = loaded[0];
      var assets = loaded[1];

      document.querySelectorAll('.guest-section .char-prompt[data-key]').forEach(function (card) {
        card.appendChild(createPasteBox(card.getAttribute('data-key'), assets, '🖼️ 클릭 후 Ctrl+V — 확정된 레퍼런스 시트 붙여넣기'));
      });

      document.querySelectorAll('#costume-section .char-prompt[data-costume]').forEach(function (card) {
        var pre = card.querySelector('pre');
        if (pre) pre.textContent = costumeSheetPrompt(card.getAttribute('data-costume'));
      });
      COSTUME_REF.bori = !!assets['bori-costume'];
      COSTUME_REF.noa = !!assets['noa-costume'];

      var anchor = document.querySelector('header.hero');
      var barAfter = anchor;
      if (anchor) {
        var bar = document.createElement('div');
        bar.id = 'feedback-bar';
        bar.innerHTML = '✏️ <b>리뷰 모드</b> — 각 쪽 오른쪽에 수정 지시를 적고 [저장]을 누르세요. 저장된 지시는 클로드가 읽고 콘티에 반영합니다. <span>작성된 지시: <b class="cnt" id="feedback-cnt">' + Object.keys(notes).length + '</b>건</span>';
        anchor.parentNode.insertBefore(bar, anchor.nextSibling);
        barAfter = bar;
      }

      var pageData = [];

      pages.forEach(function (card) {
        var pnoEl = card.querySelector('.pno');
        var m = pnoEl && pnoEl.textContent.match(/\d+/);
        if (!m) return;
        var pno = m[0];

        var main = document.createElement('div');
        while (card.firstChild) main.appendChild(card.firstChild);
        card.appendChild(main);

        var mainPno = main.querySelector('.pno');
        var sceneEl = main.querySelector('.scene');
        if (sceneEl) pageData.push({ pno: pno, sceneEl: sceneEl });
        if (mainPno && sceneEl) {
          var row = document.createElement('div');
          row.className = 'pno-row';
          mainPno.parentNode.insertBefore(row, mainPno);
          row.appendChild(mainPno);
          var copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'copy-btn';
          copyBtn.textContent = '📋 그림 프롬프트 복사';
          copyBtn.addEventListener('click', async function () {
            var prompt = composeImagePrompt(pno, sceneEl.innerText);
            try {
              await navigator.clipboard.writeText(prompt);
              copyBtn.textContent = '복사됨 ✓';
              copyBtn.classList.add('done');
            } catch (e) {
              window.prompt('복사가 막혔어요 — 직접 복사하세요:', prompt);
            }
            setTimeout(function () {
              copyBtn.textContent = '📋 그림 프롬프트 복사';
              copyBtn.classList.remove('done');
            }, 1600);
          });
          row.appendChild(copyBtn);
        }

        var panel = document.createElement('div');
        panel.className = 'note-panel';
        var saved = notes[pno] || '';
        panel.innerHTML =
          '<label>' + pno + '쪽 생성 이미지</label>' +
          '<label style="margin-top:6px">' + pno + '쪽 수정 지시</label>' +
          '<textarea placeholder="어색한 부분, 바꾸고 싶은 대사·장면을 적어주세요">' + saved.replace(/</g, '&lt;') + '</textarea>' +
          '<div class="row"><button type="button">저장</button><span class="status">' + (saved ? '✓' : '') + '</span></div>';
        panel.insertBefore(createPasteBox('p' + pno, assets), panel.children[1]);
        var ta = panel.querySelector('textarea');
        if (saved) ta.classList.add('has-note');
        var btn = panel.querySelector('button');
        var status = panel.querySelector('.status');
        btn.addEventListener('click', function () { saveNote(pno, ta.value, status, ta); });
        ta.addEventListener('keydown', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote(pno, ta.value, status, ta);
        });

        card.classList.add('with-notes');
        card.appendChild(panel);
      });

      // ── 10쪽 묶음 프롬프트 바 ──────────────
      if (pageData.length && barAfter) {
        var groups = [];
        for (var i = 0; i < pageData.length; i += 10) groups.push(pageData.slice(i, i + 10));

        var bbar = document.createElement('div');
        bbar.className = 'batch-bar';
        var brow = groups.map(function (g) {
          var a = g[0].pno, b = g[g.length - 1].pno;
          return '<button type="button" class="batch-btn">📋 ' + a + '–' + b + '쪽 (' + g.length + '장)</button>';
        }).join('');
        bbar.innerHTML =
          '<div class="bhead">🖼️ 묶음 프롬프트 — GPT에 10쪽씩 한 번에</div>' +
          '<div class="bhint">버튼을 누르면 그 10쪽의 장면 프롬프트가 하나로 복사됩니다. 프롬프트 맨 위 <b>[캐릭터 레퍼런스]</b> 목록 순서(@image1, @image2 …)대로 레퍼런스 이미지를 GPT에 첨부하세요 — 메인 캐릭터가 먼저, 그 화 게스트가 다음 번호입니다. 각 쪽의 <b>[등장]</b>에 그 컷에 넣을 캐릭터가 표시됩니다.</div>' +
          '<div class="brow">' + brow + '</div>';
        barAfter.parentNode.insertBefore(bbar, barAfter.nextSibling);

        bbar.querySelectorAll('.batch-btn').forEach(function (btn, idx) {
          btn.addEventListener('click', async function () {
            var prompt = composeBatchPrompt(groups[idx].map(function (pd) {
              return { pno: pd.pno, scene: pd.sceneEl.innerText };
            }));
            var label = btn.textContent;
            try {
              await navigator.clipboard.writeText(prompt);
              btn.textContent = '복사됨 ✓';
              btn.classList.add('done');
            } catch (e) {
              window.prompt('복사가 막혔어요 — 직접 복사하세요:', prompt);
            }
            setTimeout(function () { btn.textContent = label; btn.classList.remove('done'); }, 1600);
          });
        });
      }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();
})();

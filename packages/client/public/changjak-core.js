/* 창작동화 1000 — 앵커 보관함
 *
 * 이 라인은 고정 캐스트가 없고 그림체가 권마다 다르다. 그래서 다른 라인의 core.js 처럼
 * "캐스트 카드"가 아니라 **앵커(스타일 원본)를 하나씩 쌓아 가는 보관함**이 필요하다.
 * 100~150개를 하루에 만들지 않는다 — 누적이 전제다.
 *
 * 저장 (백엔드 추가 없음, 기존 API 재사용):
 *   앵커 메타 = /api/saenghwal-memo  docId `ca-<slug>` · memo = JSON 문자열 (docId당 4000자 제한이라
 *               목록 전체를 한 칸에 넣지 않고 앵커당 한 칸을 쓴다)
 *   스타일 ref = /api/comic-assets/changjak-anchors  key `<slug>-1..3`
 * 🔴 docId·key 는 서버에서 /^[A-Za-z0-9-]{1,64}$/ 로 검증한다 — 슬러그는 영문/숫자/하이픈만.
 *    한글 이름은 JSON 메타에 담는다.
 */
/* ☰ 회차 드로어 — 기획서·시트·회차를 한 곳에서 오간다.
 * 목록 SSOT = changjak-index.json (한 줄 추가하면 전 페이지에 반영된다).
 * 다른 라인의 core.js 와 같은 자리·같은 조작. 상태/메모는 회차가 늘면 그때 붙인다. */
(function () {
  var CSS =
    '#cj-tog{position:fixed;left:0;top:14px;z-index:60;background:#ff7c5c;color:#fff;border:none;' +
    'border-radius:0 10px 10px 0;padding:9px 13px 9px 11px;font-size:14px;font-weight:800;cursor:pointer;' +
    "font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,.16)}" +
    '#cj-nav{position:fixed;left:0;top:0;bottom:0;width:270px;background:#fff;border-right:1px solid #f0e0d2;' +
    'z-index:61;overflow-y:auto;padding:14px 12px 40px;box-shadow:2px 0 14px rgba(0,0,0,.09)}' +
    '#cj-nav h4{font-size:12px;font-weight:800;color:#e85c3a;letter-spacing:.08em;margin:0 0 10px}' +
    '#cj-nav a{display:block;padding:7px 9px;border-radius:9px;text-decoration:none;color:#2b2320;font-size:13px;line-height:1.4}' +
    '#cj-nav a:hover{background:#fff8f0}' +
    '#cj-nav a.on{background:#ffe8d9;font-weight:800;color:#e85c3a}' +
    '#cj-nav a i{display:block;font-style:normal;font-size:11.5px;color:#6b5d55;font-weight:600}' +
    '#cj-back{position:fixed;inset:0;background:rgba(43,35,32,.28);z-index:60}' +
    /* 회차 페이지 — 마크업만 두고 스타일은 여기서 준다(회차마다 CSS 복사 금지) */
    '.ep{max-width:980px;margin:0 auto;padding:24px 24px 120px}' +
    '.ep .hero{text-align:center;padding:30px 0;border-bottom:3px solid #ff7c5c;margin-bottom:8px}' +
    '.ep .hero .kicker{color:#e85c3a;font-weight:800;letter-spacing:.14em;font-size:11.5px}' +
    '.ep .hero h1{font-size:30px;font-weight:900;margin:8px 0 6px}' +
    '.ep .hero .sub{color:#6b5d55;font-size:13.5px;font-weight:600}' +
    '.ep .meta{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 26px}' +
    '.ep .meta span{background:#ffe8d9;color:#e85c3a;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:800}' +
    '.ep .meta span.q{background:#fff;border:1px solid #f0e0d2;color:#6b5d55}' +
    '.ep .pg{display:grid;grid-template-columns:1fr 1fr;gap:0;background:#f0e0d2;border:1px solid #f0e0d2;' +
    'border-radius:14px;overflow:hidden;margin-bottom:16px}' +
    '.ep .ko,.ep .sc{background:#fff;padding:16px 18px}' +
    '.ep .ko{font-size:17px;line-height:1.95;white-space:pre-line;display:flex;flex-direction:column;justify-content:center}' +
    '.ep .sc{background:#fff8f0;font-size:12.5px;line-height:1.7;color:#6b5d55;white-space:pre-line}' +
    '.ep .sc b{color:#2b2320;font-weight:800}' +
    '.ep .n{display:block;font-size:11px;font-weight:800;color:#e85c3a;letter-spacing:.1em;margin-bottom:8px}' +
    '.ep .ko.empty{color:#b9a99c;font-size:13px;font-style:italic}' +
    '.ep .note{font-size:13px;color:#6b5d55;background:#ffe8d9;border-radius:10px;padding:11px 15px;margin:20px 0}' +
    '.ep .note b{color:#e85c3a}' +
    '.ep .pbar{background:#fff;border:1px solid #f0e0d2;border-radius:14px;padding:13px 16px;margin:0 0 22px;' +
    'display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.ep .pbar b{font-size:14px;width:100%}' +
    '.ep .pbar i{font-style:normal;font-size:12px;color:#6b5d55;width:100%;line-height:1.6;margin-bottom:4px}' +
    '.ep .pbar code{background:#fff8f0;border-radius:4px;padding:0 4px;font-size:11.5px}' +
    '.pbtn{background:#fff;color:#22b8a6;border:1.5px solid #22b8a6;border-radius:999px;padding:4px 13px;' +
    'font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;margin-top:10px}' +
    '.pbtn:hover,.pbtn.done{background:#22b8a6;color:#fff}' +
    '.ep .pbar .pbtn{margin-top:0}' +
    '.pbtn.hot{color:#e85c3a;border-color:#e85c3a}' +
    '.pbtn.hot:hover,.pbtn.hot.done{background:#e85c3a;color:#fff}' +
    '@media(max-width:760px){.ep .pg{grid-template-columns:1fr}}';
  var s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);

  var here = location.pathname.split('/').pop() || 'changjak-plan.html';
  var open = false, nav, back;

  var tog = document.createElement('button');
  tog.id = 'cj-tog';
  tog.type = 'button';
  tog.textContent = '☰';
  tog.title = '회차 목록';
  document.body.appendChild(tog);

  function close() {
    open = false;
    if (nav) nav.remove();
    if (back) back.remove();
    nav = back = null;
  }

  tog.addEventListener('click', function () {
    if (open) return close();
    open = true;
    back = document.createElement('div');
    back.id = 'cj-back';
    back.addEventListener('click', close);
    document.body.appendChild(back);

    nav = document.createElement('nav');
    nav.id = 'cj-nav';
    nav.innerHTML = '<h4>창작동화 1000</h4><div id="cj-list">불러오는 중…</div>';
    document.body.appendChild(nav);

    fetch('/changjak-index.json')
      .then(function (r) { return r.json(); })
      .then(function (list) {
        document.getElementById('cj-list').innerHTML = list
          .map(function (e) {
            return (
              '<a href="/' + e.file + '"' + (e.file === here ? ' class="on"' : '') + '>' +
              e.label + '<i>' + (e.title || '') + '</i></a>'
            );
          })
          .join('');
      })
      .catch(function () {
        document.getElementById('cj-list').textContent = '목록을 못 불러왔습니다.';
      });
  });
})();

/* 기획서 §5.5 집필 현황 — index.json 에서 회차만 골라 표로.
 * 목록을 손으로 관리하면 반드시 어긋난다. 드로어와 같은 원본을 쓴다. */
(function () {
  var mount = document.getElementById('written-list');
  if (!mount) return;
  fetch('/changjak-index.json')
    .then(function (r) { return r.json(); })
    .then(function (list) {
      var books = list.filter(function (e) { return /^changjak-a\d+\.html$/.test(e.file); });
      if (!books.length) { mount.innerHTML = '<p class="lead">아직 쓴 책이 없습니다.</p>'; return; }
      var rows = books
        .map(function (b) {
          return (
            '<tr><td><b>' + b.label + '</b></td>' +
            '<td><a href="/' + b.file + '" style="color:#e85c3a;font-weight:800">' + (b.title || b.file) + '</a></td>' +
            '<td class="st" data-file="' + b.file + '">…</td></tr>'
          );
        })
        .join('');
      mount.innerHTML =
        '<table><tr><th>회차</th><th>제목</th><th>앵커 · 상태</th></tr>' + rows + '</table>';

      // 상태는 회차 파일의 CJ_EPISODE 에서 읽는다 — 두 곳에 적어 두면 어긋난다
      books.forEach(function (b) {
        fetch('/' + b.file)
          .then(function (r) { return r.text(); })
          .then(function (t) {
            var cl = (t.match(/cluster:\s*'([^']+)'/) || [])[1] || '—';
            var slug = (t.match(/anchorSlug:\s*'([^']+)'/) || [])[1];
            var cell = mount.querySelector('.st[data-file="' + b.file + '"]');
            if (cell) cell.innerHTML = slug
              ? '<b style="color:#22b8a6">' + slug + '</b> · ' + cl
              : '<b style="color:#6b5d55">앵커 미확정</b> · ' + cl;
          })
          .catch(function () {});
      });
    })
    .catch(function () { mount.innerHTML = '<p class="lead">목록을 못 불러왔습니다.</p>'; });
})();

/* 회차의 앵커 바인딩을 메타 줄에 띄운다.
 * 바인딩이 데이터로만 있고 화면에 안 보이면 아무도 안 채운다 — 미확정이면 미확정이라고 보여준다. */
(function () {
  var e = window.CJ_EPISODE;
  var meta = document.querySelector('.ep .meta');
  if (!e || !meta) return;
  var chip = document.createElement('span');
  chip.className = 'q';
  // 🔴 클러스터·ref 는 앵커 후보를 좁혀 둔 권에만 있다. 없는 권에 그대로 이으면 'null (ref null)' 이 뜬다.
  var hint = e.cluster ? ' · ' + e.cluster + (e.reference ? ' (ref ' + e.reference + ')' : '') : '';
  chip.innerHTML = e.anchorSlug
    ? '🎨 앵커 <b>' + e.anchorSlug + '</b>' + (e.cluster ? ' · ' + e.cluster : '')
    : '🎨 앵커 <b>미확정</b>' + hint;
  chip.title = '프롬프트: ' + (e.prompts || '');
  meta.appendChild(chip);
})();

/* 회차 페이지의 삽화 프롬프트 — 🔴 시트를 따로 준다.
 * 시트를 먼저 굽고 그걸 @image1 로 붙이는 순서를 어기면 인물만 매끈한 CG 로 나온다(§2.4).
 * 버튼을 분리해 두면 순서가 눈에 보인다. 컷 버튼은 STYLE ANCHOR + 시트 지시 + 그 쪽 블록을 합성해 준다. */
(function () {
  var ep = window.CJ_EPISODE, all = window.CJ_PROMPTS;
  if (!ep || !all || !all[ep.id]) return;
  var P = all[ep.id];
  var meta = document.querySelector('.ep .meta');
  if (!meta) return;

  function copy(btn, text, label) {
    navigator.clipboard.writeText(text).then(function () {
      var o = btn.textContent;
      btn.textContent = (label || '복사됨') + ' ✓';
      btn.classList.add('done');
      setTimeout(function () { btn.textContent = o; btn.classList.remove('done'); }, 1600);
    });
  }
  function mk(label, text, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pbtn' + (cls ? ' ' + cls : '');
    b.textContent = label;
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); copy(b, text); });
    return b;
  }

  var bar = document.createElement('div');
  bar.className = 'pbar';
  bar.innerHTML =
    '<b>🎨 삽화 프롬프트</b>' +
    '<i>🔴 <b>①시트를 먼저 굽는다</b> → 승인된 시트를 <code>@image1</code> 로 붙여 ②컷을 뽑는다. ' +
    '순서를 어기면 배경엔 매체가 먹고 <b>인물만 매끈한 CG</b> 로 나온다.</i>';
  bar.appendChild(mk('📋 ① 스타일 앵커', P.anchor));
  P.sheets.forEach(function (s, i) {
    bar.appendChild(mk('📋 ① 캐릭터 시트' + (P.sheets.length > 1 ? ' ' + (i + 1) : '') + ' (먼저!)', s, 'hot'));
  });
  meta.parentNode.insertBefore(bar, meta.nextSibling);

  // 쪽마다 — 합성해서 복사
  var pgs = document.querySelectorAll('.ep .pg');
  P.cuts.forEach(function (c, i) {
    var pg = pgs[i];
    if (!pg) return;
    var composed =
      P.anchor + '\n\n' +
      '--- 이 컷 (' + c.page + ' — ' + c.title + ') ---\n' +
      '@image1 = 위 스타일로 승인된 캐릭터 시트. 인물은 시트를 그대로 따른다.\n\n' +
      c.prompt;
    var b = mk('📋 ' + c.page + ' 컷 프롬프트 (앵커+시트 합성)', composed);
    pg.querySelector('.sc').appendChild(b);
  });
})();

/* §5 주제군 8개 = 탭.
 * 120권을 세로로 쌓으면 한 화면에 한 주제군도 안 들어와 비교가 안 된다.
 * 기획서 HTML 은 마크업만 두고(.grp 8개) 탭 로직은 여기 있다. */
(function () {
  var grps = [].slice.call(document.querySelectorAll('.grp'));
  if (grps.length < 2) return;

  var bar = document.createElement('div');
  bar.className = 'grp-tabs';
  var btns = [];

  function show(i) {
    grps.forEach(function (g, n) { g.style.display = i < 0 || n === i ? '' : 'none'; });
    btns.forEach(function (b, n) { b.classList.toggle('on', n === i + 1); });
  }

  // 첫 칩 = 전체(인쇄·통독용), 그다음 주제군 8개
  [{ label: '전체', idx: -1 }]
    .concat(grps.map(function (g, i) {
      var h = g.querySelector('.head h3');
      var emo = g.querySelector('.head .emo');
      var cnt = g.querySelector('.head .cnt');
      return {
        label: (emo ? emo.textContent + ' ' : '') + (h ? h.textContent.replace(/^[A-H]\s*·\s*/, '') : '?'),
        sub: cnt ? cnt.textContent : '',
        idx: i,
      };
    }))
    .forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'grp-tab';
      b.innerHTML = t.label + (t.sub ? ' <i>' + t.sub + '</i>' : '');
      b.addEventListener('click', function () { show(t.idx); });
      bar.appendChild(b);
      btns.push(b);
    });

  grps[0].parentNode.insertBefore(bar, grps[0]);
  show(0); // 기본 = 첫 주제군
})();

(function () {
  var MEMO = '/api/saenghwal-memo';
  var ASSETS = '/api/comic-assets/changjak-anchors';
  var PREFIX = 'ca-';
  var TARGET = 150;
  var REFS = 3; // 앵커당 스타일 ref 슬롯
  var GROUPS = [
    ['A', '마음·감정'], ['B', '상상·변신'], ['C', '자연·계절·동물'], ['D', '모험·여정'],
    ['E', '웃음·말놀이'], ['F', '집·가족'], ['G', '용기·두려움'], ['H', '호기심·만들기'],
  ];

  var mount = document.getElementById('anchor-vault');
  if (!mount) return;

  var anchors = {}; // slug -> {name, cluster, media, groups[], prompt}
  var images = {}; // key -> url
  var filter = '';

  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  function saveAnchor(slug, data) {
    return fetch(MEMO, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId: PREFIX + slug, memo: JSON.stringify(data) }),
    }).then(function (r) {
      if (!r.ok) throw new Error('저장 실패');
      return r.json();
    });
  }

  // 🔴 남아 있는 ref 이미지 키까지 보고 최댓값을 잡는다.
  // 앵커 삭제는 메타(memo)만 지우고 R2 이미지는 남기므로, 메타만 보면 마지막 번호를 지운 뒤
  // 새로 추가할 때 같은 번호가 다시 나와 **새 앵커가 남의 ref 를 물려받는다.**
  function nextSlug() {
    var n = 0;
    var bump = function (s) {
      var m = /^a-(\d+)/.exec(s);
      if (m) n = Math.max(n, parseInt(m[1], 10));
    };
    Object.keys(anchors).forEach(bump);
    Object.keys(images).forEach(bump); // `a-003-2` 같은 잔재도 잡힌다
    return 'a-' + String(n + 1).padStart(3, '0');
  }

  // ── 스타일 ref 붙여넣기 박스 ─────────────────────────────
  function pasteBox(key) {
    var box = el('div', 'paste-box');
    box.tabIndex = 0;
    var hint = '🖼️ 클릭 후 Ctrl+V';
    function reset() {
      box.className = 'paste-box';
      box.textContent = hint;
    }
    function show(url) {
      box.className = 'paste-box has-img';
      box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del">✕</button>';
      box.querySelector('.paste-del').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!confirm('이 레퍼런스를 지울까요?')) return;
        fetch(ASSETS + '/' + key, { method: 'DELETE' }).then(function () {
          delete images[key];
          reset();
        });
      });
    }
    images[key] ? show(images[key] + '?t=' + Date.now()) : reset();

    function upload(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      box.textContent = '올리는 중…';
      var fr = new FileReader();
      fr.onload = function () {
        fetch(ASSETS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: key, dataUrl: fr.result }),
        })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j.success) throw new Error();
            images[key] = j.data.url;
            show(j.data.url + '?t=' + Date.now());
          })
          .catch(function () {
            alert('저장 실패 — 서버(3500)가 떠 있는지 확인하세요');
            reset();
          });
      };
      fr.readAsDataURL(file);
    }
    box.addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          e.preventDefault();
          upload(items[i].getAsFile());
          return;
        }
      }
    });
    box.addEventListener('click', function () { box.focus(); });
    return box;
  }

  // ── 앵커 카드 ────────────────────────────────────────────
  function card(slug) {
    var a = anchors[slug];
    var c = el('div', 'anchor');
    var badges = (a.groups || []).map(function (g) {
      var f = GROUPS.filter(function (x) { return x[0] === g; })[0];
      return '<span class="gb">' + g + (f ? ' ' + esc(f[1]) : '') + '</span>';
    }).join('');
    c.innerHTML =
      '<div class="ahead"><b>' + esc(a.name || slug) + '</b><code>' + slug + '</code></div>' +
      '<div class="ameta">' + esc(a.media || '') + '</div>' +
      '<div class="gbs">' + badges + '</div>';

    var refs = el('div', 'refs');
    for (var i = 1; i <= REFS; i++) refs.appendChild(pasteBox(slug + '-' + i));
    c.appendChild(refs);
    c.appendChild(el('div', 'reflabel', '스타일 ref — 승인된 렌더를 붙여넣으면 이게 원본이 된다'));

    if (a.prompt) {
      var d = el('details');
      d.appendChild(el('summary', null, '앵커 프롬프트 보기'));
      var pre = el('pre', 'sheet');
      pre.textContent = a.prompt;
      d.appendChild(pre);
      c.appendChild(d);
      var copy = el('button', 'copy-btn', '📋 프롬프트 복사');
      copy.addEventListener('click', function () {
        navigator.clipboard.writeText(a.prompt).then(function () {
          copy.textContent = '복사됨 ✓';
          copy.classList.add('done');
          setTimeout(function () { copy.textContent = '📋 프롬프트 복사'; copy.classList.remove('done'); }, 1500);
        });
      });
      c.appendChild(copy);
    }

    var del = el('button', 'copy-btn del', '삭제');
    del.addEventListener('click', function () {
      if (!confirm('앵커 「' + (a.name || slug) + '」을 지울까요? (붙여넣은 ref 는 따로 지워야 합니다)')) return;
      fetch(MEMO, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: PREFIX + slug, memo: '' }),
      }).then(function () { delete anchors[slug]; render(); });
    });
    c.appendChild(del);
    return c;
  }

  // ── 새 앵커 폼 ───────────────────────────────────────────
  function form() {
    var f = el('div', 'anchor new');
    f.innerHTML =
      '<div class="ahead"><b>➕ 새 앵커</b></div>' +
      '<input id="an-name" placeholder="앵커 이름 (예: 젖은 종이 위 색연필)" />' +
      '<input id="an-media" placeholder="매체 · 팔레트 · 마감 밀도 한 줄" />' +
      '<div class="gbs" id="an-groups">' +
      GROUPS.map(function (g) {
        return '<label class="gb pick"><input type="checkbox" value="' + g[0] + '" /> ' + g[0] + ' ' + esc(g[1]) + '</label>';
      }).join('') +
      '</div>' +
      '<textarea id="an-prompt" rows="4" placeholder="앵커 프롬프트 — 🔴 작가 실명 금지. 매체·팔레트·마감 밀도·캐릭터 디자인 언어로 기술."></textarea>';
    var add = el('button', 'copy-btn', '앵커 추가');
    add.addEventListener('click', function () {
      var name = f.querySelector('#an-name').value.trim();
      if (!name) { alert('앵커 이름을 적어주세요'); return; }
      var groups = [].slice.call(f.querySelectorAll('#an-groups input:checked')).map(function (i) { return i.value; });
      var slug = nextSlug();
      var data = {
        name: name,
        media: f.querySelector('#an-media').value.trim(),
        groups: groups,
        prompt: f.querySelector('#an-prompt').value.trim(),
      };
      add.textContent = '저장 중…';
      saveAnchor(slug, data)
        .then(function () { anchors[slug] = data; render(); })
        .catch(function () { alert('저장 실패 — 서버(3500) 확인'); add.textContent = '앵커 추가'; });
    });
    f.appendChild(add);
    return f;
  }

  // ── 렌더 ─────────────────────────────────────────────────
  function render() {
    mount.innerHTML = '';
    var slugs = Object.keys(anchors).sort();
    var shown = filter ? slugs.filter(function (s) { return (anchors[s].groups || []).indexOf(filter) >= 0; }) : slugs;

    var bar = el('div', 'vault-bar');
    bar.innerHTML =
      '<b>앵커 ' + slugs.length + '</b> / 목표 ' + TARGET +
      ' <span class="dim">· 앵커당 6~10권 → 현재 커버 ' + slugs.length * 6 + '~' + slugs.length * 10 + '권</span>';
    var chips = el('div', 'gbs');
    var mk = function (val, label) {
      var b = el('button', 'gb chip' + (filter === val ? ' on' : ''), label);
      b.addEventListener('click', function () { filter = val; render(); });
      return b;
    };
    chips.appendChild(mk('', '전체'));
    GROUPS.forEach(function (g) { chips.appendChild(mk(g[0], g[0] + ' ' + g[1])); });
    bar.appendChild(chips);
    mount.appendChild(bar);

    var grid = el('div', 'anchor-grid');
    if (!shown.length) {
      grid.appendChild(el('div', 'dim', slugs.length ? '이 주제군에 배정된 앵커가 아직 없습니다.' : '아직 앵커가 없습니다. 아래에서 첫 앵커를 추가하세요.'));
    }
    shown.forEach(function (s) { grid.appendChild(card(s)); });
    grid.appendChild(form());
    mount.appendChild(grid);
  }

  // ── 로드 ─────────────────────────────────────────────────
  Promise.all([
    fetch(MEMO).then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch(ASSETS).then(function (r) { return r.json(); }).catch(function () { return {}; }),
  ]).then(function (res) {
    var memos = (res[0] && res[0].data) || {};
    Object.keys(memos).forEach(function (k) {
      if (k.indexOf(PREFIX) !== 0) return;
      try { anchors[k.slice(PREFIX.length)] = JSON.parse(memos[k]); } catch (e) { /* 깨진 항목은 건너뛴다 */ }
    });
    images = (res[1] && res[1].data) || {};
    render();
  });
})();

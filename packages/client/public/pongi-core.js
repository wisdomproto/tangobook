/*
 * saenghwal-core.js — 퐁이네 운하 마을 회차 공용 스크립트
 * 회차 파일은 이 스크립트를 include 하기 전에 (선택) window.SH_GUESTS 만 정의한다.
 *   <script>window.SH_GUESTS=[{key:'doctor',name:'코끼리 의사 선생님',aliases:['doctor','elephant doctor'],desc:'...'}]</script>
 *   <script src="/saenghwal-core.js"></script>
 * 기능: 상단 탭, 쪽별/전체 묶음 이미지 프롬프트(스타일 1회 + @image1..5 고정캐스트 + @image9~ 단역 + 쪽별 [등장]),
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
      // ── 좌측 회차 사이드바 (상단 탭 대체) ──
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--coral);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:#fff;z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}',
      '#ep-summary{font-size:12px;color:var(--ink-soft);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft);padding:2px 4px;}',
      '.ep-plan{display:block;margin:10px 12px 6px;padding:10px 13px;border-radius:10px;background:var(--peach);color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;border:1px solid var(--line);}',
      '.ep-plan:hover,.ep-plan.active{background:var(--coral);color:#fff;border-color:var(--coral);}',
            '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1f1f1;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--coral-dark);text-decoration:underline;}',
      '.ep-item.active a{color:var(--coral-dark);font-weight:800;}',
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
      '#ep-memo-modal .save{background:var(--coral);color:#fff;}',
      '#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'sh-core-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ── 🔴 앵커 넷 — 권 번호로 고른다. SSOT = docs/art-direction/pongi-anchor.md (고칠 땐 양쪽 다) ──
  //   ⚠️ 여기 있던 단일 STYLE(폐기된 a45 changjak-flatplate)은 앵커 넷을 민팅하면서 죽은 값이 됐는데
  //      core 를 같이 안 고쳐서, 회차 [전체 프롬프트 복사]가 안 쓰는 그림체를 붙이고 있었다.
  var ANCHORS = {
    A: { name: '실크스크린 · 물 위', slug: 'pongi-screenwater', vols: ['02','07','09','12','17','24'],
      ko: [
        '[스타일] 퐁이네 운하 마을 — 4~6세 유아 그림책. 앵커 A `pongi-screenwater`.',
        '미색 종이(#F6F4EE)에 실크스크린 두 판만 찍는다. 판 하나는 한 번에 밀어낸 불투명 단색 한 겹이고, 두 판이 겹친 자리에서만 어두운 색이 생긴다 — 어두움은 그 방법으로만 존재한다.',
        '찍지 않은 종이는 여백이 아니라 하늘이고 빛이다. 음영·그라데이션·드리운 그림자·하이라이트가 전부 없다.',
        '물은 잉크1을 한 번에 민 한 면이다 — 안에서 밝아지거나 어두워지지 않고 물결도 반짝임도 0이다. 물에 잠긴 것은 그 면 안에 겹침색으로 놓이고, 물 위의 것은 윤곽이 다 보이게 얹힌다. 얼음은 그 자리를 안 밀고 종이로 남긴 것이다.',
        '색: 운하 초록 #2C4A3C(물), 흙 갈색 #8C7C68(나무·배·밧줄·둑). 겹친 자리 = 솔잎 #21372E(수달 등·밤·잠긴 것).',
        '🔴 붉은 판 #A8442F 은 마지막에 한 번 더 찍고 퐁이의 목끈에만 닿는다. 다른 인물·소품에는 절대 쓰지 않는다.',
        '판이 매 쪽 머리카락 하나만큼 어긋나 있고 그 어긋남이 두세 군데 가장자리에서 보인다.',
        '화면비 16:9 스프레드. 그림 안에 글자·말풍선·문자를 절대 넣지 않는다.',
      ].join(' ') },
    B: { name: '활판 · 집 안', slug: 'pongi-presshome', vols: ['04','05','08','11','16','22','23'],
      ko: [
        '[스타일] 퐁이네 운하 마을 — 4~6세 유아 그림책. 앵커 B `pongi-presshome`.',
        '부드러운 미색 종이(#F6F4EE)에 활판으로 두 색만 찍는다. 모든 형태는 잉크를 묻혀 눌러 찍은 판이라 잉크가 형태 가장자리에 가장 진하게 앉고, 판이 문 자리는 종이가 눌려 들어가 있다.',
        '두 판이 겹친 자리에서만 어두운 색이 생긴다. 음영은 0이고, 유일한 변주는 눌린 정도가 고르지 않은 것뿐이다.',
        '방 안은 같은 판을 반복해 짓는다: 바닥=널 판 반복, 벽=점 판 반복, 천=줄무늬 판 반복. 판 모양은 매번 똑같고 화면 밖으로 잘릴지언정 새로 그리지 않는다.',
        '🔴 찾고 있는 물건만 제 판으로 따로 파고 그것이 섞여 있는 것들은 반복 판이다 — 그래야 눈이 그것을 찾는다.',
        '색: 흙 갈색 #8C7C68(바닥·가구·나무), 이끼 #4C5B4A(천·덧문·칠한 것). 겹친 자리 = 진갈 #3B3A2E.',
        '🔴 붉은 판 #A8442F 은 퐁이의 목끈에만. ⚠️ 10권 p6~p10 만 예외로 빨래를 붉은 판 반 강도로 찍어 연분홍을 만들고, 그 옆에서 퐁이 목끈은 온전한 강도로 남는다.',
        '잉크 덮임은 90%이고 절대 꽉 차지 않는다 — 모든 형태 안으로 종이가 비쳐 보인다.',
        '화면비 16:9 스프레드. 그림 안에 글자·말풍선·문자를 절대 넣지 않는다.',
      ].join(' ') },
    C: { name: '리소 · 마당·길', slug: 'pongi-risosky', vols: ['01','03','06','10','20','21'],
      ko: [
        '[스타일] 퐁이네 운하 마을 — 4~6세 유아 그림책. 앵커 C `pongi-risosky`.',
        '미색 종이(#F6F4EE)에 리소그래프 드럼 두 개로만 찍는다. 잉크가 고르지 않게 앉아 얼룩덜룩하고 드럼이 돈 방향으로 줄이 가며, 완전히 꽉 찬 면이 하나도 없다.',
        '그 권의 하늘과 땅은 매 쪽 같은 방향으로 흐르는 한 겹이다: 비는 아래로, 바람은 옆으로, 안개는 평평하게. 인물은 그 위에 얹힌 별개의 평면이고 인물 안에는 줄이 없다.',
        '🔴 날씨는 잉크1의 줄 방향에만 산다 — 제 윤곽이 없고 종이가 이어받는 자리에서 그냥 그친다. 안개 속의 것은 흐려지며 나타나지 않고 온전한 강도로 나타난다.',
        '색: 청회 #6E7A75(하늘·날씨·젖은 돌), 흙 갈색 #8C7C68(진흙·나무·둑). 겹친 자리 = 먹청 #2E3A3C(수달 등·젖은 것, 그 쪽에서 가장 어둡다).',
        '🔴 붉은 판 #A8442F 은 퐁이의 목끈에만.',
        '판이 매 쪽 머리카락 하나만큼 어긋나 있다.',
        '화면비 16:9 스프레드. 그림 안에 글자·말풍선·문자를 절대 넣지 않는다.',
      ].join(' ') },
    D: { name: '리노컷 · 마을', slug: 'pongi-cutvillage', vols: ['13','14','15','18','19','25'],
      ko: [
        '[스타일] 퐁이네 운하 마을 — 4~6세 유아 그림책. 앵커 D `pongi-cutvillage`.',
        '미색 종이(#F6F4EE)에 리노컷을 두 색으로 찍는다. 🔴 형태는 칼로 파낸 것이 만든다 — 모든 가장자리가 칼자국이라 살짝 거칠고, 면을 걷어낸 조각칼 고랑이 나란한 골로 남아 보인다.',
        '두 판이 겹친 자리에서만 어두운 색이 생긴다. 음영·그라데이션·드리운 그림자가 전부 없다.',
        '걷어낸 면은 비어 있지 않고 그 면을 판 도구의 나란한 고랑을 지닌다 — 면당 아홉 골 이하, 한 면 안에서는 다 같은 방향.',
        '건물은 잉크1 판, 땅과 천은 잉크2, 인물은 겹침색이다. 군중은 안쪽 자국이 0인 실루엣 한 판이고 아홉 명 이하다.',
        '색: 이끼 #4C5B4A(건물·덧문·차양), 벽돌 #9E7A5E(땅·벽돌·바구니·나무). 겹친 자리 = 검정 #2B2A26.',
        '🔴 붉은 판 #A8442F 은 마지막에 찍고 퐁이의 목끈에만 닿는다.',
        '스프레드마다 칼이 한 번 미끄러지고 그 자국을 그대로 남긴다.',
        '화면비 16:9 스프레드. 그림 안에 글자·말풍선·문자를 절대 넣지 않는다.',
      ].join(' ') },
  };
  var PONGI_VOL = ((location.pathname.split('/').pop() || '').match(/pongi-(\d+)/) || [])[1] || '';
  var ANCHOR_KEY = Object.keys(ANCHORS).find(function (k) { return ANCHORS[k].vols.indexOf(PONGI_VOL) !== -1; }) || 'A';
  var ANCHOR = ANCHORS[ANCHOR_KEY];
  var STYLE_PROMPT = ANCHOR.ko;

  // ── 고정 캐스트 5인 — 배치에서 항상 @image1..5 (순서 고정, 전 회차 공통) ──
  var FIXED_CHARS = [
    { key: 'pongi', name: '퐁이', aliases: ['Pongi', '퐁이'],
      desc: '아기 수달 주인공 — 둥근 머리, 짧고 뭉툭한 주둥이, 옆머리 낮은 자리의 작고 둥근 귀. 등·머리는 짙은 초록갈색, 가슴·배는 흙색, 끝이 가늘어지는 굵은 꼬리. 머리가 몸에 비해 크고 팔다리가 짧아 어른의 절반 키. 🔴 목에 두른 붉은 끈 하나 = 화면의 유일한 따뜻한 색.' },
    { key: 'dad',   name: '아빠', aliases: ['Dad otter', 'Dad', '아빠'],
      desc: '아빠 수달 — 퐁이와 같은 종족 규격, 키가 크고 배가 둥글다. 흙색 헐렁한 멜빵바지. 붉은색 없음.' },
    { key: 'mom',   name: '엄마', aliases: ['Mom otter', 'Mom', '엄마'],
      desc: '엄마 수달 — 아빠보다 날씬. 짙은 초록 머릿수건을 뒤로 묶었다. 붉은색 없음.' },
    { key: 'baby',  name: '동생', aliases: ['Baby otter', 'baby brother', '동생'],
      desc: '아기 수달 동생 — 퐁이보다 작고 더 둥글며 팔다리가 아주 짧다. 두 앞발로 조개 하나를 가슴에 꼭 안고 있다. 붉은색 없음.' },
    { key: 'goose', name: '거위 할아버지', aliases: ['Goose grandpa', 'Goose', '거위 할아버지', '할아버지'],
      desc: '늙은 거위 — 긴 목, 미색 둥근 몸, 흙색 넓적 부리. 흙색 고무장화. 운하 관리인이라 나올 때마다 다른 일을 하고 있다. 붉은색 없음.' },
  ];

  var GUESTS = (window.SH_GUESTS || []).slice(); // 화별 단역 → @image9~
  var ALL = FIXED_CHARS.concat(GUESTS);
  ALL.forEach(function (c, i) { c.img = i + 1; }); // 1..5 고정, 9~ 단역
  var IS_GUEST = {}; GUESTS.forEach(function (g) { IS_GUEST[g.key] = true; });
  // 레퍼런스 이미지 없을 때 폴백 얼굴 (고정 캐스트)
  var FACE = { pongi: '🦦', dad: '🦦', mom: '🦦', baby: '🦦', goose: '🦢' };

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
      '[캐릭터 레퍼런스] 아래 @imageN 순서대로 레퍼런스 이미지를 첨부하세요. 얼굴·헤어·비율·색은 @imageN 시트와 100% 동일하게 유지합니다. @image1~5 = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
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
      'Style: Hard-edge flat colour illustration with zero shading, no gradients, no texture and no outlines — every form is one solid shape of flat colour, read only where two colours meet. Strict palette: deep pine green #21372E, earth brown #8C7C68, warm off-white #F6F4EE, canal green #2C4A3C. NOT rendered, NOT painted, NOT 3D, NOT felt. Canvas 1024x1024, solid pure magenta #FF00FF background, character centered, 8% padding. No ground shadow, no text, no labels, no extra characters.',
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

  // ── 좌측 회차 사이드바 (번호순 · 컨텐츠 제목 · 완성/진행 상태, R2 저장) — 상단 탭 대체 ──
  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 회차';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML =
      '<div class="ep-head"><b>회차 목록</b><span id="ep-summary"></span>' +
      '<button id="ep-close" type="button" aria-label="닫기">✕</button></div>' +
      '<a class="ep-plan" href="/pongi-plan.html">📘 기획서 · 캐스트 시트 · 앵커</a>' +
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

    // 메모 편집 모달 (1회 생성, 회차 공용)
    var modal = document.createElement('div'); modal.id = 'ep-memo-modal';
    modal.innerHTML = '<div class="box"><div class="mhead"></div>' +
      '<textarea placeholder="이 회차 메모…"></textarea>' +
      '<div class="mrow"><button class="cancel" type="button">취소</button><button class="save" type="button">저장</button></div></div>';
    document.body.appendChild(modal);
    var mHead = modal.querySelector('.mhead');
    var mTa = modal.querySelector('textarea');
    var cur = null; // { docId, onSaved }
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
    try { var ri = await fetch('/pongi-index.json'); idx = await ri.json(); } catch (e) {}
    var eps = idx
      .filter(function (e) { return e.file && e.file !== 'pongi-plan.html'; })
      .map(function (e) {
        var m = (e.label || '').match(/(\d+)/);
        return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || (e.label || '').replace(/^\s*\d+\s*/, '') };
      })
      .sort(function (a, b) { return a.num - b.num; });

    var here = location.pathname.split('/').pop() || '';
    if (here === 'pongi-plan.html' || here === '') {
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
        '<div class="bhint">버튼을 누르면 <b>스타일(1회) + 캐릭터 레퍼런스(@image1~) + ' + pages.length + '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 캐스트 시트를 첨부</b>하세요(@image1~5 = 퐁이·아빠·엄마·동생·거위 할아버지). 각 쪽 [등장]이 그 컷에 넣을 캐릭터를 지정합니다.</div>' +
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
      // 기획서(pongi-plan)에 붙여넣어 확정한 고정 캐스트 레퍼런스 이미지를 끌어온다
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
      fetch('/api/comic-assets/pongi-plan').then(function (r) { return r.json(); }).then(function (j) {
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
        '<div class="ghint">이 화에만 나오는 단역입니다(@image9~). ① [시트 프롬프트 복사] → GPT에 넣어 니들펠트 시트 생성 → ② 아래 박스에 붙여넣어 확정하세요. 그러면 전체 프롬프트의 @image 번호와 이 시트가 1:1로 맞습니다. <b>@image1~5 고정 캐스트 시트는 📘 기획서 탭에서.</b></div>' +
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
 * 🔴 SSOT 는 docs/changjak-books/pongi/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 때는 이 오버레이부터 확인해야 한다.
 *   (창작동화 99권에서 실제로 30권 96쪽이 갈렸던 자리다.)
 * 저장 = PUT /api/changjak-text/<docId> {page,text} · 로드 = GET → {p1:text,…} · 빈 값이면 원본 복귀. */
(function () {
  var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (!/^pongi-\d+$/.test(docId)) return;
  var API = '/api/changjak-text/' + docId;

  var st = document.createElement('style');
  st.textContent =
    '.page-card p.ko{outline:none;border-radius:8px;margin:8px -6px 10px;padding:4px 6px;transition:background .12s}' +
    '.page-card p.ko:hover{background:#fff6ec}' +
    '.page-card p.ko:focus{background:#fff6ec;box-shadow:0 0 0 2px #ffc7b0}' +
    '.page-card{position:relative}' +
    '.ko-tag{position:absolute;top:14px;right:16px;font-size:10.5px;font-weight:800;opacity:0;transition:opacity .15s;pointer-events:none}' +
    '.ko-tag.on{opacity:1}' +
    '.ko-tag.saving{color:var(--ink-soft)}.ko-tag.saved{color:var(--water)}.ko-tag.err{color:var(--coral-dark)}' +
    '.ko-edited{border-color:var(--coral)}' +
    '.edit-hint{background:#fff6f2;border:1px solid var(--coral);border-radius:12px;padding:11px 15px;font-size:12.5px;margin:14px 0}';
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
    if (n) hint.innerHTML = '✏️ <b class="red">이 화면의 ' + n + '쪽은 여기서 고친 내용입니다</b> — 원고 파일(.md)과 다릅니다. ' +
      '원고를 고칠 때는 이 오버레이를 먼저 확인하세요. 되돌리려면 그 쪽을 비우고 화면을 벗어나세요.';
  }).catch(function () {});
})();

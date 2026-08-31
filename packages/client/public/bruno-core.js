/*
 * 브루노 할아버지네 숲 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/bruno-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'bruno';
  var ANCHOR = { slug: 'bruno-crayonwood', name: '앵커 bruno-crayonwood', text: "STYLE ANCHOR - bruno-crayonwood   (a bear cub and his grandfather in a Swedish forest / wax crayon,\n                                   snagged on the grain)\n\nStyle: wax crayon on oat-grey toothy paper, exactly TWO crayons, 4-6 year old picture book. Crayon\n  SKIPS - it catches the high points of the paper and misses the pits, so every area is a broken\n  field of wax with the paper's grain showing through and NO AREA IS EVER SOLID. Pressure is even\n  everywhere; the breaking is the paper's doing, not the hand's. Where the two crayons overlay, a\n  third darker colour appears - that is the only dark. Unwaxed paper is not white space, it is the\n  sky, the water and the snow. SHADING IS ZERO - the only variation is WHERE THE WAX SKIPPED, and\n  how much of the area it covers.\n\nRENDERING (finish hierarchy): an area is ONE field of one crayon laid in ONE direction, never denser\n  or lighter inside itself. Direction NEVER changes inside one area - it changes only where one thing\n  ends and another begins, and THAT CHANGE OF DIRECTION IS THE EDGE. FINISHED THINGS PER PAGE = 2,\n  the bear the page is about and the one thing that bear touches - 3 only when both bears are on the\n  page, and then it is the two bears and the one thing they share; everything else is a shape with no\n  interior detail. Repeats are capped and the cap is the whole design: trunks at most 9 · boughs on\n  one tree at most 7 · logs in a stack at most 6 · berries at most 9 dots · seeds at most 9 dots ·\n  planks at most 6 · cabin windows at most 4 · birds at most 3 · falling snow at most 14 bare paper\n  points · stars at most 14 bare paper points · steam at most 5 curls. Nothing in a repeat is a\n  mirrored copy of its neighbour. Wax coverage is at most 80 percent, never solid.\n  DENSITY RATION = none.\n  🔴 DEPTH IS SPACING, NEVER DARKNESS. Deeper in the wood the trunks stand CLOSER TOGETHER at the\n  same weight of wax. Nothing recedes by getting darker, paler, bluer or softer.\n  🔴 HANDS - eight volumes turn on what a paw does and the grandfather says nothing (02 · 03 · 07 ·\n  09 · 11 · 15 · 20 · 22). On those pages the paw is the second finished thing and THE FRAME MAY GO\n  IN AS CLOSE AS THE PAW ITSELF. What must never happen is losing WHOSE paw it is, and that is\n  carried two ways: THE TWO PAWS ARE DIFFERENT OBJECTS (a small round mitt with a blue boot cuff / a\n  broad flat palm with five blunt toes held apart), and the other bear stays in frame as a face or\n  two eyes at the edge. Never a paw that could belong to either bear.\n\nPALETTE: PAPER OAT GREY #E9E3D3, sky, water, ice, snow, light, everything not waxed · CRAYON1 SPRUCE\n  #4F6B4E, needles, leaves, moss, the vegetable bed, painted shutters, the grandfather's knitted\n  vest - the cool one · CRAYON2 BARK #96674A, trunks, the cabin logs, floors, tools, baskets, ground,\n  autumn leaves - the warm one · OVERLAY PEAT #2E3A2A, bear backs and heads, iron, the inside of the\n  woodshed, night, blueberries, anything in shade - overlay only, never a third crayon · ACCENT BOOT\n  BLUE #1C4E8A, 🔴 nothing but Nils's boots. 🔴 SKY, WATER, ICE AND SNOW ARE NEVER WAXED - there is\n  no pale blue anywhere and no white crayon anywhere, ever. No purple, no pink, no orange, no red.\n\nSTAGE CLAUSES (the stage changes what the two crayons do, never which two they are):\n  🔴 SPRING (volumes 01-06) - the canopy is bare PAPER; SPRUCE appears only as new growth, sparse\n    marks low down and at branch tips, coverage well under half. The ground is BARK. Melt water is\n    bare paper. Everything is at its most open and the paper does most of the work.\n  🔴 SUMMER (volumes 07-12) - SPRUCE becomes ONE field overhead covering the top of the page, at its\n    fullest coverage. BARK is the trunks and the forest floor beneath it. Blueberries are OVERLAY\n    dots, at most 9, and they are the only near-black thing in daylight.\n  🔴 AUTUMN (volumes 13-18) - THE TWO CRAYONS SWAP JOBS. BARK now takes the canopy as ONE field\n    overhead; SPRUCE retreats to at most 3 evergreens standing among the bare trunks. The ground is\n    BARK too, laid in a second field running the other way, and the change of direction is the only\n    thing that separates ground from tree. This is the fullest page in the series.\n  🔴 WINTER (volumes 19-25) - the ground and the sky are not waxed at all, BARE PAPER from edge to\n    edge, and the two crayons draw ONLY what stands on it. Snow on a bough is the paper left, with at\n    most 3 BARK marks along its underside. Ice on the lake is bare paper; the hole cut in it is\n    OVERLAY with a hard edge. There is no white crayon and no blue shadow on snow.\n  CABIN - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, cloth a zigzag.\n    The mark is the SAME shape every time and may run off an edge but is never redrawn. Beams,\n    furniture and shelves are BARK; cloth, shutters and the vest are SPRUCE. 🔴 FIRELIGHT AND\n    LAMPLIGHT ARE BARE PAPER and are the brightest thing on the page. A thing being looked for is\n    drawn with its own clear silhouette while everything it hides among is the repeated mark.\n  WATER - the brook and the lake are BARE PAPER, 0 ripples, 0 glints, 0 reflections. A thing in the\n    water is OVERLAY lying inside that bare shape, hard edge, never distorted. A thing on the water\n    sits on top with its whole shape showing. Banks, stones and logs are BARK with the marks running\n    ALONG the thing, not across it.\n  NIGHT (volumes 11, 25) - the sky is OVERLAY laid as one field. Stars, the moon and the glow-worms\n    in the grass are BARE PAPER points, each taken on its own, at most 14. 🔴 The glow-worms are\n    DOWN IN THE GRASS, never in the air.\n\nCHARACTER DESIGN LANGUAGE: the bears are built from the same marks as the world - two or three\n  shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads are\n  OVERLAY, chests and bellies are BARK - that is the material rule and it is the same for both. 🔴 THE\n  TWO BEARS ARE NOT BUILT FROM THE SAME SHAPES: filled in solid black at thumbnail size the two\n  outlines must not be one shape scaled. Each bear's own sheet says how it differs.\n  🔴 ONE ACTION DRAWN AT TWO SIZES. When both bears are on the page AND BOTH ARE WORKING, they do the\n  SAME thing at the same limb angles, one body twice the height and much wider. But THE CUB IS ALONE\n  ON MOST PAGES, and the grandfather's page is usually him showing while the cub watches - there the\n  size gap is carried ACROSS TWO PAGES (he does it, the cub does the same thing on the next page). So\n  each bear must be recognisable WITH THE OTHER ONE ABSENT.\n  Eyes are TWO SHORT WAX STROKES, never round dots - pressed and dragged a little, each ending broken\n  where the wax skipped; a nose of the same stroke; the mouth is ONE curve; above each eye ONE short\n  stroke. Feeling is in the mouth curve and the two brow strokes; an eye stroke lengthens or shuts\n  but never becomes a dot.\n  THE TWO, separable at thumbnail size: NILS a small bear cub, head as wide as his shoulders with two\n  ears standing on the crown and bare paper between them, the smaller figure by half, 🔴 BLUE BOOTS\n  in every season and the only blue in the forest · BRUNO GRANDFATHER a large bear built on a\n  straight-sided vest block, twice Nils's height and much wider but 🔴 THE TWO HEADS NEARLY THE SAME\n  SIZE, ears low at the sides so head and ears are one unbroken dome, a BARE PAPER muzzle sticking\n  out past the brow, a SPRUCE knitted vest and round glasses. 🔴 NO WALKING STICK - he does the forest work himself and his hands are always free or\n  full of the work. He never carries blue. He is only ever shown doing the same task Nils is doing.\n  🔴 THERE IS NOBODY ELSE. Birds, squirrels and fish appear as plain shapes with no clothes, no\n  eyebrows and no expression - they are weather, not cast.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.\n\nNOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no blended, smudged or scraped\n  wax / no white crayon / no close-up of a paw alone.", award: "Ross Collins · There's a Bear on My Chair" };
  var FIXED_CHARS = [
  {
    "key": "nils",
    "name": "닐스",
    "aliases": [
      "닐스",
      "Nils bear cub",
      "Nils"
    ],
    "spec": "HIS HEAD IS AS WIDE AS HIS SHOULDERS and stands ONE THIRD of his whole height. Nothing on him is\nwider than that head.\nTWO EARS SIT UP ON THE CROWN, each about a third of the head wide, WITH BARE PAPER SHOWING BETWEEN\nTHEM, so the top of his outline is two clear bumps against the sky.\nHIS FACE IS FLAT: the muzzle is a BARK patch lying inside the head circle and does NOT stick out\npast the brow, so from any angle the head still reads as one circle.\nONE ROUND MASS runs from chin to foot - no waist, no hem, NO BARE PAPER BETWEEN THE LEGS. The arms\nare short stubs held close against that mass.\n🔴 HIS OUTLINE ENDS IN TWO SQUARE BLOCKS. The BOOT BLUE boots are WIDER THAN THE LEG above them, so\nthe widest part of his lower half is the very bottom. Boots in every season, and they are the only\nblue in the book.\nFOREPAW: a small ROUND MITT, toes not separated, no wider than his own muzzle patch. In a close-up\nthat mitt - and the blue cuff when it is a foot - is how the page says the paw is his.\n🔴 HE DOES ALL THE ACTING. The mouth curve swings wide, the two brow strokes tilt hard, the arms go\nup and out away from the body. Both eye strokes stay long and open."
  },
  {
    "key": "bruno",
    "name": "브루노 할아버지",
    "aliases": [
      "브루노",
      "할아버지",
      "Bruno grandfather bear",
      "Bruno"
    ],
    "spec": "HE IS NOT A BIGGER NILS. He stands TWICE the cub's height, but THE TWO HEADS ARE NEARLY THE SAME\nSIZE - his head is ONE FIFTH of his height and HIS SHOULDERS ARE TWICE HIS HEAD WIDE. All the extra\nheight went into the body and none into the head. Stood side by side the height doubles and the\nhead barely changes; THAT ONE RATIO is what makes him an adult instead of a large cub.\n🔴 HIS EARS SIT AT THE SIDES OF THE HEAD, small, and head and ears carry on as ONE UNBROKEN DOME -\nno bare paper between them, where the cub has two bumps with sky between.\n🔴 HIS MUZZLE STICKS OUT PAST THE BROW as a blunt snout, and it is the ONE FACE IN THE BOOK LEFT AS\nBARE UNWAXED PAPER - the grey of the paper is his grey muzzle. The cub's muzzle is BARK and flat.\nTHE VEST HANGS STRAIGHT. Shoulder to hem is a STRAIGHT-SIDED BLOCK ending in a FLAT HORIZONTAL HEM,\nnever a round belly. BELOW THAT HEM TWO SEPARATE LEGS WITH BARE PAPER BETWEEN THEM - the cub has no\nsuch gap anywhere.\n🔴 HIS OUTLINE ENDS IN TWO TAPERS: bare paws NARROWER THAN THE LEG above them. The cub's bottom is\nwider than his legs and his is narrower - the two silhouettes end in opposite shapes.\nFOREPAW: a BROAD FLAT PALM with FIVE BLUNT TOES HELD APART, the open paw AS WIDE AS THE CUB'S WHOLE\nFACE. Eight volumes turn on this paw at close range with no other bear to compare it to.\nROUND GLASSES, two rings on one straight bar - the only closed rings drawn on either face.\n🔴 HIS FACE BARELY MOVES. The mouth is ONE SHORT FLAT CURVE and the two brow strokes stay LEVEL\nwhatever is happening. He does not point, does not throw both arms up, does not lean in. The cub\nover-acts and he does not; that gap is the other half of the size gap.\n🔴 NO BLUE ANYWHERE ON HIM, no walking stick, and nothing of his own in his hands on the sheet."
  }
];
  var FACE = {"nils":"🐻","bruno":"🐻"};

  (function injectCss() {
    if (document.getElementById('sr-core-style')) return;
    var css = [
      '.batch-bar{background:#fff;border:1.5px solid var(--slope);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.batch-bar .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.batch-bar .bhint{font-size:12px;color:var(--ink-soft);margin-bottom:12px;line-height:1.6;}',
      '.batch-bar .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.batch-btn{background:var(--slope);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.batch-btn:hover{filter:brightness(1.15);}.batch-btn.done{background:var(--accent);}',
      '.anchor-chip{display:inline-block;background:var(--peach);border-radius:999px;padding:2px 11px;font-size:11.5px;font-weight:800;margin-left:6px;}',
      '.guest-section{background:#fff;border:1.5px solid var(--accent);border-radius:16px;padding:18px 20px;margin:16px 0 24px;}',
      '.guest-section h3{font-size:16px;font-weight:900;color:var(--accent);margin:0 0 6px;}',
      '.guest-section .ghint{font-size:12px;color:var(--ink-soft);line-height:1.6;margin-bottom:12px;}',
      '.guest-section .char-prompt{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0;background:var(--cream);}',
      '.guest-section .char-prompt .head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.guest-section pre{white-space:pre-wrap;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:12px;line-height:1.6;margin-top:6px;color:var(--ink-soft);}',
      '.ref-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:8px 12px;margin:0 0 22px;}',
      '.ref-strip .ref-lab{font-size:11.5px;font-weight:800;color:var(--ink-soft);flex:0 0 auto;margin-right:2px;}',
      '.ref-chip{display:flex;align-items:center;gap:6px;background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:3px 11px 3px 3px;}',
      '.ref-chip img{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#fff;flex:0 0 auto;}',
      '.ref-chip .ph{width:30px;height:30px;border-radius:50%;background:var(--peach);display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;}',
      '.ref-chip b{font-size:11.5px;font-weight:800;color:var(--ink);white-space:nowrap;}',
      '.ref-chip .im{color:var(--accent);font-weight:900;}.ref-chip.guest{border-color:var(--accent);}',
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:#fff;z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}#ep-summary{font-size:12px;color:var(--ink-soft);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft);padding:2px 4px;}',
      '.ep-plan{display:block;margin:10px 12px 6px;padding:10px 13px;border-radius:10px;background:var(--peach);color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;border:1px solid var(--line);}',
      '.ep-plan:hover,.ep-plan.active{background:var(--accent);color:#fff;border-color:var(--accent);}',
      '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1f1f1;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--accent);text-decoration:underline;}.ep-item.active a{color:var(--accent);font-weight:800;}',
      '.ep-item.done a{text-decoration:line-through;color:var(--ink-soft);}',
      '.ep-badge,.ep-memo{flex:0 0 auto;cursor:pointer;border:0;background:transparent;line-height:1;padding:3px;border-radius:6px;}',
      '.ep-badge{font-size:15px;}.ep-memo{font-size:14px;opacity:.35;}.ep-memo.has{opacity:1;}',
      '.ep-badge:hover,.ep-memo:hover{background:#f1f1f1;}',
      '#ep-memo-modal{position:fixed;inset:0;z-index:1003;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;padding:16px;}',
      '#ep-memo-modal.on{display:flex;}',
      '#ep-memo-modal .box{background:#fff;border-radius:14px;width:min(480px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;}',
      '#ep-memo-modal .mhead{padding:14px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:15px;word-break:keep-all;}',
      '#ep-memo-modal textarea{border:0;outline:none;resize:none;padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.6;min-height:180px;flex:1;background:#fff;}',
      '#ep-memo-modal .mrow{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line);}',
      '#ep-memo-modal button{border:0;border-radius:9px;padding:9px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '#ep-memo-modal .save{background:var(--accent);color:#fff;}#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'sr-core-style'; s.textContent = css;
    document.head.appendChild(s);
  })();

  var GUESTS = (window.SH_GUESTS || []).slice();
  var ALL = FIXED_CHARS.concat(GUESTS);
  var NF = FIXED_CHARS.length;
  ALL.forEach(function (c, i) { c.img = i < NF ? i + 1 : i - NF + 9; });
  var IS_GUEST = {}; GUESTS.forEach(function (g) { IS_GUEST[g.key] = true; });

  // 🔴 **긴 별칭부터 찾고, 찾은 자리는 지운다.** 인물마다 따로 부분문자열을 찾으면
  //    「타로 엄마가 …」 한 줄에서 **타로도 같이 걸린다**(타로 ⊂ 타로 엄마). 그러면 엄마만 나오는
  //    쪽의 [등장]에 아이가 붙어 화가가 없는 인물을 그린다. 이름을 바꿔서는 못 푼다 —
  //    「타로 엄마」에는 어차피 「타로」가 들어 있다. 빌더의 별칭 충돌 가드는 그대로 두되(설계 경고),
  //    감지는 여기서 정확해진다.
  function detectChars(sceneText) {
    var rest = String(sceneText || '').toLowerCase();
    var pairs = [];
    ALL.forEach(function (c) {
      (c.aliases || [c.name]).forEach(function (n) { pairs.push({ key: c.key, n: String(n).toLowerCase() }); });
    });
    pairs.sort(function (a, b) { return b.n.length - a.n.length; });
    var found = {};
    pairs.forEach(function (p) {
      if (!p.n) return;
      var at = rest.indexOf(p.n);
      while (at !== -1) {
        found[p.key] = true;
        // 지운 자리는 같은 길이의 공백으로 — 뒤 별칭의 위치가 안 밀린다
        rest = rest.slice(0, at) + new Array(p.n.length + 1).join(' ') + rest.slice(at + p.n.length);
        at = rest.indexOf(p.n);
      }
    });
    return found;
  }

  function sceneHasChar(sceneText, c) {
    return detectChars(sceneText)[c.key] === true;
  }

  // 🔴 이름만 적으면 시트를 안 붙였을 때 모델이 알아서 그린다 — 코코는 시트가 정확한데도 쪽마다
  //    몸 색이 갈색·파랑으로 갈렸다(2026-08-17 사용자). 손으로 쓴 코코·메이 프롬프트는 이 자리에
  //    인물 설명을 한 줄씩 달고 있었고, 생성기가 그걸 안 물려받았다. 규격 첫 줄을 같이 싣는다.
  function castLegend(pages) {
    return ALL.map(function (c) {
      var on = !pages || pages.some(function (p) { return sceneHasChar(p.scene, c); });
      var gist = String(c.spec || c.desc || '').replace(/^[-•\s]+/, '').split('\n')[0].slice(0, 110);
      return '@image' + c.img + ' = ' + c.name + (c.aliases[1] ? ' (' + c.aliases[1] + ')' : '') +
        (gist ? ': ' + gist : '') + (on ? '' : '  (이 화 미등장 — 첨부 불필요)');
    }).join('\n');
  }

  function composeBatchPrompt(pages) {
    var head = [
      ANCHOR.text,
      '',
      '[캐릭터 레퍼런스] 위 CHARACTER DESIGN LANGUAGE 는 이 세계 전체의 규격이고, 각 인물의 규격은 첨부한 시트다.',
      '아래 @imageN 순서대로 시트를 첨부하고,',
      '얼굴·비율·색은 시트와 100% 동일하게 유지한다. @image1~' + NF + ' = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
      castLegend(pages),
      '※ 각 쪽 [등장]에 적힌 @imageN 만 그 컷에 그린다. 나머지는 넣지 않는다.',
      '',
      '[출력 규칙]',
      '- 아래 ' + pages.length + '개 장면을 각각 독립된 16:9 스프레드로 그린다 (총 ' + pages.length + '장, 쪽 순서대로).',
      '- 같은 인물의 얼굴·비율·색을 모든 장면에서 동일하게 유지한다.',
      '- 🔴 그림 안에 글자·숫자·문자를 절대 넣지 않는다.',
    ].join('\n');
    var body = pages.map(function (p) {
      var on = ALL.filter(function (c) { return sceneHasChar(p.scene, c); });
      var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
      return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경/사물 컷)') + '\n' + p.scene.trim();
    }).join('\n\n');
    return head + '\n\n' + body;
  }

  /** 캐릭터 한 명 시트. 고정 캐스트·단역 공용 — 기획서 카드도 이걸 부른다(사본 금지). */
  function sheetPrompt(charOrKey) {
    var g = typeof charOrKey === 'string' ? ALL.find(function (c) { return c.key === charOrKey; }) : charOrKey;
    if (!g) return '';
    // 🔴 시트는 마젠타 배경에 인물 하나다 — 무대 조항(마을·비·물·밤)이 들어갈 자리가 없고,
    //    개체를 가르라는 지시를 그만큼 묽게 만든다. 컷 프롬프트(composeBatchPrompt)에서는 그대로 쓴다.
    var world = ANCHOR.text.replace(/\nSTAGE CLAUSES[\s\S]*?(?=\n[A-Z])/, '');
    return [
      world,
      '',
      // 🔴 매체는 글로 안 전해진다. 유키 시트는 아이가 부드러운 그러데이션 카툰, 할머니가 접힘을 다
      //    그린 사실화로 나왔다 — 앵커에 `SHADING IS ZERO`·`한 획을 두 번 덧긋지 않는다` 가 있는데도.
      //    단권 99권은 화면에 수상작 원본이 떠 있었고 시리즈는 글만 있었다. 그림 한 장이 그 자리를 메운다.
      ANCHOR.award ? '[매체 참조] 🔴 이 프롬프트와 함께 **앵커 원본 그림 한 장을 반드시 첨부**한다 — '
        + ANCHOR.award + '. 획·자국·결·가장자리는 아래 글이 아니라 그 그림이 정한다.' : null,
      '[출력] 정사각 1024x1024. 배경은 순수 마젠타 #FF00FF 단색, 인물을 가운데 두고 여백 8%.',
      '바닥 그림자 없음, 글자·라벨 없음, 다른 인물 없음.',
      '[인물] ' + g.name + (g.aliases[1] ? ' — ' + g.aliases[1] : '') + '. 위 CHARACTER DESIGN LANGUAGE 의 규격을 그대로 따른다.',
      // 🔴 이 줄이 없으면 한 시리즈의 넷이 **이름만 다른 같은 지시**를 받는다. 앵커는 그 세계 전체를
      //    말하지 한 사람을 말하지 않으므로, 개체를 가르는 것은 여기서 들어와야 한다.
      g.spec ? '[이 인물만의 규격 — 위 규격에 덧쓴다]\n' + g.spec : null,
      '[배치] 같은 인물을 한 장에 — 전신 정면, 3/4 걷는 모습, 뒷모습. 이 인물 하나만.',
    ].filter(function (l) { return l !== null; }).join('\n');
  }

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

  function makePasteBox(assetApi, key, initialUrl) {
    var box = document.createElement('div'); box.className = 'paste-box'; box.tabIndex = 0;
    var hint = '🖼️ 클릭 후 Ctrl+V — 생성한 그림 붙여넣기';
    function reset() { box.classList.remove('has-img'); box.innerHTML = ''; box.textContent = hint; }
    function setImg(url) {
      box.classList.add('has-img');
      box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del">✕</button>';
      box.querySelector('.paste-del').addEventListener('click', async function (e) {
        e.stopPropagation(); if (!confirm('이 이미지를 삭제할까요?')) return;
        try { await fetch(assetApi + '/' + key, { method: 'DELETE' }); reset(); } catch (err) { alert('삭제 실패 — 서버 확인'); }
      });
    }
    if (initialUrl) setImg(initialUrl + '?t=' + Date.now()); else box.textContent = hint;
    async function upload(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      box.classList.add('busy'); var fr = new FileReader();
      fr.onload = async function () {
        try {
          var r = await fetch(assetApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, dataUrl: fr.result }) });
          var j = await r.json();
          if (j.success) setImg(j.data.url + '?t=' + Date.now()); else alert('저장 실패: ' + (j.error || ''));
        } catch (e) { alert('저장 실패 — 서버 확인'); }
        box.classList.remove('busy');
      };
      fr.readAsDataURL(file);
    }
    box.addEventListener('paste', function (e) {
      var its = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < its.length; i++) if (its[i].type && its[i].type.indexOf('image/') === 0) { e.preventDefault(); upload(its[i].getAsFile()); return; }
    });
    box.addEventListener('dragover', function (e) { e.preventDefault(); });
    box.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) upload(f); });
    box.addEventListener('click', function () { box.focus(); });
    return box;
  }

  async function mountPasteSlots(docId, root) {
    var api = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(api); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-paste]'), function (slot) {
      var k = slot.getAttribute('data-paste');
      slot.appendChild(makePasteBox(api, k, assets[k]));
    });
  }

  window.SERIES = { key: KEY, anchor: ANCHOR, cast: FIXED_CHARS, copyText: copyText, sheetPrompt: sheetPrompt, mountPasteSlots: mountPasteSlots };

  // ── 좌측 회차 사이드바 (상태·메모는 /api/saenghwal-* 공유, docId 가 달라 무충돌) ──
  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 회차';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML = '<div class="ep-head"><b>회차 목록</b><span id="ep-summary"></span>' +
      '<button id="ep-close" type="button" aria-label="닫기">✕</button></div>' +
      '<a class="ep-plan" href="/' + KEY + '-plan.html">📘 기획서 · 캐스트 시트 · 앵커</a><div id="ep-list"></div>';
    document.body.appendChild(toggle); document.body.appendChild(backdrop); document.body.appendChild(side);
    var list = side.querySelector('#ep-list'), summary = side.querySelector('#ep-summary');
    function open(o) { document.body.classList.toggle('ep-open', o); }
    toggle.addEventListener('click', function () { open(!document.body.classList.contains('ep-open')); });
    backdrop.addEventListener('click', function () { open(false); });
    side.querySelector('#ep-close').addEventListener('click', function () { open(false); });

    var STATUS_API = '/api/saenghwal-status', MEMO_API = '/api/saenghwal-memo';
    var status = {}, memo = {};
    try { var rs = await fetch(STATUS_API); var js = await rs.json(); status = (js && js.data) || {}; } catch (e) {}
    try { var rm = await fetch(MEMO_API); var jm = await rm.json(); memo = (jm && jm.data) || {}; } catch (e) {}

    var modal = document.createElement('div'); modal.id = 'ep-memo-modal';
    modal.innerHTML = '<div class="box"><div class="mhead"></div><textarea placeholder="이 회차 메모…"></textarea>' +
      '<div class="mrow"><button class="cancel" type="button">취소</button><button class="save" type="button">저장</button></div></div>';
    document.body.appendChild(modal);
    var mHead = modal.querySelector('.mhead'), mTa = modal.querySelector('textarea'), cur = null;
    function closeModal() { modal.classList.remove('on'); cur = null; }
    function openMemo(docId, title, onSaved) {
      cur = { docId: docId, onSaved: onSaved }; mHead.textContent = title;
      mTa.value = memo[docId] || ''; modal.classList.add('on');
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
    try { var ri = await fetch('/' + KEY + '-index.json', { cache: 'no-store' }); idx = await ri.json(); } catch (e) {}
    var eps = idx.filter(function (e) { return e.file && e.file !== KEY + '-plan.html'; }).map(function (e) {
      var m = (e.label || '').match(/(\d+)/);
      return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || e.label };
    }).sort(function (a, b) { return a.num - b.num; });

    var here = location.pathname.split('/').pop() || '';
    if (here === KEY + '-plan.html' || here === '') {
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
      mbtn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        openMemo(e.docId, e.title, function (has) { mbtn.classList.toggle('has', has); });
      });
      var badge = document.createElement('button');
      badge.type = 'button'; badge.className = 'ep-badge'; badge.textContent = ICON[s]; badge.title = LABEL[s] + ' (클릭하여 변경)';
      badge.addEventListener('click', async function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var prev = status[e.docId] || '', next = CYCLE[prev];
        if (next) status[e.docId] = next; else delete status[e.docId];
        badge.textContent = ICON[next]; badge.title = LABEL[next] + ' (클릭하여 변경)';
        row.classList.toggle('done', next === 'done'); updateSummary();
        try {
          var r = await fetch(STATUS_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId: e.docId, status: next }) });
          if (!r.ok) throw new Error('http');
        } catch (err) {
          if (prev) status[e.docId] = prev; else delete status[e.docId];
          badge.textContent = ICON[prev]; row.classList.toggle('done', prev === 'done'); updateSummary();
          alert('상태 저장 실패 — 서버 확인');
        }
      });
      row.appendChild(n); row.appendChild(a); row.appendChild(mbtn); row.appendChild(badge);
      list.appendChild(row);
    });
    updateSummary();
    if (window.innerWidth >= 1024) open(true);
  })();

  // ── 전체 묶음 프롬프트 + 쪽별 복사 + 붙여넣기 ──
  (async function () {
    var pages = collectPages();
    if (!pages.length) return;

    var hero = document.querySelector('header.hero');
    if (hero) {
      var bar = document.createElement('div');
      bar.className = 'batch-bar';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에<span class="anchor-chip">' + ANCHOR.name + '</span></div>' +
        '<div class="bhint">버튼을 누르면 <b>앵커(1회) + 캐릭터 레퍼런스(@image1~' + NF + ') + ' + pages.length +
        '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 캐스트 시트를 첨부</b>하세요. 각 쪽 [등장]이 그 컷에 넣을 인물을 지정합니다.</div>' +
        '<div class="brow"><button type="button" class="batch-btn" id="copy-all-scene">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      hero.parentNode.insertBefore(bar, hero.nextSibling);
      document.getElementById('copy-all-scene').addEventListener('click', function () {
        copyText(composeBatchPrompt(pages.map(function (p) { return { label: p.label, scene: p.scene }; })), this);
      });
    }

    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (!btn) return;
      var clone = btn.cloneNode(true); btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function () { copyText(composeBatchPrompt([{ label: p.label, scene: p.scene }]), clone); });
    });

    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var ASSET_API = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(ASSET_API); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}

    (function () {
      var appearing = ALL.filter(function (c) { return pages.some(function (p) { return sceneHasChar(p.scene, c); }); });
      if (!appearing.length) return;
      var strip = document.createElement('div');
      strip.className = 'ref-strip';
      strip.innerHTML = '<span class="ref-lab">🎬 이 화 등장</span>' + appearing.map(function (c) {
        var url = IS_GUEST[c.key] ? assets[c.key] : null;
        var thumb = url ? '<img src="' + url + '?t=' + Date.now() + '" alt="" />' : '<span class="ph">' + (FACE[c.key] || '🎭') + '</span>';
        return '<div class="ref-chip' + (IS_GUEST[c.key] ? ' guest' : '') + '" data-key="' + c.key + '">' + thumb +
          '<b><span class="im">@image' + c.img + '</span> ' + c.name + '</b></div>';
      }).join('');
      var first = document.querySelector('.page-card');
      if (first) first.parentNode.insertBefore(strip, first);
      fetch('/api/comic-assets/' + KEY + '-plan').then(function (r) { return r.json(); }).then(function (j) {
        var plan = (j && j.data) || {};
        appearing.forEach(function (c) {
          if (IS_GUEST[c.key] || !plan[c.key]) return;
          var box = strip.querySelector('.ref-chip[data-key="' + c.key + '"]');
          var ph = box && box.querySelector('.ph');
          if (ph) ph.outerHTML = '<img src="' + plan[c.key] + '?t=' + Date.now() + '" alt="" />';
        });
      }).catch(function () {});
    })();

    pages.forEach(function (p) { p.card.appendChild(makePasteBox(ASSET_API, p.page, assets[p.page])); });

    if (GUESTS.length) {
      var sec = document.createElement('div');
      sec.className = 'guest-section';
      sec.innerHTML = '<h3>🎭 이 화 새 인물(단역) 레퍼런스</h3>' +
        '<div class="ghint">이 화에만 나오는 단역입니다(@image9~). ① [시트 프롬프트 복사] → GPT로 시트 생성 → ② 아래 박스에 붙여넣어 확정하세요. <b>@image1~' + NF + ' 고정 캐스트 시트는 📘 기획서에서.</b></div>' +
        GUESTS.map(function (g) {
          return '<div class="char-prompt" data-guest="' + g.key + '"><div class="head"><b>@image' + g.img + ' · ' + g.name + '</b>' +
            '<button type="button" class="copy-btn">📋 시트 프롬프트 복사</button></div>' +
            '<details><summary>프롬프트 보기</summary><pre></pre></details></div>';
        }).join('');
      var firstPage = document.querySelector('.page-card');
      if (firstPage) firstPage.parentNode.insertBefore(sec, firstPage);
      GUESTS.forEach(function (g) {
        var card = sec.querySelector('.char-prompt[data-guest="' + g.key + '"]');
        card.querySelector('pre').textContent = sheetPrompt(g);
        var btn = card.querySelector('.copy-btn');
        btn.addEventListener('click', function () { copyText(sheetPrompt(g), btn); });
        card.appendChild(makePasteBox(ASSET_API, g.key, assets[g.key]));
      });
    }
  })();
})();

/* 본문 인라인 편집 — 브라우저에서 고쳐 R2 에 저장한다.
 * 🔴 SSOT 는 docs/changjak-books/bruno/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'bruno';
  var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (docId.indexOf(KEY + '-') !== 0 || !/\d+$/.test(docId)) return;
  var API = '/api/changjak-text/' + docId;

  var st = document.createElement('style');
  st.textContent =
    '.page-card p.ko{outline:none;border-radius:8px;margin:8px -6px 10px;padding:4px 6px;transition:background .12s}' +
    '.page-card p.ko:hover,.page-card p.ko:focus{background:#fff6ec}' +
    '.page-card p.ko:focus{box-shadow:0 0 0 2px var(--peach)}' +
    '.page-card{position:relative}' +
    '.ko-tag{position:absolute;top:14px;right:16px;font-size:10.5px;font-weight:800;opacity:0;transition:opacity .15s;pointer-events:none}' +
    '.ko-tag.on{opacity:1}.ko-tag.saving{color:var(--ink-soft)}.ko-tag.saved{color:var(--slope)}.ko-tag.err{color:var(--accent)}' +
    '.ko-edited{border-color:var(--accent)}' +
    '.edit-hint{background:#FDF3EC;border:1px solid var(--accent);border-radius:12px;padding:11px 15px;font-size:12.5px;margin:14px 0}';
  document.head.appendChild(st);

  var hint = document.createElement('div');
  hint.className = 'edit-hint';
  hint.innerHTML = '✏️ <b>본문을 눌러 바로 고칠 수 있습니다.</b> 고친 내용은 R2 에 저장되어 이 화면에만 얹힙니다 — <b>원고 파일(.md)은 안 바뀝니다.</b> 되돌리려면 내용을 비우고 화면을 벗어나세요.';

  var cards = Array.prototype.slice.call(document.querySelectorAll('.page-card[data-page]'));
  if (!cards.length) return;
  cards[0].parentNode.insertBefore(hint, cards[0]);

  var items = cards.map(function (card) {
    var ko = card.querySelector('p.ko');
    if (!ko) return null;
    var page = card.dataset.page, base = ko.innerText.replace(/\s+$/, '');
    var tag = document.createElement('span'); tag.className = 'ko-tag'; card.appendChild(tag);
    ko.contentEditable = 'plaintext-only';
    var timer = null, saved = base;
    function mark(cls, txt) {
      tag.className = 'ko-tag on ' + cls; tag.textContent = txt;
      if (cls !== 'saving') setTimeout(function () { tag.className = 'ko-tag'; }, 1600);
    }
    function save() {
      var text = ko.innerText.replace(/\s+$/, '');
      if (text === saved) return;
      mark('saving', '저장 중…');
      fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: page, text: text === base ? '' : text }) })
        .then(function (r) {
          if (!r.ok) throw new Error('http');
          saved = text; card.classList.toggle('ko-edited', text !== base);
          mark('saved', text === base ? '원본 복귀' : '저장됨');
        }).catch(function () { mark('err', '저장 실패 — 서버 확인'); });
    }
    ko.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(save, 900); });
    ko.addEventListener('blur', function () { clearTimeout(timer); save(); });
    return { page: page, apply: function (t) { ko.innerText = t; saved = t; card.classList.add('ko-edited'); } };
  }).filter(Boolean);

  fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    var d = (j && j.data) || {}, n = 0;
    items.forEach(function (it) { if (typeof d[it.page] === 'string' && d[it.page] !== '') { it.apply(d[it.page]); n++; } });
    if (n) hint.innerHTML = '✏️ <b>이 화면의 ' + n + '쪽은 여기서 고친 내용입니다</b> — 원고 파일(.md)과 다릅니다. 되돌리려면 그 쪽을 비우고 화면을 벗어나세요.';
  }).catch(function () {});
})();

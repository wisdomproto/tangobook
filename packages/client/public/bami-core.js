/*
 * 밤이네 기차 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/bami-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'bami';
  var ANCHOR = { slug: 'bami-lamplight', name: '앵커 bami-lamplight', text: "STYLE ANCHOR - bami-lamplight   (Bami's little train / opaque gouache on dark paper, painted only as far as the light reaches)\n\nStyle: opaque gouache on warm dark-taupe paper, a picture book read aloud to children of four to six.\n  🔴 HERE THE PAPER IS THE DARK. Night, shadow, fog, the far side and the unlit half of every thing are\n  bare paper; an owl's back, a wooden wall and a guest's fur are paper left alone. LIGHT IS PAINT: a\n  thing is bright because an opaque patch was put on it, flat, matte, one pass, hard cut edge. No wash,\n  no fade, no glow - a lamp does not radiate, it lays a shape of paint on what it reaches and stops.\n  Past the reach of the light nothing is painted and nothing is drawn.\n\nRENDERING (finish hierarchy): one measure, HOW FAR THE LIGHT REACHES, gives all three finishes.\n  (1) THE CHILD, AND THE ONE THING THE PAGE TURNS ON - fully reached: a lit patch of LAMP or FROST on the\n  side facing the light, and INSIDE the patch the IRON marks that say what it is (eyes, beak, feather\n  marks, cap peak) - 5 to 12 marks on a figure, 0 to 4 on a thing. (2) THE PLACE - reached in part:\n  ONE flat lit patch per thing, on its top or its lamp side, with 0 marks inside it: a table is one plank\n  of light, a wall one strip under its lamp, a bunk one plank. (3) WHAT THE LIGHT DOES NOT REACH: bare\n  paper, or one flat IRON silhouette with nothing inside.\n  🔴 A FIGURE IS THE ONLY THING WHOSE LIT PATCH HAS MARKS INSIDE IT - that is how it is found on any page.\n  FINISHED THINGS PER PAGE = 2. DENSITY RATION = none; each volume names its quiet spread in its own cut.\n  AT MOST: lamps lit 3 (a lit window seen from outside is a patch, not a lamp) · lit patches on the place\n  9, never touching, paper between them · lit windows in a train seen from outside 9 · umbrellas 7 · lost\n  things 9 · leaf marks 30 · snowflakes 20 · blossom dabs 30 · rain strokes 24 · flowers 12 · steam\n  strokes 5 · foam strokes 5.\n  🔴 FOG, STEAM, SMOKE AND BREATH ON GLASS ARE THE ONE SOFT THING: FROST dragged nearly dry so the paper\n  shows through the stroke - the only place paint and paper mix, never a wet blend, and it lies OVER a\n  finished thing, never instead of one.\n\nPALETTE (only these): PAPER #75695F warm taupe - the dark, the unlit, the body of every owl, the cat, the\n  wood and the walls · LAMP #F4DFA4 warm light - lamps, the stove and firebox mouths, sun on a thing, the\n  headlamp, the lit windows, autumn leaves · FROST #D6DEE2 cool light - day sky, snow, fog, steam, the\n  moon, blossom, water, cloth · IRON #27221E the one dark darker than the paper - rails, the train's body,\n  the stove, the signal, the bell, every drawn mark; 🔴 IRON NEVER RUNS ROUND A THING AS AN OUTLINE. No\n  white, black, grey or brown paint exists: white is FROST, black is IRON, grey is dry-dragged FROST, brown\n  is the paper. AT MOST FOUR PAINTED COLOURS ON A PAGE, ACCENT INCLUDED. 🔴 WOOL TEAL #1F9E92 IS THE\n  ACCENT, ONE IN ALL TWENTY-FIVE VOLUMES - Bami's knitted scarf and nothing else: not a signal glass, a\n  guest's coat, a flower, the sky or water. It is on every page Bami is on, and its place is the weather:\n  round the neck (cold), knotted at the belly (warm), on the peg by the stove (asleep).\n\nSTAGE CLAUSES (one small train that is the family's home, the station it stands at, and the one view\n  through its windows, in all twenty-five volumes):\n  🔴 THE TRAIN IS THE HOUSE - the engine, then DINING CAR, SLEEPING CAR (wash corner at its far end) and\n    GOODS VAN in that order, joined by open passages, one roof over all. Half of every volume is seen from\n    INSIDE a car; a cut carries one place clause below, never two.\n  🔴 A CAR SEEN FROM INSIDE - the wall is paper and a lamp is the only light: ONE LAMP patch on the table,\n    sill or floor, one on the near wall, one on the child; the far end of the car is bare paper. THE WINDOW\n    IS A HOLE IN THE LIT WALL: by night nothing is painted inside it - it is paper showing through the LAMP\n    strip round it - and only the view's own marks may enter it (moon disc, snow dots, a far station lamp).\n    By day the window is a FROST rectangle and the sun comes in as ONE patch in the window's exact shape on\n    the floor or table, cut across whatever it crosses. Breath and steam on the glass = dry-dragged FROST\n    over the hole; a wiped place is one hard FROST shape; a drawing in the steam is IRON marks inside it.\n  🔴 RUNNING = ONE TILT. While the train runs, every hung thing - lamp, strap, the scarf on its peg, a cup\n    on its hook - leans the same way at one angle, 5 to 15 degrees, one angle per page, and what lies loose\n    has slid to that side; Nabi lies along the lean. When the train stands, all of it hangs plumb. Nothing\n    streaks, blurs, doubles or shakes: the tilt is the whole difference between running and standing.\n  ENGINE CAB - Dad's place: the firebox IRON with a LAMP mouth, the brightest thing in the train, its light\n    on Dad's face disc and the big handle (one LAMP bar); whistle cord IRON. Dad is seen from behind in\n    three-quarter or through the cab door, never from outside the cab while the train runs.\n  DINING CAR - the stove IRON with a LAMP mouth, its light stopping at the near table and the cat; table\n    one LAMP plank; lunchbox one FROST rectangle with one IRON lid line; cup one FROST shape; the window\n    seat is the one seat with a lit patch. Mom's apron and the scarf's peg are here.\n  SLEEPING CAR - two bunks, paper, one LAMP plank each; the round window a FROST disc by day, paper by\n    night; the small lamp the smallest LAMP disc in the train and the last lit patch of any evening; toy\n    box IRON. WASH CORNER: basin one FROST shape; the big tub one FROST shape with foam at most 5\n    dry-dragged strokes; towel FROST; toothbrush one IRON mark.\n  GOODS VAN - the darkest place: only what stands in the door's light is painted - broom, umbrellas, the\n    lost-property box and the guests' luggage, at most 9 flat IRON silhouettes with one LAMP patch on the\n    thing looked for.\n  PASSAGE - two paper floor plates with one IRON gap line between, the handrail one IRON bar with a LAMP\n    strip where the lamp reaches it, doors IRON frames; the wind is the one dry-dragged FROST stroke indoors.\n  ROOF - Ppippi's place and the chimney's: chimney IRON, smoke at most 5 dry-dragged FROST strokes trailing\n    back. While the train runs nothing is on the roof but Ppippi and smoke; an owl stands there only while\n    the train stands.\n  🔴 THE TRAIN SEEN FROM OUTSIDE - it never fits, cropped by at least one page edge, and it always faces\n    right, the engine at the right end. By night THE TRAIN IS ITS WINDOWS: a row of LAMP squares, at most\n    9, in an IRON body otherwise unpainted, the headlamp one LAMP disc throwing one hard cone along the\n    track. By day one IRON shape with one LAMP patch on its sun side and FROST windows. Rails two IRON lines\n    along the bottom edge, never painted light. The train is the largest IRON thing on any page it is on.\n  STATION (one a volume, where guests get on) - the platform line ONE straight LAMP stroke the whole width,\n    the only straight LAMP line on the page and the \"yellow line\" of the text, the train standing along it\n    at the right; signal IRON post, one arm, one LAMP glass; lamp post IRON with a LAMP disc; the station\n    house paper at the left with one LAMP ticket window and a face disc in it. ONE thing names the station:\n    the terminus a big FROST clock disc with two IRON hands · Granny's station a flower bed of at most 12\n    dabs · the kindergarten a gate · the crossing an IRON barrier arm and bell. The bell that starts the\n    train hangs IRON in the cab by the big handle, its rope reaching Bami's foot; ticket one FROST rectangle held\n    in a foot; flag FROST; mailbox IRON.\n  🔴 THE WINDOW VIEW = THE VOLUME'S SEASON, ONE A VOLUME - the same view in every window and on every\n    outside page of that book; it is WHERE THE COOL PAINT LIES AND HOW MUCH PAPER IT COVERS. SPRING FIELD:\n    FROST dabs on branches, 12 to 30, none on the ground. SUMMER SHORE: FROST is sky and sea above the sill,\n    a third of the view or more, one straight FROST line between them. AUTUMN HILL: no FROST in the view,\n    LAMP as 12 to 30 leaf marks, the sky paper. MOUNTAIN BEND: the track curves so the train's own tail\n    shows in the view - the one view with the train seen from inside and outside at once. TUNNEL: the view\n    is bare paper even by day and the lamps inside are all the light there is; the pages before and after\n    hold one FROST arch. RIVER BRIDGE: IRON girders across the view, one straight FROST stroke of water\n    below. SNOW FIELD: FROST fills the view edge to edge, falling snow at most 20 dots.\n  🔴 TIME OF DAY = WHO IS DOING THE LIGHTING. DAY: the view is a FROST field and each thing gets ONE patch\n    on its sun side. EVENING (most pages): the view is paper, the lamps are LAMP, and a thing is painted\n    only where a lamp reaches it; a lamp's reach is a hard-edged cone or disc cut straight through whatever\n    it crosses. MORNING FOG: the view goes under one dry-dragged FROST scumble; nothing in the fog is drawn.\n  🔴 THE CLOCK OF THE DAY IS THE LAMPS. MORNING: the first whistle - steam 5 strokes over a FROST scumble -\n    and the train moves. EVENING: the train stands at the terminus and it is bedtime - THE LAMPS GO OUT ONE\n    BY ONE, each page one fewer lit window in the row, the last page one small lamp in the sleeping car and\n    nothing else lit. No clock face is ever read.\n  🔴 THE DRIVER IS DAD, the owl with the cap. THE STATIONMASTER of the terminus is an ox, the same face in\n    every volume he is in, on the platform with a FROST flag in one hoof, never in the cab.\n\nCHARACTER DESIGN LANGUAGE: 🔴 THE OUTLINE CARRIES THE FEELING - NOT THE EYES. An owl says what it feels\n  with the width of its body and the tilt of its face: at ease = round, the body below the head as wide as\n  it is tall · startled = drawn up thin and tall, half its easy width, feathers flat · curious = the face\n  disc tilted off the body's vertical, up to a right angle, body unchanged · pleased = one straight IRON\n  lid line across the top of both eyes, body round · cold or cross = puffed wider than tall.\n  EYES: two IRON discs, each as wide as the beak is long, identical on every page of every volume - open,\n  half-lidded or shut, never bigger or smaller, no pupil, no eyebrow, no white; both shut = asleep and\n  nothing else. The beak is one IRON mark, never a smile line.\n  🔴 THE FACE DISC IS PAINTED WHETHER OR NOT THE LIGHT REACHES IT: FROST by day and in fog, LAMP by\n  lamplight - it takes the colour of the nearest light, and the eyes and beak sit in it. The rest of an\n  owl is paper except its lit side.\n  GRADE: owls stand upright on two feet and walk. 🔴 WINGS ARE WINGS - no hands, fingers or sleeves: a wing\n  spreads, folds, shields the eyes from a lamp, covers the child in rain. 🔴 WHATEVER IS HELD IS HELD IN A\n  FOOT WHILE THE OWL STANDS ON THE OTHER - bell rope, flag pole, ticket, cup, suitcase handle: an owl at\n  work is an owl on one foot. They fly only between a car door, the platform and the roof, never over the\n  track and never off a running train.\n  WORN, ONE THING EACH: Dad the driver's cap, IRON peak and band on a paper crown · Mom a FROST apron ·\n  Bami the teal scarf · Nabi and Ppippi nothing. No adult ever carries the scarf.\n  🔴 GROWN OWLS HAVE EAR TUFTS - two IRON points at the crown - AND BAMI HAS NONE: Bami is the one owl\n  whose outline has no points, and the fluffiest edge in the cast. Dad is tall and narrow, Mom wide and\n  low; the two are told apart filled solid, not by cap or apron.\n  NABI the cat: four legs, no clothing, cat proportions, claws never out, and 🔴 NEVER STANDING - lying,\n  sitting or stretched on every page, the lowest and longest figure there is; her eyes are two LAMP\n  dots, the smallest LAMP marks in the book, shut whenever Ppippi is within reach.\n  PPIPPI the sparrow: thumb-sized against Bami, 🔴 THE HIGHEST FIGURE ON ANY PAGE it is on - in the air or\n  on the highest edge, never on the ground; chatter is the beak open, nothing drawn coming out.\n  🔴 GUESTS: one party a volume, one sheet a species, and A GUEST IS KNOWN BY ITS LUGGAGE - one bag, case,\n  basket or bundle touching it on every page it is on, and nobody in the cast ever owns one; the\n  stationmaster's flag is his luggage. A guest's coat is FROST, LAMP or IRON, never the accent. Guests\n  take the owls' rules for eyes and marks, and their own animal's for feet. A guest boards at the station\n  and is never seen getting on or off a running train.\n\nCANVAS: 16:9 double-page spread. 🔴 NO LETTERS, NUMERALS OR SIGNS ANYWHERE, clock, ticket and station\n  board included. 🔴 THE TRAIN IS LAID OUT THE SAME IN EVERY VOLUME: outside, the engine at the right and\n  the cars running left from it, the track along the bottom edge; inside a car, the windows on the far\n  wall and the door toward the engine on the right; at a station, the house at the left and the platform\n  line the whole width. Any camera, never mirrored.\n\nNOT: no airbrush, soft gradient, glow or bloom round a lamp, 3D render or texture filter / no motion\n  blur, speed lines or doubled edges - running is the tilt / 🔴 NO INVERTED SHAPE IN GLASS, ICE OR A\n  PUDDLE - a reflection is one FROST patch / 🔴 NO FIGURE ON THE RAILS OR PAST THE PLATFORM LINE WHILE\n  THE TRAIN IS ON THE PAGE, nobody leaning out of a window or standing in an open doorway while it runs,\n  the stove door shut whenever Bami is within a body-length of it, nobody ever falling from the roof / no\n  page fully dark: at least one lit patch on every page.", award: "Lizi Boyd · Flashlight" };
  var FIXED_CHARS = [
  {
    "key": "bami",
    "name": "밤이",
    "aliases": [
      "밤이",
      "Bami owl",
      "Bami"
    ],
    "spec": ""
  },
  {
    "key": "father",
    "name": "아빠",
    "aliases": [
      "아빠",
      "Father owl",
      "기관사 아빠",
      "Engine driver"
    ],
    "spec": ""
  },
  {
    "key": "mother",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mother owl",
      "식당칸 엄마"
    ],
    "spec": ""
  },
  {
    "key": "nabi",
    "name": "나비",
    "aliases": [
      "나비",
      "Nabi cat",
      "Nabi"
    ],
    "spec": ""
  },
  {
    "key": "pipi",
    "name": "삐삐",
    "aliases": [
      "삐삐",
      "Pipi sparrow",
      "Pipi"
    ],
    "spec": ""
  }
];
  var FACE = {"bami":"🦉","father":"🦉","mother":"🦉","nabi":"🐱","pipi":"🐦"};

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
      '.ep-art{flex:0 0 auto;font-size:11px;line-height:1;padding:2px 4px;border-radius:5px;color:#bbb;}',
      '.ep-art.part{color:#8a6d1f;background:#fdf6e0;}.ep-art.full{font-size:14px;color:inherit;background:transparent;}',
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
      return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || e.label, pages: e.pages || 0 };
    }).sort(function (a, b) { return a.num - b.num; });

    // 🔴 삽화 수는 **한 번의 요청**으로 받는다 — 권마다 물으면 50번이 된다.
    var art = {};
    try {
      var ra = await fetch('/api/comic-assets/series/' + KEY);
      var ja = await ra.json(); art = (ja && ja.data) || {};
    } catch (e) {}

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
      var full = 0;
      eps.forEach(function (e) { if (e.pages && (art[e.docId] || 0) >= e.pages) full++; });
      summary.textContent = '✅ ' + d + ' · 🟡 ' + w + ' · 🖼 ' + full + ' / ' + eps.length;
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
      // 🖼 삽화 — 다 들어갔으면 ✔, 일부면 몇 장인지, 없으면 빈 자리(회색)
      var got = art[e.docId] || 0, need = e.pages || 0;
      var art_ = document.createElement('span');
      art_.className = 'ep-art' + (need && got >= need ? ' full' : got ? ' part' : '');
      art_.textContent = need && got >= need ? '🖼' : got ? got + '/' + need : '·';
      art_.title = need ? '삽화 ' + got + '/' + need + '쪽' : '삽화 ' + got + '장';
      row.appendChild(n); row.appendChild(a); row.appendChild(art_); row.appendChild(mbtn); row.appendChild(badge);
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
 * 🔴 SSOT 는 docs/changjak-books/bami/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'bami';
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

/*
 * 노노네 겨울 골목 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/nono-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'nono';
  var ANCHOR = { slug: 'nono-tornpaper', name: '앵커 nono-tornpaper', text: "STYLE ANCHOR - nono-tornpaper   (three small friends in an old European alley, all winter / torn\n                                 paper collage, the tear makes the form)\n\nStyle: torn paper collage, exactly TWO coloured papers plus WHITE, laid on a winter-light ground\n  sheet, 4-6 year old picture book. 🔴 EVERY SHAPE IS TORN BY HAND AND ITS EDGE IS FIBROUS - a little\n  furry, a little uneven, and never once cut with scissors or a knife. There is not one mechanically\n  straight edge in this book; walls, roofs, steps and doorframes all wobble slightly. Where two papers\n  are pasted over each other the overlap is a shade thicker and darker - that is the only dark.\n  🔴 THE GROUND SHEET LEFT UNPASTED IS NOT WHITE SPACE, IT IS THE WINTER LIGHT. Snow is a SECOND,\n  WHITER paper torn and laid on top of it. SHADING IS ZERO - no modelling, no gradient, no cast\n  shadow, no highlight, no drawn line of any kind.\n\nRENDERING (finish hierarchy): an area is ONE torn piece of one paper, flat and even inside itself; the\n  only variation is the fibre at its edge and the thickness where pieces overlap. FINISHED THINGS PER\n  PAGE = 2, the child the page is about and the one thing that child touches; everything else is a\n  torn shape with no interior detail. Repeats are capped and the cap is the whole design: footprints\n  at most 14 separate marks · falling snow at most 14 torn specks · crumbs at most 9 · icicles at most\n  7 · sledge tracks at most 5 lines · paper lanterns exactly 3 · sparrows at most 11 · jars on a shelf\n  at most 6 of one shape · shutters down an alley at most 8 · a winter-market crowd at most 7 flat\n  overlap silhouettes with 0 faces and 0 hands · stars at most 14 bare ground-sheet points. Nothing in\n  a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.\n  🔴 DEPTH IS SPACING, NEVER DARKNESS - houses further down the alley stand CLOSER TOGETHER at the\n  same weight of paper. Nothing recedes by getting paler, bluer or softer.\n  🔴 THERE ARE THREE CHILDREN AND ONE GRANDFATHER AND NOBODY ELSE. Never a fourth child to fill a gap;\n  when one of the three has walked off, the page shows two and the empty place they left.\n  🔴 ONE VOLUME BREAKS THIS AND IT IS THE STORY (volume 23): a fourth child stands in five of its pages,\n  and she carries NO GREEN ANYWHERE. She is not there to fill a gap - she is the child who is not one\n  of the three yet, and on the last page of that volume the greens are still exactly three.\n\nPALETTE: GROUND SHEET WINTER LIGHT #EFEDE6, sky, air, the light, everything left unpasted · TORN WHITE\n  SNOW #FBFAF6, 🔴 snow, ice, roof caps, steam, firelight and lamplight, the eye scraps of every face,\n  and the grandfather's white face - always a torn piece, never\n  painted and never a drawn white line · TORN1 STONE GREY #7C8085, walls, cobbles, roof slates,\n  shutters, the alley - the cool one · TORN2 WOOD BROWN #8A6A4C, doors, beams, the shop counter, the\n  sledge, barrels, tables, animal chests - the warm one · OVERLAP DEEP SLATE #333A3E, animal backs and\n  heads, doorways, the inside of the shop, anything in deep shade - pasted overlap only, never a\n  fourth paper · ACCENT WOOL GREEN #2F7F4E, 🔴 pasted last, touching nothing but the one small green\n  thing each of the three children carries. No sky blue, no red, no purple, no pink, no yellow, no\n  white ink or white paint anywhere ever.\n\nSTAGE CLAUSES (the stage changes what the papers do, never which papers they are):\n  🔴 UNTOUCHED SNOW (volumes 01, 02) - the alley floor is ONE unbroken piece of TORN WHITE from wall to\n    wall, and the ONLY torn edges crossing it are the footprints. When the footprint line breaks, the\n    break is the page - it is the sharpest edge on the sheet.\n  🔴 FROST AND ICE (volumes 04, 05, 06) - the frozen floor is ONE flat piece of STONE GREY with TORN\n    WHITE only at the edges of the alley. 🔴 A REFLECTION ON ICE IS ONE MORE PIECE OF THE SAME PAPER\n    LAID BELOW THE WALL WITH 0 INTERIOR DETAIL - it is a smear, never a mirrored or flipped copy of\n    anything. Ash scattered on the ice is at most 11 WOOD BROWN specks in one band.\n  SNOW HILL AND SWEEPING (volumes 08, 13, 14, 16, 20) - fresh snow is one large TORN WHITE piece; a\n    swept or slid place is that piece TORN AWAY so the STONE GREY beneath shows, with the fibrous edge\n    marking exactly how far the work got. 🔴 THE UNSWEPT HALF AND THE SWEPT HALF MEET AT ONE TORN EDGE\n    and that edge carries the whole page.\n  WINTER MARKET (volumes 07, 09) - stalls and awnings are single flat pieces of TORN1 or TORN2; the\n    crowd is at most 7 flat OVERLAP silhouettes with 0 faces and 0 hands, and depth in the crowd is\n    made by figures standing CLOSER TOGETHER, never darker. Steam over the chestnut brazier is TORN\n    WHITE, one piece, rising straight.\n  🔴 LONG NIGHT AND FIRELIGHT (volumes 10, 11, 12, 19) - the GROUND SHEET ITSELF CHANGES TO DEEP SLATE\n    GREY #545A5E and nothing else changes: snow stays TORN WHITE, the two papers stay themselves, and\n    the three greens stay full strength. The stove fire, the lamp and the lit window are TORN WHITE\n    pieces with no glow, no rays and no halo, and they are the brightest thing on the page.\n  🔴 BURIED (volume 12) - the green bell is lost in the snow, so 🔴 KIKI CARRIES NO GREEN FROM PAGE 1\n    TO PAGE 9 - her neck is bare and there is no cord. The other two greens stay. On page 10 the third\n    green comes back inside the lamplight and it is the only green touching that patch of snow. This\n    is the one volume in the series where the signature rule is the story.\n  STEAMED WINDOW AND ICICLES (volumes 17, 18, 21) - a misted pane is TORN WHITE laid OVER the window\n    piece, covering it from the bottom edge upward with one torn line; what is behind it does not show\n    through at all. Icicles are TORN WHITE, at most 7, each torn on its own, hanging from one eaves\n    piece.\n  🔴 THAW (volumes 22, 23, 24, 25) - the TORN WHITE snow is torn back from its edges so STONE GREY\n    appears in patches, always from the outside in. Drips from the eaves are at most 9 TORN WHITE\n    specks. The last shaded snow (volume 25) is snow that has been torn away everywhere except in one\n    piece along the bottom of a wall.\n\nCHARACTER DESIGN LANGUAGE: the animals are built from the same torn pieces as the world - two or three\n  shapes with limbs laid over. GRADE: bipedal, standing upright, 🔴 AND ALL THREE\n  CHILDREN HAVE HANDS - the sparrow and the pigeon have hands, not wings, on every ordinary page.\n  🔴 A HAND IS A TORN SHAPE WITH THREE SEPARATE FINGERS. A rounded fingerless mitten reads as a wing\n  and is wrong on any page where the child is not flying.\n  WINGS ARE DRAWN ONLY WHEN SOMEBODY IS FLYING OR SPREADING THEM: Nono in flight (volumes 01, 04, 07,\n  10, 18, 19, 25) and Gugu spreading herself across the chair (volume 05). 🔴 NEVER ARMS AND WINGS ON\n  THE SAME CHILD ON THE SAME PAGE. Beaks and tails are part of the face and body and are always there.\n  Backs and heads are OVERLAP, chests and bellies are TORN2.\n  🔴 WHAT EACH ONE WEARS IS FIXED ON THE CAST SHEET AND IS NEVER ADDED TO. Two of the three wear no\n  coat at all, and a coat invented for them buries the one shape that tells them from the others.\n  🔴 BEAKS, NOSES, HANDS AND FEET ARE TORN FROM THE SAME PAPERS AS EVERYTHING ELSE - there is no skin\n  paper, no orange and no pink anywhere in this book. Which paper belongs to whose beak and feet is\n  on the cast sheet, and it is one of the things that separates the sparrow from the pigeon.\n  🔴 THE PIECES OF A FACE DO NOT MATCH EACH OTHER, AND THAT MISMATCH IS THE STYLE. Every part is torn\n  from paper by hand, so on any appearance the two eyes come out at different sizes and sit at\n  slightly different heights, one ear is bigger than its pair, a beak is a size too large for the\n  head that carries it. 🔴 THE MISMATCH IS NEVER TIDIED UP, AND ITS DIRECTION IS FIXED PER CHARACTER -\n  each child is wrong in ONE NAMED WAY on EVERY page (which eye is the bigger one, which ear sits\n  lower), and that constant wrongness is how a reader knows the same child again across 250 pages.\n  What is torn fresh on every page is the FIBRE, not the design: the edges wander, the sizes do not.\n  🔴 THE GRANDFATHER IS THE ONE WHOSE PIECES ALMOST MATCH, and that is what says grown-up when he is\n  cropped or far off and his height cannot be compared to anything.\n  Eyes are two TORN SCRAPS, never punched circles - white fibre showing along every edge, one always\n  noticeably bigger than the other; a small beak or nose; the mouth is ONE torn curve; above each eye\n  ONE short torn strip. Feeling is in the mouth or beak and the two strips.\n  THE THREE, separable at thumbnail size, all about the same height 🔴 BUT WITH THREE DIFFERENT HEAD\n  SIZES AGAINST THEIR BODIES, so the silhouette is top-heavy, bottom-heavy or spiked before any small\n  thing is read; that ladder and each one's fixed mismatch are on the cast sheet: NONO a young sparrow, a round\n  body and a short blunt beak, the smallest and roundest, a GREEN SCARF · GUGU a pigeon, a small head\n  on a broad deep chest, the widest of the three, a GREEN CLOTH BAG worn across one shoulder so it\n  hangs at her hip · KIKI a cat, two sharp triangle ears and one long tail, the tallest silhouette by\n  the ears alone, a GREEN BELL on a cord at her throat.\n  🔴 EACH CHILD'S GREEN THING IS ALWAYS VISIBLE AND IS THE ONLY GREEN ON THE PAGE - except volume 12,\n  where Kiki has none, and volume 25 page 10, where Nono's scarf is round the snowman's neck and\n  Nono's own throat is bare.\n  GRANDPA BADGER a badger, twice a child's height and the widest figure, a dark band torn straight\n  across the eyes, an apron, calm and still, hands always occupied with the same work the children are\n  doing. 🔴 HE WEARS NO GREEN ANYWHERE - not the apron, not the cap, not the shop awning - and he\n  never has an errand of his own.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - the shop front, the\n  market stalls and the puppet stage stay blank or carry a single torn pictogram.\n\nNOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no drawn or painted line of any\n  kind / no scissor-cut, knife-cut or mechanically straight edge / no white paint - white is a torn\n  piece.", award: "Lauren Child · I Will Not Ever Never Eat a Tomato" };
  var FIXED_CHARS = [
  {
    "key": "nono",
    "name": "노노",
    "aliases": [
      "노노",
      "Nono sparrow",
      "Nono"
    ],
    "spec": "BUILD: THE TOP-HEAVY ONE. Torn from TWO pieces only - one round head and one smaller round body\n  touching it with NO NECK between them. 🔴 THE HEAD IS 1/2.5 OF HIS HEIGHT AND IS THE WIDEST PART OF\n  HIM; his body is narrower than his own head and narrower than the pigeon's chest. Short legs.\n  Blacked out at thumbnail size he is a big circle sitting on a smaller circle.\nCLOTH: ONE short plain coat, hem at the hip, a cuff at each wrist - 🔴 SO THE ONLY THINGS CROSSING HIS\n  BODY ARE HORIZONTAL TORN EDGES. TORN2 WOOD BROWN. It is cut NARROWER THAN HIS HEAD so it never\n  becomes his widest part, and he wears nothing else, ever.\nGREEN: a GREEN SCARF round the throat with BOTH ENDS HANGING FREE, long enough to reach his hip. The\n  ends are the part of him that moves - they hang, blow back, flick up - and two loose green strips\n  stay readable when the whole figure is thumbnail-sized.\nBEAK AND FEET: 🔴 TORN2 WOOD BROWN, never orange. The beak is SHORT AND BLUNT, no longer than one eye\n  is wide - half the pigeon's. Feet wood brown with three splayed toes.\nHANDS: hands with THREE SEPARATE FINGERS on every ordinary page. Wings replace the arms ONLY in\n  volumes 01, 04, 07, 10, 18, 19 and 25, and on those pages he has no arms at all.\n🔴 HIS FIXED MISMATCH IS SIZE: the RIGHT eye is clearly bigger than the left, and the head is one size\n  too big for the body. Same direction on every page - only the fibre of the tear is new.\n🔴 AGAINST THE PIGEON, and the drawing fails if any of the three is missing: big head against small\n  head · horizontal hems against one diagonal strap · a short brown beak against a long slate one."
  },
  {
    "key": "gugu",
    "name": "구구",
    "aliases": [
      "구구",
      "Gugu pigeon",
      "Gugu"
    ],
    "spec": "BUILD: THE BOTTOM-HEAVY ONE. 🔴 HER HEAD IS 1/5 OF HER HEIGHT - THE SMALLEST HEAD OF THE THREE\n  CHILDREN - and it sits on a chest and belly torn as ONE DEEP PIECE TWICE THE WIDTH OF THAT HEAD,\n  widest low down. Two straight legs with a clear gap between them. Blacked out she is a small ball\n  standing on a big pear.\n🔴 WHEN SHE HUDDLES SMALL (volume 05) the whole outline shrinks and that is the page; what identifies\n  her is the RATIO of head to chest, never how much room she takes up.\nCLOTH: 🔴 NONE. The bag is the only thing she wears - no coat, no shawl, nothing laid over the chest,\n  because the chest is the whole of what tells her from the sparrow.\nGREEN: a GREEN CLOTH BAG on a strap worn across one shoulder, the bag hanging at the opposite hip.\n  🔴 THAT STRAP IS THE ONLY DIAGONAL ON ANY CHILD IN THE BOOK.\nBEAK AND FEET: 🔴 OVERLAP DEEP SLATE, never pink or orange. The beak is LONG AND TAPERING, about twice\n  the sparrow's, and being the same paper as her head it half disappears into it. Feet the same slate.\nHANDS: hands with THREE SEPARATE FINGERS. Wings appear ONLY in volume 05, where she spreads them\n  across the chair; there she has no arms.\n🔴 HER FIXED MISMATCH IS HEIGHT: the two eyes are about the same size but sit at CLEARLY DIFFERENT\n  HEIGHTS on the head, the left one a scrap lower. Same direction on every page."
  },
  {
    "key": "kiki",
    "name": "키키",
    "aliases": [
      "키키",
      "Kiki cat",
      "Kiki"
    ],
    "spec": "BUILD: THE SPIKED ONE. Two sharp triangle ears, each about half a head tall, are the tallest and\n  widest thing about her; the head without ears is 1/4 of her height. 🔴 HER BODY IS THE NARROWEST OF\n  THE THREE, straight from shoulder to hip with NO BELLY AT ALL, and ONE LONG THIN TAIL as long as her\n  body, torn as a single piece and NEVER BUSHY. Blacked out she is two spikes, a narrow trunk and a\n  whip.\nCLOTH: 🔴 NOTHING AT ALL. The cord at her throat is everything she wears - a bare narrow body and a\n  thin tail are what keep her from the two birds at any size, and a coat would take both away.\n  In ONE volume she has a hat; it is the only hat any child wears in this book and for nine of that\n  volume's ten pages it is not on her head.\nGREEN: a small GREEN BELL on a thin cord at the throat - 🔴 THE SMALLEST GREEN OF THE THREE, a single\n  dot, against two hanging strips and one diagonal band. In one volume she wears no green at all and\n  her throat is bare with no cord.\nFACE AND PAPER: no beak - a small torn nose. Head, body, limbs and tail are all OVERLAP DEEP SLATE;\n  only a chest patch is TORN2 WOOD BROWN. No claws are drawn.\nHANDS: hands with THREE SEPARATE FINGERS. She never has wings and never flies.\n🔴 HER FIXED MISMATCH IS THE EARS: ONE EAR IS CLEARLY BIGGER THAN THE OTHER AND SET LOWER on the head,\n  while her two eyes match. 🔴 THE SIZE AND THE SETTING ARE FIXED, THE DIRECTION THE EARS POINT IS NOT -\n  the ears carry her feeling and they turn, flatten and prick up freely."
  },
  {
    "key": "badger",
    "name": "오소리 할아버지",
    "aliases": [
      "오소리 할아버지",
      "할아버지",
      "Grandpa Badger"
    ],
    "spec": "BUILD: the only grown-up. Twice a child's height and the widest figure in the book, standing still,\n  weight low, shoulders sloping.\n🔴 HIS PIECES ALMOST MATCH, AND THAT IS WHAT SAYS GROWN-UP. His two eyes are the same size and sit\n  level, his two ears are a pair. The children are torn wrong on purpose; he is not. This must hold\n  when he is cropped at the waist or standing far down the alley, where his height cannot be compared\n  to anything.\nFACE: 🔴 A WHITE FACE WITH ONE DARK BAND TORN STRAIGHT ACROSS BOTH EYES, ear to ear. He is the only\n  figure in the book with white on his face. The eyes are two small round scraps inside that band.\nCLOTH: ONE apron from the chest to the ANKLE, so 🔴 HIS OUTLINE IS UNBROKEN FROM CHEST TO FLOOR AND HE\n  IS THE ONLY FIGURE WITH NO GAP BETWEEN THE LEGS - every child shows two legs and a gap and he never\n  does. Sleeves rolled above the elbow on every page, standing still or not: he is drawn mid-work.\n  His hands are always busy with the same work the children are doing.\n🔴 NO GREEN ANYWHERE ON HIM - not the apron, not a cap, not the shop awning - and he never carries a\n  green thing for a child. He has no errand of his own."
  },
  {
    "key": "squirrel",
    "name": "아기 다람쥐",
    "aliases": [
      "아기 다람쥐",
      "Baby squirrel"
    ],
    "spec": "🔴 SHE IS NOT ONE OF THE THREE. She stands in five pages of ONE volume, and 🔴 SHE CARRIES NO GREEN\n  ANYWHERE - that absence is her whole part in the book: she is the child who is not in the group\n  yet. Even on the last page of that volume, where she plays with them, the greens are three.\nBUILD: 🔴 THE SMALLEST FIGURE IN THE SERIES - she comes up to a child's shoulder. ONE TAIL TORN AS A\n  SINGLE PIECE, as tall as she is and wider than her body, standing up behind her: blacked out she is\n  more tail than animal, and that is what separates her from the cat, whose tail is one thin whip.\n  Round ears set low on the head, nothing sharp anywhere on her.\nCLOTH: one coat that is TOO BIG - it reaches BELOW THE KNEE so almost no leg shows, the opposite of\n  the sparrow's hip-length coat. TORN2 WOOD BROWN. Nothing else.\nHANDS: hands with THREE SEPARATE FINGERS, usually held together in front of her. No wings ever.\n🔴 HER FIXED MISMATCH IS SCALE: BOTH eyes are too big for the head and they are equally too big -\n  the only face in the book that is wrong in a symmetrical way."
  }
];
  var FACE = {"nono":"🐦","gugu":"🕊️","kiki":"🐱","badger":"🦡","squirrel":"🐿️"};

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
 * 🔴 SSOT 는 docs/changjak-books/nono/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'nono';
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

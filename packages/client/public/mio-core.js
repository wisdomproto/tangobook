/*
 * 미오네 유치원 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/mio-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'mio';
  var ANCHOR = { slug: 'mio-cutschool', name: '앵커 mio-cutschool', text: "STYLE ANCHOR - mio-cutschool   (a kindergarten class in a German river village / linocut, the knife\n                                makes the form)\n\nStyle: linocut printed in exactly TWO inks on thick oatmeal paper, 4-6 year old picture book. Form is\n  made by WHAT THE KNIFE TOOK AWAY - every white line is a gouged channel, never a drawn line, and\n  every edge is a cut edge, slightly ragged, never mechanically smooth. The gouge marks that clear an\n  area stay visible as parallel furrows. Where the two blocks overlap a third, darker colour appears\n  - that is the only dark. Unprinted paper is not white space, it is the window light, the snow and\n  the whitewashed wall. SHADING IS ZERO - no modelling, no gradient, no soft shading, no highlight.\n  🔴 A SHADOW IS THE PLACE THE TWO BLOCKS PRINTED OVER EACH OTHER, NOTHING ELSE - a flat OVERLAP area\n  with a CUT edge, 0 fade at its far end, 0 furrows inside it, drawn only where the page says a low\n  sun or a lamp throws one. It never sits under a thing as a modelling tone and never falls on a face.\n\nRENDERING (finish hierarchy): a cleared area is not blank - it carries the parallel furrows of the\n  tool that cleared it, AT MOST 9 FURROWS PER AREA, all running one way within that area, and the\n  direction changes only where one thing ends and another begins. FINISHED THINGS PER PAGE = 2, the\n  child the page is about and the one thing that child touches; everything else is a block shape with\n  no interior detail. 🔴 A CHILD WHO IS NOT THE SUBJECT OF THE PAGE IS NOT AN EXCEPTION AND IS NOT\n  ERASED EITHER: it loses the face and everything inside its outline, and it KEEPS its own cut\n  silhouette and its one small purple thing. Those two are how the reader counts the class, so they\n  are never what gets dropped. Repeats are capped and the cap is the whole design: blocks in a tower at most\n  12 · paper chain links at most 14 · cut snowflakes at most 9 · coat hooks at most 6 · classroom\n  windows at most 6 rectangles with 0 frames · shelved jars at most 6 of one shape · fallen leaves at\n  most 11 · acorns at most 9 · ducks on the river at most 5 · a village crowd at most 7 flat\n  silhouettes with 0 faces and 0 hands · falling snow at most 14 gouged points · stars at most 14\n  gouged points. Nothing in a repeat is a mirrored copy of its neighbour.\n  🔴 A CAP COUNTS THE THINGS THE PAGE COUNTS. A crowd of one kind that the page treats as ONE THING -\n  leaves covering a yard, acorns heaped into a hill - is a SINGLE cleared area with its own furrow\n  direction and no interior detail, and it is exempt from its cap; the cap then applies only to the\n  few that lie loose in front of it. A page that says the yard is covered draws the one area, never a\n  tally.\n  DENSITY RATION = none. 🔴 THE KNIFE SLIPS ONCE PER SPREAD AND THAT SLIP IS LEFT IN.\n  🔴 THE CLASS IS FIVE CHILDREN AND ONE TEACHER AND THERE IS NEVER A SIXTH CHILD - never an extra\n  child to fill a gap. When fewer than five are in the story, fewer than five are on the page and the\n  place they left shows. A grown-up from outside the class (a mother, a grandmother, the postman)\n  stands in the volume that brings one; a grown-up is BUILT LIKE TEACHER BAU AND NEVER LIKE A LARGER\n  CHILD, and wears no purple.\n\nPALETTE: PAPER OATMEAL #F0EAD8, window light, snow, whitewash, paper, everything not printed · INK1\n  SOOT #3B3A33, walls, floor, furniture, the teacher's mass, blocks, tree trunks, animal backs - the\n  dark one · INK2 RIVER #6F8996, the river, the sky at the water, aprons, smocks, the roof of the\n  play house, painted things - the cool one · OVERLAP NIGHT #232B2E, heads and backs, the inside of\n  the store cupboard, the river under the bank, anything in deep shade - overprint only, never a\n  third block · ACCENT PURPLE #6E4E9E, 🔴 cut last, touching nothing but the one small purple thing\n  each child carries. No sky blue that is not RIVER, no green, no red, no pink, no white ink.\n\nSTAGE CLAUSES (the stage changes what the two inks do, never which two they are):\n  CLASSROOM - floor and walls are SOOT cleared with furrows, the furrows running one way for the\n    floor and the other way for the wall, and that change of direction is the corner of the room.\n    Tables, shelves and the block basket are SOOT; smocks, aprons and the play house roof are RIVER.\n    🔴 THE WINDOW LIGHT IS BARE PAPER, one clean gouged shape with no rays and no glow, and it is\n    the brightest thing on the page. A thing being looked for is cut as ITS OWN BLOCK while\n    everything it hides among is the repeated one - that is how the eye finds it.\n  YARD - the ground is BARE PAPER; the fence, the swing frame, the ladder and the tree are SOOT; the\n    play house roof and the water tub are RIVER. Depth is made by things standing CLOSER TOGETHER,\n    never darker.\n  RIVERBANK - the river is ONE flat block of RIVER running across the page, 0 glints and 0 sparkle.\n    🔴 A RIPPLE EXISTS ONLY WHERE A PAGE COUNTS ONE, and it is then a CLOSED GOUGED RING - a channel\n    of cleared paper cut into the block, one ring per thing that touched the water, the count set by\n    the page and the rings never overlapping. Water that nobody touched carries 0 rings. A thing on\n    the water sits on top with its whole shape showing; a thing under it is OVERLAP inside that\n    block. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are no reflections in water in this book.\n    The bank, the reeds and the stones are SOOT with the furrows running ALONG the thing.\n  🔴 A MIRROR IS THE ONE EXCEPTION AND IT IS NOT WATER - a hung mirror or a washstand glass is a\n    cleared area with a cut edge, EMPTY when nobody is in front of it, and when a child stands in\n    front of it it holds THAT ONE FACE AND NOTHING ELSE. The room behind is never in it, no furniture,\n    no window, no second child. Nothing is flipped or distorted.\n  🔴 SNOW (any page where snow is on the ground) - the ground and the sky are not printed at all, BARE\n    PAPER from edge to edge, and the two blocks print ONLY what stands on it. A footprint in the snow\n    is a single SOOT mark; a mound gets at most 3 SOOT marks along its lower lip and nothing else.\n    🔴 LYING SNOW IS NOT PRINTED AND MADE SNOW IS - the moment snow has been rolled, patted or built\n    into a thing it is a thing standing on the ground, so it gets its own cut outline like anything\n    else that stands. A snowball in a hand, a snow duck, a heap somebody piled: printed. The white\n    ground it came from: still bare paper.\n  🔴 MADE THINGS NEVER TAKE THE ACCENT - a paper chain (19) is cut in SOOT and RIVER links only, and\n    cut snowflakes (11) are BARE PAPER. The purple in this world is worn, never made. If a made thing\n    were purple the five signatures would stop working on the page they matter most.\n  🔴 ADULT IN FRAME - whenever the page contains water, a height, or a door that can close, TEACHER\n    BAU IS INSIDE THE FRAME, whole, at the same depth as the children, doing something with her\n    hands. 🔴 THE CONDITION IS THE WHOLE RULE AND IT HOLDS ON EVERY PAGE OF EVERY VOLUME, not on a\n    list of pages, and not only from p8 onward. Read the page: is there water, a height, or a door\n    that can close? Then she is in it.\n\nCHARACTER DESIGN LANGUAGE: the animals are built from the same cut blocks as the world - two or three\n  shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth, 🔴 and ALL FIVE\n  CHILDREN HAVE HANDS, including the gosling, whose wings end in THREE BLUNT FINGERS and are drawn\n  holding, folding and pressing - never a paddle or a feather tip where a hand should be. The gosling\n  wears cloth like the other four; she is a child of this class and not a bird standing among\n  children. This class cuts, folds, digs and builds on every page. Heads and backs are OVERLAP,\n  chests and bellies are SOOT.\n  🔴 THE GAP BETWEEN FIGURES IS THE SENTENCE OF THE PAGE. Each child keeps its own cut silhouette\n  with cleared paper all round it, and 🔴 THE WIDTH OF THAT CLEARED PAPER IS WHAT THE PAGE IS SAYING:\n  bodies a hand's width apart are together, a child set a whole body-width out from the rest is left\n  out, a child whose cleared edge runs into another's is being taken in. The distances are decided\n  before any face is cut and change measurably from page to page inside one volume.\n  Eyes are GOUGED AWAY, not printed - each is a chip of cleared paper inside the dark head, and 🔴\n  THIS IS THE ONE SERIES WHERE AN EYE CHANGES SIZE: the knife takes more away when a child is\n  startled and barely nicks the block when a child narrows its eyes, so the white chip grows and\n  shrinks, and a shut eye is a single hairline gouge. A small nose or beak; the mouth is ONE gouged\n  curve; above each eye ONE short gouged brow. Feeling is in the mouth curve, the brows and the size\n  of the chip.\n  🔴 THE FIVE ARE TOLD APART BY WHAT LEAVES THE OUTLINE, AND NO TWO OF THEM LEAVE IT THE SAME WAY.\n  A mark inside the outline - a band across the eyes, rings on a tail, a snout - is never what tells\n  a child apart, because at the size these figures are printed the inside is gone. All five stand the\n  same height at the shoulder:\n  MIO a kitten - TWO POINTED EARS, sharp upright triangles, the only pointed ear in the class - and\n    ONE TAIL THINNER THAN HIS OWN FOREARM. A PURPLE satchel on a strap across the chest.\n  BOBO a piglet - EARS THAT FOLD OUT SIDEWAYS past the width of his head, so his head is the one head\n    wider than it is tall - NO NECK, head and body one outline with no notch - and NOTHING HANGING\n    BEHIND HIM, his screw tail staying inside the outline. A round flat snout. A PURPLE cap.\n  LALA a lamb - AN OUTLINE WITH NO STRAIGHT EDGE, a border of small fleece bumps running crown to\n    shoulder, the only toothed silhouette in the book. Her ears are small, set low at the side BELOW\n    the top of the fleece, and they lay back, prick up and can be covered by her own hands. A PURPLE\n    hairpin clipped into the fleece.\n  GAGA a gosling - ONE VERTICAL STALK AND NOTHING SIDEWAYS: a neck as long as her body is tall, wings\n    kept inside the body outline when not in use, so nothing at all protrudes at her sides. Taller\n    only by the neck. A PURPLE ribbon where the neck meets the body.\n  DURI a raccoon - LOW ROUND EARS, wider than they are tall, never pointed - and ONE TAIL AS THICK AS\n    HIS OWN LEG, at most 5 rings. A PURPLE handkerchief TIED ROUND HIS NECK, never carried in a hand.\n  🔴 EACH CHILD'S PURPLE THING IS IN FRAME WHENEVER THAT CHILD'S BODY IS IN FRAME - worn, or set down\n  where the child put it - AND IT IS THE ONLY PURPLE ON THE PAGE. 🔴 THE ONE PLACE IT IS ABSENT IS A\n  CROP THAT CANNOT HOLD IT: a page framed on two hands, a foot, a muzzle. Measured across 500 pages\n  there are nine such pages and they are all extreme close-ups. On those the purple is NOT invented\n  into the corner of the frame - the crop is the reason, and forcing it in makes the object move\n  around the body from page to page, which is worse than its being out of shot.\n  TEACHER BAU a big dog. 🔴 SHE IS TWICE A CHILD'S HEIGHT STANDING, BUT SHE IS KNEELING OR SITTING ON\n  HALF HER PAGES AND HEIGHT IS THEN GONE, so three things carry her and all three survive her sitting\n  down on the floor: HER HEAD IS WIDER THAN IT IS TALL, a long muzzle projecting forward and two heavy\n  ears hanging past the jaw, where every child's head is round or upright and no child has a hanging\n  ear · HER HEM COVERS HER KNEES, a working smock to mid-calf whose hem hides where her legs bend,\n  where every child's legs show from the hip, and kneeling she becomes a low broad mound · HER HANDS\n  ARE AS WIDE AS A CHILD'S HEAD, the biggest shape in whatever she is holding. Crown to shoulder is\n  ONE UNBROKEN DIAGONAL with no neck and no notch, and from behind she is a closed dome with the ears\n  inside the outline. Sleeves rolled above the elbow, always. Her hands hold the work the children are\n  doing. 🔴 SHE NEVER WEARS PURPLE, has no errand of her own and CARRIES NO TOOL OF HER OWN - no\n  pointer, no stick, no bundle.\n  🔴 TWO CHILDREN ARE NEVER MERGED INTO ONE SHAPE to fill a hole in the composition.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - the coat hooks, the\n  name cards and the wall chart stay blank or carry a single cut pictogram.\n\nNOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no drawn white line - white is\n  gouged / no smooth mechanical edge / no ink outside a cut block.", award: "Chris Naylor-Ballesteros · The Suitcase" };
  var FIXED_CHARS = [
  {
    "key": "mio",
    "name": "미오",
    "aliases": [
      "미오",
      "Mio kitten",
      "Mio"
    ],
    "spec": "THE ONLY POINTED HEAD IN THE CLASS, AND THE ONLY THIN TAIL.\nEARS - two sharp upright triangles, taller than they are wide, standing clear of the skull with\n  cleared paper between them. NOBODY ELSE HAS A POINTED EAR. They prick forward, lay back and swing\n  when the head turns; the shape stays a triangle whichever way it points.\nTAIL - ONE tail, as long as he is tall and THINNER THAN HIS OWN FOREARM along its whole length,\n  never thickening toward the root. It lies straight back, sweeps aside for balance, rises in a hook\n  or droops - the DIRECTION is the acting and the THINNESS is the constant. It is on the page in\n  every view including front and back, because it is half of what tells him from Duri.\nBUILD - the compact one. A small round head, a short body, clothed neck to ankle in SOOT so the whole\n  figure is one dark block and only the two ears and the one thin tail leave it.\nACCENT - a PURPLE satchel on a strap worn diagonally across the chest, so the purple reads as a line\n  across the dark block and not as a dot. Where the story takes it off him it is set down inside the\n  frame, never out of the picture.\n🔴 AGAINST DURI, and the drawing fails if either is missing: pointed ears against low round ones ·\n  a thin whip tail against one as thick as a leg."
  },
  {
    "key": "bobo",
    "name": "보보",
    "aliases": [
      "보보",
      "Bobo piglet",
      "Bobo"
    ],
    "spec": "THE ONLY HEAD WIDER THAN IT IS TALL, AND THE ONLY ONE WITH NO NECK.\nEARS - two ears folding OUT and DOWN from the sides of the skull, each reaching past the width of the\n  head, so his head silhouette is a HORIZONTAL shape while every other head in this book is round or\n  upright. They flop when he moves; they never stand up.\n🔴 HEAD AND BODY ARE ONE OUTLINE - no notch, no shoulder step, no cleared paper between skull and\n  shoulders. The other four all show that notch, and this is the fastest way to find him in a group.\nSNOUT - a round flat disc cut as its own small block on the front of the face, set low.\nTAIL - a short screw that STAYS INSIDE HIS OUTLINE. He is the one child with nothing hanging behind\n  him at all, and that absence is his mark in the silhouette row.\nBUILD - the widest of the five, and the width is in the chest and belly, not in loose clothes.\nACCENT - a PURPLE cap sitting flat on the crown between the two folded ears. It can be shoved back or\n  knocked crooked; it never leaves the page."
  },
  {
    "key": "lala",
    "name": "라라",
    "aliases": [
      "라라",
      "Lala lamb",
      "Lala"
    ],
    "spec": "🔴 HER OUTLINE HAS NO STRAIGHT EDGE ANYWHERE - the only toothed silhouette in the book.\nFLEECE - cut as a border of small round bumps running over the crown, down both sides of the head and\n  across the shoulders in ONE continuous serrated line. AT MOST 20 bumps around the whole outline,\n  unequal, and no bump a mirrored copy of its neighbour. The fleece is soft: it flattens against the\n  head when wet and swings when she moves, and the bumps get fewer and lower as it flattens.\n🔴 SHE HAS EARS AND THEY WORK. Two small ears set LOW at the side of the head, BELOW the top of the\n  fleece, so nothing points up above the bumps - they read as two notches interrupting the serrated\n  edge. They lay flat back, prick up, and can be COVERED BY HER OWN TWO HANDS. One whole volume is\n  about her covering them, so an ear that cannot be found and covered is a failure.\nBUILD - narrow through the body under all that fleece, thin arms and legs. Below the fleece line she\n  is smooth, so the toothed top and the plain bottom read as two different surfaces.\nACCENT - a PURPLE hairpin clipped INTO the fleece at one side of the head, on the same side in every\n  volume."
  },
  {
    "key": "gaga",
    "name": "가가",
    "aliases": [
      "가가",
      "Gaga gosling",
      "Gaga"
    ],
    "spec": "🔴 ONE VERTICAL STALK AND NOTHING SIDEWAYS.\nNECK - as long as her body is tall, the same narrow width from shoulder to skull, carrying a small\n  head with a blunt beak cut as its own block. When she stretches it the head goes up and the\n  SHOULDER LINE DOES NOT MOVE - she stands the same height at the shoulder as the other four and is\n  taller only by the neck.\nBODY - a wide teardrop standing on two feet. 🔴 THE WINGS STAY INSIDE THE BODY OUTLINE when she is\n  not using them, so nothing at all protrudes at her sides. At thumbnail size she is a stalk with a\n  bulb on top of a pear, and no other child in the book is a stalk.\n🔴 HANDS - HER WINGS END IN THREE BLUNT FINGERS AND THEY DO THE WORK: holding, folding paper,\n  pressing a fold flat, taking a thing out of another child's hand. Never a paddle, never a feather\n  tip where a hand should be.\n🔴 CLOTHES - she wears cloth like the other four, a smock over the body. A naked bird standing among\n  dressed children reads as an animal that wandered in, not as a child of this class.\nACCENT - a PURPLE ribbon tied where the neck meets the body, the one place on her that never goes\n  behind anything."
  },
  {
    "key": "duri",
    "name": "두리",
    "aliases": [
      "두리",
      "Duri raccoon",
      "Duri"
    ],
    "spec": "🔴 LOW ROUND EARS AND A TAIL AS THICK AS HIS OWN LEG.\nEARS - two low rounded arcs on the corners of the skull, WIDER THAN THEY ARE TALL, NEVER POINTED.\n  The pointed ear belongs to Mio and to nobody else in this book. They turn forward, back, sideways\n  and two different ways at once; the shape stays a low arc whichever way it turns.\nTAIL - ONE tail AS THICK AS HIS OWN LEG along its whole length and about as long as his body,\n  carrying AT MOST 5 rings. It stands up, streams out behind him when he runs, or lies along the\n  ground - the DIRECTION is the acting and the THICKNESS is the constant.\n🔴 THE DARK BAND ACROSS HIS EYES AND THE RINGS ON HIS TAIL ARE INTERIOR MARKS AND NEITHER SURVIVES A\n  SILHOUETTE. They are not what tells him apart, and a sheet that leans on them has not done the job.\n  The ears and the weight of the tail are what tell him apart.\nEYES - the gouged chip is cut INSIDE the dark band, so each chip has dark on every side of it.\nBUILD - the same height as the rest, ordinary width. His hands are the busiest in the class: he is\n  drawn mid-reach, mid-run and half-turned-away more often than anyone.\n🔴 ACCENT - a PURPLE handkerchief TIED ROUND HIS NECK. Never held in a hand, never in a pocket. His\n  hands are always full of something else, so an accent he has to carry would leave the page."
  },
  {
    "key": "teacher",
    "name": "바우 선생님",
    "aliases": [
      "바우 선생님",
      "선생님",
      "Teacher Bau big dog",
      "Teacher Bau"
    ],
    "spec": "SHE IS NOT A BIG CHILD, AND HER SIZE IS NOT WHAT SAYS SO. She stands twice a child's height, but she\nis kneeling, crouching or sitting on half the pages she appears on - including the one page in every\nvolume that is hers - and on those pages the height is gone. THREE THINGS CARRY HER INSTEAD, and all\nthree survive her sitting down on the floor:\n① 🔴 HER HEAD IS WIDER THAN IT IS TALL. A long muzzle projects forward past the front of the skull\n   and two heavy ears hang down past the jaw on either side, so the head reads as a HORIZONTAL shape\n   with three lobes. Every child's head is round or upright, and no child has a hanging ear.\n② 🔴 HER HEM COVERS HER KNEES. A plain working smock to mid-calf whose hem is one wide curve hiding\n   where her legs bend; every child's legs show from the hip down. Kneeling, the hem pools on the\n   floor and she becomes a low broad mound with a head on it. Sleeves rolled above the elbow so the\n   forearms are bare - always, on every page, standing or sitting.\n③ 🔴 HER HANDS ARE AS WIDE AS A CHILD'S HEAD. Whatever she holds, she holds it in a hand that is\n   plainly the largest shape in the picture. This is the one measurement that does not shrink when\n   she kneels.\n🔴 CROWN TO SHOULDER IS ONE UNBROKEN DIAGONAL - no neck, no notch, sloping shoulders. Every child has\na notch between head and shoulder. From behind she is one closed dome with both ears inside the\noutline and nothing standing off it.\n🔴 HER SMOCK IS NOT A CHILD'S SMOCK. If a child on the page wears RIVER cloth, hers is cut longer,\nplainer and with a different hem line, so the two are not the same garment at two sizes.\nNOT - 🔴 SHE WEARS NO PURPLE AND CARRIES NO ACCENT OF ANY KIND. She has no errand of her own and NO\nTOOL OF HER OWN: no pointer, no stick, no bundle, nothing tucked under an arm. What is in her hands\nis always the thing the children are working on at that moment."
  }
];
  var FACE = {"mio":"🐱","bobo":"🐷","lala":"🐑","gaga":"🦆","duri":"🦝","teacher":"🐕"};

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
 * 🔴 SSOT 는 docs/changjak-books/mio/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'mio';
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

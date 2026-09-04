/*
 * 쌍둥이네 바닷가 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/twins-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'twins';
  var ANCHOR = { slug: 'twins-risoshore', name: '앵커 twins-risoshore', text: "STYLE ANCHOR - twins-risoshore   (rabbit twins in a Portuguese fishing village / riso, two drums that\n                                  never line up)\n\nStyle: risograph, exactly TWO ink drums on salt-cream paper, 4-6 year old picture book. Ink lies\n  UNEVENLY - every pull is slightly mottled and streaked in the direction the drum turned, and no\n  area is perfectly solid. Where the two inks overlap a third, darker colour appears - that is the\n  only dark. 🔴 THE TWO DRUMS NEVER REGISTER: on every page the colour runs past the shape at TWO OR\n  THREE edges by about a hair, and that misfit is left showing - it is the picture, not a fault.\n  Unprinted paper is not white space, it is the sky, the sand and the whitewash. SHADING IS ZERO -\n  no modelling, no gradient, no soft shading, no highlight.\n  🔴 A LOW-SUN SHADOW IS A FLAT OVERLAP SHAPE lying on the ground with a HARD edge - it is a shape,\n  not shading, and it is drawn only when the page says the sun is low. It never softens, never\n  fades at its far end and never sits under a thing as a modelling tone. No other shadow exists.\n\nRENDERING (finish hierarchy): an area is ONE pull of one ink, never lighter or darker inside itself;\n  the only variation is the mottle and the streak. 🔴 THE SEA AND SKY OF ONE VOLUME ARE ONE PULL\n  RUNNING THE SAME DIRECTION ON EVERY PAGE OF THAT VOLUME - sideways for a calm day, down for rain,\n  flat for fog - and the weather lives in that direction and nowhere else. FINISHED THINGS PER PAGE =\n  2, the twin the page is about and the one thing that twin touches; everything else is a shape with\n  no interior detail. Repeats are capped and the cap is the whole design: boats in the harbour at\n  most 6 · net mesh at most 11 crossings · fish on a slab at most 9 · gulls at most 7 · market stalls\n  at most 5 · awnings at most 5 · windows down a street at most 8 · cobbles one arc mark at most 12\n  presses · shells at most 9 · rain at most 11 straight strokes all leaning one way · stars at most\n  14 bare paper points. Nothing in a repeat is a mirrored copy of its neighbour.\n  🔴 A CAP COUNTS THE THINGS THE PAGE COUNTS. A crowd of one kind that the page treats as ONE THING -\n  a bed of shells, a bank of seaweed, a heap of pebbles, a shoal - is a SINGLE flat shape with no\n  interior detail and is exempt from its cap; the cap then applies only to the few that lie loose in\n  front of it. A page that says \"thirty\" draws at most 9 loose and the rest as that one shape.\n  🔴 THE SEA CARRIES 0 RIPPLES AND 0 GLINTS ON EVERY PAGE. A ripple exists ONLY where a page COUNTS\n  it, and only in water small enough to hold inside one frame - a rock pool, a tub, a yard puddle.\n  It is then a CLOSED RING of bare paper cut into the pull, hard-edged, at most 3, never a texture,\n  never a sparkle and never on the open sea.\n  DENSITY RATION = none.\n  🔴 BOTH TWINS ARE FINISHED ON THE PAGES WHERE BOTH ARE WRONG (p3 through p7 in most volumes) -\n  they are one unit, and the \"one thing touched\" is then a single prop shared between them.\n\nPALETTE: PAPER SALT CREAM #F1F0E6, sky, sand, whitewashed walls, foam, light, everything not printed\n  · INK1 ATLANTIC #2E6B96, the sea, the sky, wet stone, aprons, painted shutters - the cool one ·\n  INK2 HULL RUST #A85E38, boat hulls, nets, ropes, crates, roof tiles, baskets, the harbour wall -\n  the warm one · OVERLAP HARBOUR NIGHT #2D3B42, rabbit backs and heads, the underside of a hull,\n  rock shade, evening sea, anything submerged - overprint only, never a third drum · ACCENT BUOY\n  YELLOW #E9A825, 🔴 pulled last, touching nothing but Riri's hat and Lolo's boots. 🔴 THE HAT AND\n  THE BOOTS KEEP THEIR YELLOW WHEN THEY ARE OFF THEIR OWNER - on a hermit crab, on an octopus,\n  floating on water, lying on sand. The yellow belongs to the two objects, not to the two rabbits.\n  🔴 A FISHING VILLAGE IS FULL OF YELLOW AND NONE OF IT IS ALLOWED HERE - oilskins, buoys, lamps,\n  nets, floats, the lighthouse body, paper flowers and kites all take INK1 or INK2. No sky blue that\n  is not ATLANTIC, no purple, no pink, no white ink anywhere ever.\n\nSTAGE CLAUSES (the stage changes what the two inks do, never which two they are):\n  SHORE - the sand is BARE PAPER from edge to edge and it is the light of the page; the sea is ONE\n    pull of ATLANTIC across the top, 0 ripples, 0 glints, 0 foam lines. 🔴 WET SAND left by a\n    retreating wave is a single flat ATLANTIC pull with a hard edge against the bare sand. Rocks are\n    INK2. Footprints and dug holes are at most 9 OVERLAP marks.\n  HARBOUR - hulls, crates and the wall are INK2; the water between the boats is ONE pull of ATLANTIC\n    with the boats sitting whole on top of it. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are\n    no reflections in this book. A thing under the water is OVERLAP lying inside the pull, hard edge,\n    never distorted. Far boats at most 4 silhouettes, 0 windows.\n  MARKET - awnings and stalls are single flat pulls of INK1 or INK2 with the misfit showing at their\n    corners; the ground is bare PAPER; the crowd is at most 7 flat silhouettes with 0 faces and 0\n    hands. Depth in the crowd is made by figures standing CLOSER TOGETHER, never darker.\n  ROCKPOOL AND LOW-TIDE GROUND - the pool is ONE pull of ATLANTIC with a hard edge; what lives in it\n    is OVERLAP inside that pull. The rock around it is INK2 with the streak running ALONG the rock,\n    not across it. The same clause covers every ground the tide has left behind - a pebble bank, a\n    mudflat - where the ground is INK2 and the water that stayed is ATLANTIC with a hard edge.\n  🔴 BOAT (any page where the camera is aboard) - being on a boat is a different stage from the\n    harbour it left. The hull, the gunwale and the floor boards are INK2, the boards running FORE\n    AND AFT, and the gunwale cuts the frame as one hard INK2 edge at a child's chin. Outside that\n    edge there is only that volume's SeaAndSky pull, running the direction that volume runs it. 0\n    ripples off the bow and 0 wake unless the page counts one. Nothing on the water is mirrored.\n  🔴 LIGHTHOUSE (any page the tower or its light is in frame) - the tower body is INK2 and the sky is\n    ATLANTIC. THE LIGHT ITSELF IS BARE PAPER, one clean shape with no glow, no rays and no halo, and\n    it is the brightest thing on the page. A beam is a CUT BAND of bare paper, never a ray.\n  🔴 FOG (any page the script fogs) - ATLANTIC at its lightest single pass with 0 shapes behind it.\n    Things enter the page by appearing at FULL strength, never by fading, and there is no pale\n    version of any colour.\n  🔴 RAIN AND SQUALL (any volume whose weather is rain) - the whole sky-and-sea pull runs DOWN on\n    every page of that volume; rain is at most 11 straight ATLANTIC strokes leaning the same way; wet\n    stone carries ONE bare paper strip and nothing mirrors in it. 🔴 A VOLUME THAT ONLY PASSES\n    THROUGH ONE SHOWER KEEPS ITS OWN DIRECTION - the shower is the 11 strokes alone, because the\n    direction belongs to the volume and cannot change inside it.\n  🔴 NIGHT (any page the script calls night or evening) - the sky and sea are OVERLAP as one flat\n    pull. The moon, the stars and the lit windows are BARE PAPER, each cut on its own, at most 14. A\n    lamp on the boat is bare paper and it carries the whole page.\n\nCHARACTER DESIGN LANGUAGE: the rabbits are built from the same flat pulls as the world - two or\n  three shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads\n  are OVERLAP, chests and bellies are INK2. 🔴 THAT IS A RULE ABOUT COLOUR, NOT ABOUT BUILD - the\n  four rabbits are two inks and THREE DIFFERENT BODIES, and AN ADULT IS NEVER A LARGER CHILD. A\n  child's head is as wide as its own shoulders and sits on them with no neck, and a child's eye is a\n  WIDE UPRIGHT OVAL with bare paper showing all round the pupil; an adult's head is far narrower than\n  its shoulders and an adult's eye is a NARROW LYING OVAL under a lid. Scale is never what tells an\n  adult from a child.\n  🔴 A CHARACTER HERE IS TWO MARKED THINGS, NOT A FACE. Each twin is stated by exactly two fixed\n  marks THAT ARE ON IN EVERY FRAME - THE BAND OF THE PAGE ITS YELLOW SITS IN and THE SET OF ITS EARS\n  - because the two faces are drawn identical and can never tell them apart; two further marks\n  (weight, and where a failure is drawn) come in when the page gives them. 🔴 THE EARS ARE ON EVERY\n  APPEARANCE WITHOUT EXCEPTION, INCLUDING BACK VIEWS, BATHS, BLANKETS AND PURE SILHOUETTES.\n  🔴 AND INCLUDING FRAMES CLOSER THAN A HEAD. Pages that come right in on where two bodies touch -\n  four hands round one shell, two hands round one finger - keep ONE EAR TIP of each twin present\n  inside the frame, at an edge, cropped. The ear is still on; it is on as a tip. 🔴 THE YELLOW IS\n  NOT THE FALLBACK HERE - the band is the weaker mark and is allowed to go, so a close frame that\n  keeps a hat brim and loses both ears cannot be read at all. If no ear tip fits, the frame is wrong. 🔴 THE\n  BAND IS THE WEAKER OF THE TWO AND IT IS ALLOWED TO GO - it needs the yellow to be worn, and five\n  pages take a yellow off its owner (see mark ① below). That is exactly why the ears carry the\n  series and the yellow does not. A difference between the twins is never written on a face.\n  🔴 AN EYE IS A BARE PAPER OVAL CUT INTO THE DARK HEAD with an OVERLAP pupil inside it - the head is\n  already OVERLAP, so an eye printed in that same colour would not exist; the paper is what makes the\n  eye and the pupil is the one place on a body where both drums land. 🔴 REGISTRATION IS A\n  HAIR OFF ON EVERY PAGE AND IT SHOWS AT AN EYE: one drum creeps past one eye and falls short of the\n  other, leaving a thin coloured lip along one side of one eye only, and that misfit is left in. A\n  small nose; the mouth is ONE curve; above each eye ONE short stroke; feeling is in the mouth curve\n  and the two strokes.\n  🔴 THE TWINS ARE ONE BODY DRAWN TWICE - same height, same build, same colour, same face. They are\n  told apart by FOUR things and nothing else:\n    ① RIRI wears a YELLOW HAT, so her yellow sits at the TOP of her silhouette · LOLO wears YELLOW\n      BOOTS, so his yellow sits at the BOTTOM. 🔴 THIS GOVERNS YELLOW THAT IS BEING WORN, and while\n      both are worn the two yellows are never in the same band of the page. 🔴 A YELLOW THAT HAS COME\n      OFF ITS OWNER GOES WHERE THE STORY PUTS IT AND THE BAND RULE LETS GO OF IT - a hat floating in a\n      pool sits at the bottom of the frame, boots kicked over a fall stand at the top. Measured across\n      500 pages that happens on five pages and every one of them is the event of its page (09 p8-p10\n      swaps the two bands on purpose; 15 p8 and p10 put the hat in the water). Forcing the band there\n      would delete the joke. Everywhere else the bands hold.\n    ② 🔴 EARS - Riri's two ears STAND STRAIGHT UP, close together and taller than her head · Lolo's\n      two ears HANG DOWN THE SIDES OF HIS HEAD past his chin, so his head reads half again as wide as\n      hers and carries no spike on top at all. This is the ONLY mark that survives a back view, a\n      bath, a blanket and a lost hat, so it is drawn on every single appearance including\n      silhouettes, and Lolo's ears are never folded away behind his neck where a front view loses\n      them.\n    ③ WEIGHT - Riri's weight is on her BACK foot, head still, both hands holding each other or\n      holding the thing up to look at it · Lolo's weight is past his FRONT foot, body tilted forward,\n      hands already out.\n    ④ RIRI'S FAILURE IS DRAWN AS A LEFTOVER, NOT AS TIREDNESS - a neat heap of sorted sand, a single\n      line of footprints, white dust on her hands, her own face in the pool. Never slumped shoulders.\n  🔴 SIDES ARE FIXED: WHENEVER BOTH TWINS ARE IN A FRAME, RIRI IS ON THE LEFT AND LOLO IS ON THE\n  RIGHT - measured across all 500 pages: 245 hold both twins, 18 of them name a side, and those 18\n  are Riri left with 0 exceptions - the one who stops to measure stands where the page starts and the one who\n  jumps in stands where it goes. On the pages where the two of them are also the direction of travel,\n  swapping them runs the story backwards. They are still never a mirrored pair: the two bodies are\n  the same drawing placed twice, not a reflection.\n  🔴 THE THREE BUILDS ARE DRUM, POST AND PEANUT AND THEY SHARE NO OUTLINE. DAD is a fisherman twice a\n  twin's height built as ONE BARREL - shoulders, chest and hips a single width equal to half his own\n  height, a small head sunk into it, short arms that stay inside that outline, black rubber boots to\n  mid-shin ending the silhouette in two blunt cylinders, and a ribbed ATLANTIC knitted cap with his\n  ears coming up through it · MOM is a head over the twins and the opposite shape, a NARROW UPRIGHT\n  POST with a neck that shows and long thin limbs, in ONE flat ATLANTIC apron from chest to below the\n  knee in a single unbroken piece, so she is THE ONLY FIGURE IN THE BOOK WITH NO GAP BETWEEN THE\n  LEGS, tied in a bow at the small of her back. Adults never carry yellow and never carry a second\n  piece of cloth.\n  🔴 EACH TWIN HAS EXACTLY TWO PATCH POCKETS, one on each hip, a hand's width square, sewn flat on\n  the outside of the cloth and IN THE SAME PLACE ON EVERY PAGE - four books show weight by filling\n  and emptying them, and the comparison only reads if the pocket never moves. Full, the square bulges\n  into a rounded mass hanging BELOW the hem line and swinging clear of the leg; empty, it lies flat\n  and its bottom edge is a straight seam. Never three pockets, never a breast pocket, never a bag\n  instead.\n  🔴 MOM'S APRON HAS ONE MORE STATE: its lower corner folded up inside a child's paw. The apron is\n  still ONE unbroken piece - the fold pulls its outline in toward the held corner, the pull stays for\n  as long as the child holds on, and it travels with her when she walks, so her silhouette is a\n  little different on every page of that holding. The paw is closed over cloth, never over her hand.\n  THE ANIMALS - gulls, the harbour cat, crabs, a hermit crab, an octopus -\n  are plain shapes with no clothes, no eyebrows and no expression.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - stalls, boat sterns\n  and crates stay blank or carry a single painted fish shape.\n\nNOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no streak inside a figure / no\n  perfectly solid area anywhere / no halo or ray around the lighthouse light.", award: "Wolf Erlbruch · The Big Question" };
  var FIXED_CHARS = [
  {
    "key": "riri",
    "name": "리리",
    "aliases": [
      "리리",
      "Riri rabbit",
      "Riri"
    ],
    "spec": "SHE AND LOLO ARE ONE BODY DRAWN TWICE - identical height, identical build, identical head size,\nidentical face, identical colour, identical INK2 belly patch, identical hands and feet. Nothing\nbelow is a difference in her body; it is a difference in what her body does and what it carries.\nEARS: her two ears STAND STRAIGHT UP, close together, parallel, and half again as tall as her head\n  is high. This is the mark that survives a back view, a bath, a blanket, a pure silhouette and a\n  lost hat, so it is drawn on every single appearance without exception.\nYELLOW: one small round HAT sits at the base of those ears, so her yellow is the HIGHEST thing in\n  her silhouette. It is the only yellow she carries and she carries no other cloth.\nWEIGHT: her weight is on her BACK foot, her feet are together and her head never leans out past her\n  toes. BOTH HANDS ARE ALWAYS BUSY WITH EACH OTHER - held together at the chest, or holding one\n  single thing up in front of her face to look at it. Her hands do not reach out into empty air.\nFRAME: whenever both twins are on the page she stands on the LEFT of the frame.\nFAILURE: when she has failed, the page draws the LEFTOVER and not the rabbit - a neatly sorted heap,\n  one line of footprints, dust on her hands, the pool she is looking into. Her shoulders never slump\n  and her ears never droop; a drooping ear on her would read as Lolo."
  },
  {
    "key": "lolo",
    "name": "롤로",
    "aliases": [
      "롤로",
      "Lolo rabbit",
      "Lolo"
    ],
    "spec": "HE AND RIRI ARE ONE BODY DRAWN TWICE - identical height, identical build, identical head size,\nidentical face, identical colour, identical INK2 belly patch, identical hands and feet. He is never\nthe bigger one, never the rougher-drawn one, and never a year older.\nEARS: his two ears HANG DOWN THE SIDES OF HIS HEAD, one each side, reaching past his chin, so his\n  head reads HALF AGAIN AS WIDE as hers and carries no spike on top at all. 🔴 They are never folded\n  back behind his neck, because the front view is where the twins have to be told apart and a\n  neck-folded ear is invisible there. Drawn on every single appearance including back views, water,\n  blankets and pure silhouettes.\nYELLOW: BOOTS to mid-shin, so his yellow is the LOWEST thing in his silhouette - two blunt lumps at\n  the ground with no ankle and no toe shape. It is the only yellow he carries and he carries no\n  other cloth. On the pages where one boot is off, the ears carry him alone.\nWEIGHT: his weight is already past his FRONT foot, the body tilted forward off the standing leg, and\n  BOTH HANDS ARE OUT IN THE AIR - reaching, grabbing, pointing - never held against himself.\nFRAME: whenever both twins are on the page he stands on the RIGHT of the frame."
  },
  {
    "key": "dad",
    "name": "아빠",
    "aliases": [
      "아빠",
      "Dad rabbit"
    ],
    "spec": "HE IS NOT A BIG TWIN. THE WHOLE BODY IS ONE BARREL: shoulders, chest and hips are a SINGLE WIDTH\nthat equals half his own height, and there is no waist anywhere. Twice a twin's height and the\nwidest figure in the book.\nHEAD: small against that barrel - UNDER HALF THE WIDTH OF HIS OWN SHOULDERS - and sunk into them\n  with no neck showing. A twin's head is as wide as its own shoulders; his is not.\nARMS: SHORT STUBS that hang inside the outline of the barrel and never break its edge. A twin's arms\n  swing clear of the body with open page between arm and belly; his never do.\nBOOTS: black rubber boots to mid-shin, wide and blunt, so the bottom of his silhouette is TWO THICK\n  CYLINDERS with no ankle and no foot. No yellow on him anywhere, ever.\nCAP: a ribbed ATLANTIC knitted cap pulled down to the eyes with the ears coming up through it. Cap\n  and boots are his two marks and BOTH READ FROM BEHIND. He carries no third piece of cloth.\nEARS: up and close together but SHORT against his body - the shortest ear-to-height in the book.\nEYES: the NARROW LYING OVAL under a lid, calm, with almost no bare paper showing round the pupil;\n  the mouth is one short flat curve.\nRead as a flat silhouette he is a DRUM standing on two cylinders - the one outline in this book with\nno waist and no gap between arm and body."
  },
  {
    "key": "mom",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mom rabbit"
    ],
    "spec": "SHE IS NOT A BIG TWIN EITHER AND SHE IS THE OPPOSITE SHAPE TO DAD: ONE NARROW UPRIGHT POST, the same\nwidth at the shoulder as at the hip, a head over the twins, with long thin limbs and A NECK THAT\nSHOWS - she is the only rabbit in the book with a neck. Her head is a narrow oval, not the twins'\nfull circle.\nAPRON: one flat ATLANTIC apron hangs from the chest to BELOW THE KNEE as a SINGLE UNBROKEN PIECE, so\n  from the chest down SHE IS THE ONLY FIGURE IN THE BOOK WITH NO GAP BETWEEN THE LEGS. Two thin legs\n  come out below its hem. 🔴 The apron is her outline, not a pattern laid on her - it must change the\n  shape a black cut-out of her would have.\nBACK: the apron ties in a BOW at the small of her back, and that bow is what tells her from behind\n  the way the cap tells Dad. No yellow on her anywhere, ever, no jewellery, no pattern, no second\n  piece of cloth.\nEARS: up and close together and the LONGEST in the book against the head, but narrow.\nEYES: the NARROW LYING OVAL under a lid, calm, with almost no bare paper showing round the pupil;\n  the mouth is one short flat curve.\nRead as a flat silhouette she is a TALL NARROW POST that widens once, at the apron, and closes at the\nbottom into one straight hem with two thin legs under it."
  },
  {
    "key": "cat",
    "name": "부둣가 고양이",
    "aliases": [
      "부둣가 고양이",
      "Harbor cat"
    ],
    "spec": "NOT A RABBIT AND NOT DRESSED. He is the ONLY FOUR-FOOTED FIGURE IN THE BOOK - he sits, stands and\nwalks on all four, his back is ONE unbroken line from ear to tail root, and a long tail runs off the\nend of that line and curls once. THE TAIL IS A THIRD OF HIS OUTLINE and no rabbit has anything like\nit, so he is told from every other character by shape alone at any size.\nEARS: two small triangles sitting ON TOP of the head, no taller than the head is high - the opposite\n  of every rabbit ear on the page.\nCLOTH: none. No hat, no boots, no apron, no collar, no cloth of any kind, and no yellow.\nFACE: two round eyes, a small nose, ONE short straight mouth line. NO EYEBROW STROKES AND NO\n  EXPRESSION - his feeling is in the back and the tail (arched, flat, low, curled) and never in the\n  face. He is the one character whose mouth does not curve.\nCOLOUR: back and head OVERLAP, chest and belly INK2, exactly as the rabbits - the same two drums,\n  built as an animal."
  }
];
  var FACE = {"riri":"🐰","lolo":"🐰","dad":"🐰","mom":"🐰","cat":"🐱"};

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
 * 🔴 SSOT 는 docs/changjak-books/twins/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'twins';
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

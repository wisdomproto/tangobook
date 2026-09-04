/*
 * 피포네 돌담 목장 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/pipo-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'pipo';
  var ANCHOR = { slug: 'pipo-charcoalwall', name: '앵커 pipo-charcoalwall', text: "STYLE ANCHOR - pipo-charcoalwall   (a puppy on an Irish stone-wall farm / charcoal, rubbed, pressed\n                                    and lifted - and one yellow)\n\nStyle: charcoal on pale cream toothy paper, and ONE yellow, 4-6 year old picture book. 🔴 THERE IS NO\n  SECOND COLOUR IN THIS BOOK. Charcoal is laid and rubbed flat with a finger, so every area is an even\n  grain with the paper's tooth speckling through. The three values are made by the hand, not by\n  pigment: RUBBED is the world, PRESSED is the only dark, and LIGHT IS MADE BY LIFTING - a kneaded\n  eraser takes the charcoal back off and the bare paper underneath is the brightest thing on the page.\n  NOTHING IS EVER DRAWN WHITE. SHADING IS ZERO in the modelling sense - an area is rubbed, pressed or\n  lifted, never graded between.\n\nRENDERING (finish hierarchy): an area is ONE rubbed field, even everywhere, never denser or lighter\n  inside itself. A thing standing on that field is PRESSED with one continuous line. Every charcoal\n  edge is slightly furry EXCEPT the outline of Pipo, which is one clean pressed line - that is how the\n  eye finds him before it finds the yellow. FINISHED THINGS PER PAGE = 2, Pipo and the one thing he\n  touches; everything else is a shape with no interior detail. Repeats are capped and the cap is the\n  whole design: sheep at most 9 separate animals and a flock further off is ONE rubbed mass with 0\n  outlines inside it · loose stones at most 11 · hay heaps at most 7 and loose hay strands at most 11\n  · eggs at most 8 · washing at most 6 with at most 6 pegs · milk cans at most 4 · market stalls at\n  most 5 and roofs at most 8 · potatoes on one stem at most 9 · goslings exactly 4 · planks at most 6\n  · windows at most 6 lifted rectangles with 0 frames · footprints at most 11 · a market crowd at most\n  7 flat pressed silhouettes with 0 faces and 0 hands · stars at most 14 lifted points, each taken out\n  on its own. Nothing in a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.\n  🔴 DEPTH IS SPACING, NEVER DARKNESS. Sheep further up the hill stand CLOSER TOGETHER at the same\n  weight of charcoal. Nothing recedes by getting paler or softer.\n  🔴 \"BLURRED\", \"HAZY\" OR \"FAINT\" IN A SCENE MEANS AN UNMODELLED SHAPE - the same charcoal weight\n  with 0 interior marks, outline only. Never paler, never softer, never out of focus. The only\n  depth cue in this book is spacing.\n  🔴 A THING ONLY IMAGINED - some volumes draw what Pipo is picturing. This medium has three values\n  and no outline, so there is no frame, no cloud edge and no soft focus to mark it with. THE WORLD IS\n  LIFTED AWAY AROUND IT: an imagined thing is PRESSED, and the rubbed field stops short of it on\n  every side, leaving a band of untouched paper all round where it meets the real page. It rests on\n  nothing - no ground under it, no contact line, no shadow, and it never touches Pipo or the yellow.\n  When the whole page is imagined, nothing is rubbed at all and the pressed thing stands in bare\n  paper edge to edge. 🔴 THAT IS NOT A SNOW PAGE - on snow, a thing stands ON the ground and gets its\n  strokes along the lower lip where it meets it; an imagined thing meets no ground and gets no lower\n  lip. No frame, no outline, no faded edge, no graded value, no second way of drawing it.\n  🔴 EXTREME CLOSE - when one thing fills the frame the finish does NOT go up a step. It is the same\n  drawing enlarged, not a more detailed one: the same three hands at the same weight, the paper's\n  tooth the same size, the number of marks NO higher than when the thing is small. Nothing gains an\n  interior it does not have on a wide page.\n  🔴 SHADOWS: a shadow is ANOTHER PRESSED SHAPE with a furry edge and 0 marks inside it - never a\n  grey wash, never graded, and never laid across a body or a face. It appears only where the script\n  puts one, in two kinds: a LONG shadow lying on the ground when the sun is low, whose LENGTH is\n  what says the hour, and a FLAT shape thrown on a wall, which is a plain silhouette a reader must\n  be able to name (a pointed post, a round ball, a sheep's ears, a puppy's hanging ears). 🔴 NO\n  LIGHT SOURCE IS EVER DRAWN with a shadow - no lamp beam, no ray, no lit pool. Nothing else in\n  fifty books casts a shadow.\n\nPALETTE: PAPER PALE CREAM #EFE9DC, sky, mist, snow, fleece, hay, the sun, light, everything lifted or\n  never touched · CHARCOAL RUBBED #6B665C, hillside, ground, wet earth, weather, the whole field of\n  the world · CHARCOAL PRESSED #2C2A25, the stone wall, animal backs and heads, iron, the inside of\n  the byre, night - this is the only dark and it is made by pressure, never by a second pigment ·\n  ACCENT GORSE YELLOW #F0B429, 🔴 laid last, touching NOTHING but Pipo's scarf. 🔴 EVERY LANTERN,\n  LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT LIFTED AND CARRIES NO YELLOW; the\n  single exception in fifty books is a far lantern being searched for across the dark (the cart\n  lantern, volume 10), where the body is still pressed charcoal and only its glow is yellow.\n  🔴 HAY, FLEECE, MIST, SNOW, THE SUN, YOLK AND BUTTER ARE ALL UNPAINTED PAPER. No white chalk, no\n  white paint, no earth colour, no roof colour, no second pigment of any kind, ever.\n\nSTAGE CLAUSES (the stage changes what the charcoal does, never how many colours there are):\n  WALL - the stone wall runs through this whole series and it is the one thing always PRESSED: each\n    course of stones is a separate pressed shape with a furry edge, and the wall keeps its full weight\n    however far away it is. Where the wall is the thing being followed by hand, it is the only\n    pressed thing on the page and everything else is rubbed.\n  SLOPE - the hillside is ONE rubbed field running downhill, 0 individual blades. Fences, gates and\n    the byre are PRESSED. Far ridges are at most 4 pressed outlines with 0 texture inside.\n  YARD AND BYRE - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, thatch a\n    zigzag. The mark is the SAME shape every time and may run off an edge but is never redrawn. 🔴 THE\n    OPEN DOORWAY AND THE WINDOW LIGHT ARE LIFTED PAPER and are the brightest thing on the page. A\n    thing being looked for is drawn with its own pressed outline while everything it hides among is\n    the repeated mark - that is how the eye finds it.\n  🔴 MIST (any page the script calls fog or mist) - everything but the nearest thing and the wall is RUBBED at its lightest, with\n    0 shapes behind it. Things enter the page by appearing at FULL weight, never by fading, and there\n    is no pale version of the charcoal.\n  🔴 SNOW AND ICE (any page whose ground is snow, ice or frost) - the hill and the yard are not rubbed at all, BARE PAPER from edge to edge, and\n    the charcoal draws ONLY what stands on it. A mound gets at most 3 pressed strokes along its lower\n    lip and nothing else. 🔴 SNOW AND HAY ARE BOTH BARE PAPER AND ARE TOLD APART BY GRAIN ALONE - hay\n    is thin separate strands, snow is one unbroken smooth face.\n  BROOK (any page at the brook, its stepping stones or the low causeway) - the water is ONE rubbed field running across the page, 0 ripples, 0 glints.\n    A thing in the water is PRESSED lying inside that field, hard edge, never distorted. 🔴 NOTHING IS\n    EVER MIRRORED IN THE WATER - there are no reflections in this book. Stones and the low causeway\n    are PRESSED with the marks running ALONG the thing, not across it.\n  🔴 MARKET (any page in the market, or with the market roofs in frame) - roofs and awnings are one rubbed field each; the crowd is at most 7\n    flat pressed silhouettes. 🔴 THE SHOP BEING LOOKED FOR IS FOUND BY ITS ROOF SHAPE AND BY THE\n    DIRECTION OF ITS RUBBING - when every other roof is rubbed sideways, that one is rubbed in tight\n    diagonals. It is NEVER found by a colour and NEVER by a sign, because this world has neither.\n  🔴 EVENING, NIGHT AND DAWN (any page after dark or at first light) - the sky is one rubbed field at\n    its heaviest. 🔴 EVERY LANTERN, LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT\n    LIFTED - a hole of bare paper, no glow, no halo, no ray, no lit pool - AND CARRIES NO YELLOW.\n    The ONE exception in fifty books is a far lantern being searched for across the dark (the cart\n    lantern, volume 10): that one glow is yellow, so that it can answer the scarf across the page,\n    and it is still one clean shape with no rays and no halo. The sun, whenever it is in frame, is\n    LIFTED PAPER, a plain disc with no rays, made round by the dark ridge around it.\n  MUD (any page after rain, or with standing water on the ground) - the puddle is ONE rubbed field with a hard lifted rim. Splashes are LIFTED, at\n    most 9 marks, each taken out on its own, never drawn.\n\nCHARACTER DESIGN LANGUAGE: the animals are built from the same marks as the world - two or three\n  shapes with limbs laid over, 🔴 BUT THE FIVE ARE NOT THE SAME SHAPES AT DIFFERENT SIZES: each one\n  has its own build and its own way of folding, set out per figure below and in the per-character\n  spec. GRADE: bipedal, standing upright ON TWO LEGS ONLY - no character ever drops onto four,\n  in silhouette or from behind or far off, 🔴 AND NOBODY IN THIS WORLD WEARS CLOTHES. There are no sleeves, no cuffs, no trousers, no boots. The only worn things in 250 pages\n  are Pipo's YELLOW SCARF, Mom's wide-brimmed hat (a prop set on the head, not a garment) and, on any\n  page where the script puts a boot in the story, ONE old boot on Sheep Grandpa's one foot with the\n  other foot bare (this happens on three pages of one book and nowhere else). Backs and heads are PRESSED,\n  chests and bellies are RUBBED.\n  🔴 WITH NO CLOTHES ON ANYBODY, THE ONLY THINGS THAT SAY WHO A FIGURE IS ARE HOW ITS BODY IS FOLDED,\n  WHAT ITS HANDS HOLD AND WHERE ITS FEET ARE PUT - and 🔴 THE FOLD COMES FIRST, because props change\n  hands (volume 23) and end up on the ground (13, 25) while a body keeps its own stance. Each figure\n  bends in ONE named way and in no other: Pipo drops into a crouch with both hands up in front of his\n  chest · Mom folds at the waist with her arms hanging and her legs straight · Sheep Grandpa leans\n  back belly-first and steps out ahead · Goose Auntie plants her feet and sends only her neck · Horse\n  Uncle throws his weight forward past a lifting front foot.\n  On every page each figure is holding, carrying, dragging or has just set\n  down ONE nameable thing, and each figure's feet are placed on ONE nameable thing - the top of the\n  wall, wet mud, the doorstep, the lip of the barrow, a bale, another animal's back. 🔴 NOBODY IS\n  EVER DRAWN WITH EMPTY HANDS AND FEET LEFT UNPLACED, not even in the background.\n  An eye is a RUBBED DARK SMUDGE WITH NO EDGE ANYWHERE - you cannot say where it stops; the same for\n  the nose. 🔴 THE MOUTH IS THE ONE HARD MARK ON A FACE, pressed with the stick's end, and above each\n  eye ONE short pressed stroke; feeling is carried by those two alone.\n  🔴 THE FIVE, separable at thumbnail size WITH EVERY PROP TAKEN AWAY: PIPO a puppy, three heads\n  tall, head a third of him, no neck, ONE BARREL of a body with NO WAIST, short thick limbs, short\n  ears set high, a blunt short muzzle, a stub tail, a YELLOW SCARF, and hands that dig, press, roll\n  and carry on every page · MOM a dog and 🔴 NOT A BIGGER PIPO - six heads tall, small head on a\n  NECK, a NARROW BODY WITH A WAIST, long thin limbs, LONG EARS HANGING PAST THE JAW, a long narrow\n  muzzle, a long thin hanging tail; her wide soft-brimmed hat is a prop and NOT what tells her from\n  Pipo, no yellow · SHEEP GRANDPA a sheep, ONE WOOLLY OVAL with a small head straight on top and NO\n  NECK, short legs out of the bottom, the roundest and the shortest of the three neighbours - and 🔴\n  unlike the flock, who go on four legs with blank faces, he stands on two; a CROOKED STICK in one\n  hand, hands, no yellow · GOOSE AUNTIE a goose, 🔴 WINGS AND NO HANDS - she points, fans and flaps\n  with a wing edge and anything she holds is pinched under a wing edge; A NECK AS LONG AS HER BODY,\n  the smallest body of the three neighbours, the tallest silhouette by the neck alone, no yellow ·\n  HORSE UNCLE a horse, THE WIDEST SHOULDERS IN THE BOOK over a heavy slab of a chest, a long straight\n  muzzle and a mane, blunt hooves for feet, hands - 🔴 and never a four-legged horse body, rump or\n  long horse tail, in any view, no yellow. 🔴 THE THREE NEIGHBOURS NEVER CARRY YELLOW and are never drawn standing over Pipo.\n  THE ANIMALS - sheep, lambs, goslings, the farm cat - are plain shapes with no eyebrows and no\n  expression, except a lamb wearing the bell. 🔴 THEIR SIZES ARE A FIXED LADDER: a grown sheep comes\n  to PIPO'S SHOULDER, and a LAMB IS THE SIZE PIPO CAN CARRY IN BOTH ARMS AGAINST HIS CHEST - three\n  books turn on exactly that hold, and a lamb drawn at grown-sheep size makes those pages impossible.\n  It must also fit on Mom's lap while she sits.\n  A gosling is a quarter of Goose Auntie's body; the farm cat is knee-high on Pipo.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - market stalls, sacks\n  and shop fronts stay blank or carry a single scratched shape.\n\nNOT: no airbrush, gradient or 3D render / 🔴 no halo, ray, beam, lens flare or lit pool on the ground\n  around any light - a light in this medium is a shape, and shapes do not spread / no white chalk or\n  white paint / no second pigment of\n  any kind - hay, fleece, mist, snow, the sun, yolk and butter are bare paper, and nothing is ever\n  coloured to make it easy to find / no garments on anybody - no sleeves, cuffs, trousers, coats or\n  pairs of boots (the scarf, the wide hat and the ONE odd boot named above are the whole wardrobe of\n  fifty books).", award: "George Butler · Drawn Across Borders" };
  var FIXED_CHARS = [
  {
    "key": "pipo",
    "name": "피포",
    "aliases": [
      "피포",
      "Pipo puppy",
      "Pipo"
    ],
    "spec": "HE IS A CHILD BY BUILD, NOT BY SCALE. THREE HEADS TALL: the head is a THIRD of him and sits straight\non the shoulders with NO NECK SHOWING. The body is ONE BARREL - chest and belly are a single curve\nand there is NO WAIST, so nothing on him folds in the middle. Arms and legs are SHORT AND THICK and\nhold the same width from shoulder to paw. EARS ARE SHORT AND SET HIGH ON TOP OF THE SKULL. The\nmuzzle is BLUNT AND SHORT, no longer than one eye is wide. The tail is a STUB.\nSTANCE: HE GOES DOWN TO THINGS. The knees bend and the whole body drops, and BOTH HANDS COME UP IN\nFRONT OF HIS CHEST onto whatever he is pressing, digging, rolling, hugging or carrying - his arms\nare never left hanging at his sides. HE IS THE ONLY FIGURE THAT CROUCHES.\nHis outline is ONE CLEAN PRESSED LINE while every other edge on the page is furry.\nHe wears a YELLOW SCARF and he is the only yellow thing in the book."
  },
  {
    "key": "mom",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mom dog"
    ],
    "spec": "SHE IS NOT A BIGGER PIPO, AND THE HAT IS NOT WHAT TELLS THEM APART - TAKE THE HAT OFF AND SHE MUST\nSTILL READ AS A DIFFERENT ANIMAL. SIX HEADS TALL: the head is SMALL on her and THERE IS A NECK\nbetween it and the shoulders. The body is NARROW and has a WAIST at the middle - she is the only\nfigure in the book with a place to fold. Arms and legs are LONG AND THIN and hold the same narrow\nwidth the whole way down. EARS ARE LONG AND HANG LOOSE PAST THE JAW and swing when she moves. The\nmuzzle is LONG AND NARROW. The tail is LONG AND THIN and hangs down.\nSTANCE: SHE FOLDS AT THE WAIST. With Pipo she bends her upper body down toward him while her legs\nstay straight - THE BEND IS IN ONE PLACE, HALFWAY UP HER. Her ARMS HANG STRAIGHT DOWN and whatever\nher hands hold HANGS OFF THEM: a basket handle, a cart handle, a pail. SHE NEVER CROUCHES and she\nnever holds anything up against her chest - that is Pipo's way, not hers.\nHer one prop is a WIDE SOFT FLOPPY BRIMMED HAT, THE SAME HAT EVERY TIME - never a flat stiff boater,\nnever two different hats in one drawing.\nNO YELLOW ANYWHERE ON HER, on the hat or on anything she carries."
  },
  {
    "key": "sheep",
    "name": "양 할아버지",
    "aliases": [
      "양 할아버지",
      "할아버지",
      "Sheep grandpa"
    ],
    "spec": "HE IS AN EGG THAT WALKS. The woolly body is ONE OVAL, widest low at the belly, and it takes up\nalmost his whole height; the head sits STRAIGHT ON TOP OF IT WITH NO NECK AT ALL and is SMALL\nagainst it - the opposite of Pipo, whose head is a third of him. Legs are SHORT and come straight\nout of the bottom of the oval, and the arms are short too and barely clear the wool. He is the\nROUNDEST FIGURE AND THE SHORTEST OF THE THREE NEIGHBOURS.\n🔴 HE IS NOT ONE OF THE FLOCK. The sheep out in the fields walk on FOUR legs with plain blank faces;\nhe stands on TWO and has the two pressed brow strokes over his eyes. That must hold even when he is\nstanding in among them.\nSTANCE: HE LEANS BACK AND GOES FIRST. The belly leads, the shoulders sit behind it, and one leg is\nalways half a step out ahead of the other - he is the one out in front of everybody, doing it the\nold way.\n🔴 THE CROOK IS NOT WHAT IDENTIFIES HIM - it changes hands in volume 23 and lies on the ground\nacross all three of them in 13 and 25. The egg and the missing neck do that work.\nNO YELLOW."
  },
  {
    "key": "goose",
    "name": "거위 아줌마",
    "aliases": [
      "거위 아줌마",
      "아줌마",
      "Goose auntie"
    ],
    "spec": "SHE IS A NECK WITH A BODY UNDER IT. THE NECK IS AS LONG AS THE BODY IS LONG and runs up out of the\nshoulders as one unbroken line, so she is the TALLEST FIGURE IN THE BOOK BY THE NECK ALONE while her\nBODY IS THE SMALLEST OF THE THREE NEIGHBOURS - a plain teardrop. Two thin stick legs with flat\nwebbed feet and no knees showing. The head is small and carries ONE BEAK, a hard wedge.\n🔴 WINGS AND NO HANDS. She has no arms, no fingers and no hands anywhere. She points, fans, flaps\nand reaches with a WING EDGE, and anything she does hold is PINCHED UNDER A WING EDGE, never gripped.\nSTANCE: THE NECK AIMS AND THE BODY STAYS PUT. Her feet are planted flat and square while the neck\ngoes somewhere - out, up, round a corner, over a wall. THE LINE FROM HER FEET TO HER BEAK BENDS\nONCE, AT THE SHOULDER, and everything she is claiming to have seen is in that bend.\nNO YELLOW."
  },
  {
    "key": "horse",
    "name": "말 아저씨",
    "aliases": [
      "말 아저씨",
      "아저씨",
      "Horse uncle"
    ],
    "spec": "HE IS WIDE BEFORE HE IS TALL. THE SHOULDERS ARE THE WIDEST THING IN THIS BOOK and the chest is a\nheavy slab under them. The head is LONG AND STRAIGHT, a plain wedge of a muzzle, with a MANE running\nfrom between the ears down the back of the neck as one pressed mass. He is the BIGGEST FIGURE, but\nhis mark is the WIDTH, not the height - Goose Auntie's beak still goes higher than his ears.\n🔴 TWO LEGS ONLY. He stands and walks upright on two legs like everybody else. A HORSE'S FOUR-LEGGED\nBODY, A HORSE'S RUMP AND A LONG HORSE TAIL NEVER APPEAR - not in silhouette, not seen from behind,\nnot far off in a field. Feet are two blunt hooves; the arms are heavy and end in hands.\nSTANCE: HE IS ALWAYS ALREADY MOVING. HIS TWO FEET ARE NEVER LEVEL WITH EACH OTHER and never both\nflat on the ground - one is out ahead and lifting - and his weight is thrown FORWARD past his front\nfoot so his whole outline leans. He is the only figure that is off balance on purpose.\nNO YELLOW."
  }
];
  var FACE = {"pipo":"🐶","mom":"🐶","sheep":"🐑","goose":"🦢","horse":"🐴"};

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
 * 🔴 SSOT 는 docs/changjak-books/pipo/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'pipo';
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

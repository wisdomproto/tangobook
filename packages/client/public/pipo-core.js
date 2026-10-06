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
  var SHEET_STYLE = "PIPO STORYBOOK CHARACTER SHEET — match the supplied approved story illustration.\nThe attached story character defines identity AND rendering. Extract only the named character;\nexclude companions, scenery and the temporary action. Old cast-card images are not the reference.\nSTYLE: warm cream paper grain, lively charcoal/graphite contours, soft short fur strokes or\nfeather/wool marks appropriate to the species, gentle grey pencil modelling and readable dark\neyes, nose and mouth. Light fur/fleece/feathers remain warm white. Hand-drawn picture-book finish;\nno photoreal anatomy, dark felt doll, plastic, 3D render or blurred ink-blob eyes. Eyelids, brows\nand mouth can change expression while the character's face and natural markings stay consistent.\nOnly the puppy's scarf is golden yellow. Preserve the neutral colours of each other character.\nSoft animal bodies and rounded limbs; no human musculature. Draw the SAME named individual in\nthree views: relaxed front, easy three-quarter step and relaxed back. Keep coat, ears, muzzle,\ntail, accessories and proportions consistent. Infer unseen back details simply from this design.\nOne character only, on plain warm cream, with clear space between views. No scenery, captions,\nlabels, swatches, additional characters or silhouette-test rows. Do not copy the scene's pose.";
  var ANCHOR = { slug: 'pipo-charcoalwall', name: '앵커 pipo-charcoalwall', text: "STYLE ANCHOR - pipo-charcoalwall   (a puppy on an Irish stone-wall farm / charcoal, rubbed, pressed\n                                    and lifted - and one yellow)\n\nStyle: textured charcoal and graphite on warm cream paper, matching the approved story pages.\n  Warm white fur, fleece and feathers and a light-grey horse coat have soft grey pencil modelling,\n  lively contours and species-specific short strokes/curls. This applies to ALL five characters.\n  Natural dark ears, muzzles, hooves, mane and tails stay distinct. No flat dark body fill replacing\n  a light coat; no felt-doll, photoreal or muscular human anatomy. Yellow belongs to the puppy scarf.\n\nRENDERING (finish hierarchy): retain fine paper grain, lively charcoal contours and soft pencil\n  shadows as in the supplied pages. Character eyes, noses and mouths are clear small dark shapes,\n  not edgeless smudges. Keep important animals readable against the environment. FINISHED THINGS PER PAGE = 2, Pipo and the one thing he\n  touches; backgrounds stay quieter, while every named character keeps its reference face and coat\n  detail. Repeats are capped and the cap is the\n  whole design: sheep at most 9 separate animals and a flock further off is ONE rubbed mass with 0\n  outlines inside it - 🔴 EXCEPT on a page whose event IS the counting (the script counts them aloud):\n  there up to 12 may be told apart, and only as ONE FILE passing a gate gap, the counted ones on one\n  side and the uncounted still a mass on the other · loose stones at most 11 · hay heaps at most 7 and loose hay strands at most 11\n  · eggs at most 8 · washing at most 6 with at most 6 pegs · milk cans at most 4 · market stalls at\n  most 5 and roofs at most 8 · potatoes on one stem at most 9 · goslings exactly 4 · planks at most 6\n  · windows at most 6 lifted rectangles with 0 frames · footprints at most 11 · a market crowd at most\n  7 flat pressed silhouettes with 0 faces and 0 hands · stars at most 14 lifted points, each taken out\n  on its own. Nothing in a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.\n  🔴 DEPTH IS SPACING, NEVER DARKNESS. Sheep further up the hill stand CLOSER TOGETHER at the same\n  weight of charcoal. Nothing recedes by getting paler or softer.\n  🔴 \"BLURRED\", \"HAZY\" OR \"FAINT\" IN A SCENE MEANS AN UNMODELLED SHAPE - the same charcoal weight\n  with 0 interior marks, outline only. Never paler, never softer, never out of focus. The only\n  depth cue in this book is spacing.\n  🔴 A THING ONLY IMAGINED - some volumes draw what Pipo is picturing. This medium has three values\n  and no outline, so there is no frame, no cloud edge and no soft focus to mark it with. THE WORLD IS\n  LIFTED AWAY AROUND IT: an imagined thing is PRESSED, and the rubbed field stops short of it on\n  every side, leaving a band of untouched paper all round where it meets the real page. It rests on\n  nothing - no ground under it, no contact line, no shadow, and it never touches Pipo or the yellow.\n  When the whole page is imagined, nothing is rubbed at all and the pressed thing stands in bare\n  paper edge to edge. 🔴 THAT IS NOT A SNOW PAGE - on snow, a thing stands ON the ground and gets its\n  strokes along the lower lip where it meets it; an imagined thing meets no ground and gets no lower\n  lip. No frame, no outline, no faded edge, no graded value, no second way of drawing it.\n  🔴 EXTREME CLOSE - when one thing fills the frame the finish does NOT go up a step. It is the same\n  drawing enlarged, not a more detailed one: the same three hands at the same weight, the paper's\n  tooth the same size, the number of marks NO higher than when the thing is small. Nothing gains an\n  interior it does not have on a wide page.\n  🔴 SHADOWS: a shadow is ANOTHER PRESSED SHAPE with a furry edge and 0 marks inside it - never a\n  grey wash, never graded, and never laid across a body or a face. It appears only where the script\n  puts one, in two kinds: a LONG shadow lying on the ground when the sun is low, whose LENGTH is\n  what says the hour, and a FLAT shape thrown on a wall, which is a plain silhouette a reader must\n  be able to name (a pointed post, a round ball, a sheep's ears, a puppy's hanging ears). 🔴 NO\n  LIGHT SOURCE IS EVER DRAWN with a shadow - no lamp beam, no ray, no lit pool. Nothing else in\n  fifty books casts a shadow.\n\nPALETTE: PAPER PALE CREAM #EFE9DC, sky, mist, snow, fleece, hay, the sun, light, everything lifted or\n  never touched · CHARCOAL RUBBED #6B665C, hillside, ground, wet earth, weather, the whole field of\n  the world · CHARCOAL PRESSED #2C2A25, the stone wall, natural dark animal markings, iron, the inside of\n  the byre, night - this is the only dark and it is made by pressure, never by a second pigment ·\n  ACCENT GORSE YELLOW #F0B429, 🔴 laid last, touching NOTHING but Pipo's scarf. 🔴 EVERY LANTERN,\n  LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT LIFTED AND CARRIES NO YELLOW; the\n  single exception in fifty books is a far lantern being searched for across the dark (the cart\n  lantern, volume 10), where the body is still pressed charcoal and only its glow is yellow.\n  🔴 HAY, FLEECE, MIST, SNOW, THE SUN, YOLK AND BUTTER ARE ALL UNPAINTED PAPER. Warm white fur, fleece and feathers follow the approved references; no unrelated bright white objects, no earth colour, no roof colour, no second chromatic pigment.\n\nSTAGE CLAUSES (the stage changes what the charcoal does, never how many colours there are):\n  WALL - the stone wall runs through this whole series and it is the one thing always PRESSED: each\n    course of stones is a separate pressed shape with a furry edge, and the wall keeps its full weight\n    however far away it is. Where the wall is the thing being followed by hand, it is the only\n    pressed thing on the page and everything else is rubbed.\n  SLOPE - the hillside is ONE rubbed field running downhill, 0 individual blades. Fences, gates and\n    the byre are PRESSED. Far ridges are at most 4 pressed outlines with 0 texture inside.\n  YARD AND BYRE - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, thatch a\n    zigzag. The mark is the SAME shape every time and may run off an edge but is never redrawn. 🔴 THE\n    OPEN DOORWAY AND THE WINDOW LIGHT ARE LIFTED PAPER and are the brightest thing on the page. A\n    thing being looked for is drawn with its own pressed outline while everything it hides among is\n    the repeated mark - that is how the eye finds it.\n  🔴 MIST (any page the script calls fog or mist) - everything but the nearest thing and the wall is RUBBED at its lightest, with\n    0 shapes behind it. Things enter the page by appearing at FULL weight, never by fading, and there\n    is no pale version of the charcoal.\n  🔴 SNOW AND ICE (any page whose ground is snow, ice or frost) - the hill and the yard are not rubbed at all, BARE PAPER from edge to edge, and\n    the charcoal draws ONLY what stands on it. A mound gets at most 3 pressed strokes along its lower\n    lip and nothing else. 🔴 SNOW AND HAY ARE BOTH BARE PAPER AND ARE TOLD APART BY GRAIN ALONE - hay\n    is thin separate strands, snow is one unbroken smooth face.\n  BROOK (any page at the brook, its stepping stones or the low causeway) - the water is ONE rubbed field running across the page, 0 ripples, 0 glints.\n    A thing in the water is PRESSED lying inside that field, hard edge, never distorted. 🔴 NOTHING IS\n    EVER MIRRORED IN THE WATER - there are no reflections in this book. Stones and the low causeway\n    are PRESSED with the marks running ALONG the thing, not across it.\n  🔴 MARKET (any page in the market, or with the market roofs in frame) - roofs and awnings are one rubbed field each; the crowd is at most 7\n    flat pressed silhouettes. 🔴 THE SHOP BEING LOOKED FOR IS FOUND BY ITS ROOF SHAPE AND BY THE\n    DIRECTION OF ITS RUBBING - when every other roof is rubbed sideways, that one is rubbed in tight\n    diagonals. It is NEVER found by a colour and NEVER by a sign, because this world has neither.\n  🔴 EVENING, NIGHT AND DAWN (any page after dark or at first light) - the sky is one rubbed field at\n    its heaviest. 🔴 EVERY LANTERN, LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT\n    LIFTED - a hole of bare paper, no glow, no halo, no ray, no lit pool - AND CARRIES NO YELLOW.\n    The ONE exception in fifty books is a far lantern being searched for across the dark (the cart\n    lantern, volume 10): that one glow is yellow, so that it can answer the scarf across the page,\n    and it is still one clean shape with no rays and no halo. The sun, whenever it is in frame, is\n    LIFTED PAPER, a plain disc with no rays, made round by the dark ridge around it.\n  MUD (any page after rain, or with standing water on the ground) - the puddle is ONE rubbed field with a hard lifted rim. Splashes are LIFTED, at\n    most 9 marks, each taken out on its own, never drawn.\n\nCHARACTER DESIGN LANGUAGE: the approved story illustrations define the five cast members.\n  Preserve their coat colours, species, head/muzzle proportions, ears, limbs and tails across views.\n  PIPO: small warm-white upright puppy, long black floppy ears, projecting rounded dog muzzle,\n  black nose and small dark oval eyes, crown tufts, rounded belly and short sturdy paws, short\n  upward-curved black tail; plain golden-yellow fringed scarf, no other clothing.\n  MOM: white adult dog with long black floppy ears, rounded muzzle and natural adult proportions,\n  soft torso, rounded paw-like hands and sturdy legs; curved visible black tail and soft grey-beige\n  wide-brimmed hat. No tiny head, six-head fashion proportions, pinched waist or stick-like limbs.\n  SHEEP GRANDPA: larger than the puppy, broad warm-white curly wool body, clearly projecting grey\n  sheep face with a rounded long muzzle and dark drooping ears; mobile woolly arms with dark ends,\n  short sturdy dark legs and hooves. His hooked staff is removable; no tiny head buried in an egg.\n  GOOSE AUNTIE: white rounded full body, layered broad feathered wings, long gently curved substantial\n  neck, readable small head, dark tapered beak and webbed feet; wings, not hands. No spindle body.\n  HORSE UNCLE: light-grey upright horse, long rounded muzzle, dark nostrils, shaggy black mane,\n  upright ears, rounded torso and sloping shoulders, simple rounded forelimbs with dark hoof-like\n  mitts, large dark hooves and a visible hanging dark hair tail outside the body silhouette.\n  No bodybuilder shoulders, pectorals, abs, human fingers or hidden short tassel tail.\n  Identity is stable; posture follows the scene. No permanently bent mother, crouching puppy or\n  compulsory unbalanced horse. Hands may be empty when appropriate; never invent a held prop.\n  Expressions use eyelids, brows, mouth and posture. Speech does not force all mouths into the\n  same open shape, or require an extra face in a hand/prop close-up or back view. Match the crop.\n  Scarf and hat are the usual accessories. The sheep's single boot belongs only to scenes that\n  explicitly call for it; do not make it permanent footwear. Props may change hands as scripted.\n  THE ANIMALS - sheep, lambs, goslings, the farm cat - are plain shapes with no eyebrows and no\n  expression, except a lamb wearing the bell. 🔴 THEIR SIZES ARE A FIXED LADDER: a grown sheep comes\n  to PIPO'S SHOULDER, and a LAMB IS THE SIZE PIPO CAN CARRY IN BOTH ARMS AGAINST HIS CHEST - three\n  books turn on exactly that hold, and a lamb drawn at grown-sheep size makes those pages impossible.\n  It must also fit on Mom's lap while she sits.\n  A gosling is a quarter of Goose Auntie's body; the farm cat is knee-high on Pipo.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - market stalls, sacks\n  and shop fronts stay blank or carry a single scratched shape.\n\nNOT: no airbrush, gradient or 3D render, with soft pencil modelling for all characters / 🔴 no halo, ray, beam, lens flare or lit pool on the ground\n  around any light - a light in this medium is a shape, and shapes do not spread / preserve warm white coats and feathers in all five reference designs / no second chromatic pigment of\n  any kind - hay, fleece, mist, snow, the sun, yolk and butter are bare paper, and nothing is ever\n  coloured to make it easy to find / no garments on anybody - no sleeves, cuffs, trousers, coats or\n  pairs of boots (the scarf, the wide hat and the ONE odd boot named above are the whole wardrobe of\n  fifty books).", award: "George Butler · Drawn Across Borders" };
  var FIXED_CHARS = [
  {
    "key": "pipo",
    "name": "피포",
    "aliases": [
      "피포",
      "Pipo puppy",
      "Pipo"
    ],
    "spec": "PIPO: the small WHITE puppy wearing a golden-yellow scarf in the attached approved story pages.\nWarm white fur covers the face, projecting rounded muzzle, torso, arms, legs and broad paw feet.\nLong charcoal-black floppy ears hang alongside the cheeks to the jaw/neck; a few white tufts on\nhis crown, small dark oval eyes, expressive short brows and a rounded black nose. No grey body,\ndark face mask, short ears or flat teddy-bear muzzle. Match the reference head-to-body ratio,\nwith a softly rounded childlike torso, little belly, short rounded arms and sturdy short legs.\nA short black tail curves upward outside the silhouette. A plain golden-yellow scarf with one\nflat fringed trailing end is his only garment. No trousers, shoes or knitted costume.\nRelaxed upright front and back poses, an easy three-quarter step; no compulsory crouch or prop.\nKeep the white fur, soft grey pencil shadows and expressive dog face of the approved page."
  },
  {
    "key": "mom",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mom dog"
    ],
    "spec": "MOM: the WHITE adult dog waving in the cottage doorway in the attached approved story page.\nRounded projecting canine muzzle, black nose, small dark oval eyes, long black floppy ears,\nwarm white fur and a soft wide-brimmed grey-beige hat with a darker band. A visible black tail\ncurves outward and upward behind her. No yellow scarf, dress or shoes.\nShe is a naturally taller adult relative of the puppy: comfortably sized head and neck, soft\nrounded torso and belly, rounded arms ending in simple paw-like hands, sturdy legs and broad\nbare paws. Match the doorway reference, not a six-head fashion figure, tiny head, pinched human\nwaist or thin stick limbs. She can stand, wave or bend naturally; never permanently folded at\nthe waist with arms forced downward. Same white-fur pencil texture as the puppy."
  },
  {
    "key": "sheep",
    "name": "양 할아버지",
    "aliases": [
      "양 할아버지",
      "할아버지",
      "Sheep grandpa"
    ],
    "spec": "SHEEP GRANDPA: the upright sheep with the curved shepherd's crook in the attached story pages.\nA broad soft body and mobile arms covered with warm white/cream curly wool: loose overlapping\npencil curls, gentle grey shading. A clearly projecting charcoal-grey sheep head rises above the\nwoolly shoulders, with long rounded muzzle, small dark eyes, dark drooping ears and a light wool\nforelock. No tiny round head buried in an egg-shaped blob. Larger and taller than the puppy,\nwith a broad belly, arms that can reach away from the body and small dark hand/hoof-like ends.\nShort sturdy dark lower legs and dark hooves. The dark staff has a rounded hook; include it once\nin the front view and leave the other views' hands clear. The SINGLE boot on the stepping-stone\npage is a temporary story prop, not permanent footwear. No yellow or extra clothing."
  },
  {
    "key": "goose",
    "name": "거위 아줌마",
    "aliases": [
      "거위 아줌마",
      "아줌마",
      "Goose auntie"
    ],
    "spec": "GOOSE AUNTIE: the WHITE goose with broad raised wings in the attached sunrise story page.\nFull softly rounded pear-shaped body with layered white feathers and a small pointed tail.\nA long substantial neck rises in a gentle natural curve to a small but readable goose head.\nMatch the reference neck/body balance, not a thin stick on a tiny droplet. Small dark eyes with\nexpressive lids, a tapered dark-grey beak, two sturdy dark lower legs and large webbed feet.\nBroad feathered wings with distinct layered tips can fold and spread; no human arms or fingers.\nRest the wings naturally in front/back views; lift one wing slightly in three-quarter view to\nshow feather structure. No compulsory rigid neck or immobile stance. No clothes or yellow.\nKeep the warm white feather texture, soft pencil shadows and clear dark contour of the page."
  },
  {
    "key": "horse",
    "name": "말 아저씨",
    "aliases": [
      "말 아저씨",
      "아저씨",
      "Horse uncle"
    ],
    "spec": "HORSE UNCLE: the LIGHT-GREY upright horse beside the cart in the attached approved story page.\nLong rounded horse muzzle, dark nostrils, small dark oval eyes, upright ears, shaggy black\nforelock and mane. One softly substantial torso with a rounded belly and sloping shoulders,\nnot a human chest: no pectorals, abs, biceps, pinched waist or bodybuilder proportions.\nRounded animal forelimbs end in dark hoof-like mitts, not human fingers. Sturdy hind legs end\nin large dark hooves. A visible dark horse tail hangs from the rump with a flowing hair tuft\noutside the silhouette; never a tiny hidden tassel. He stands on TWO legs, without an added\nfour-legged horse torso. Match the head-to-body balance of the reference, not maximal shoulder\nwidth. Relaxed front/back poses, easy three-quarter step. The raised hoof and hands on hips\nbelong to the page action and are not compulsory. No clothes or yellow. Light-grey textured\ncoat with soft pencil modelling, never a dark muscular humanoid."
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
    // 표정 참고 본문에는 화면 밖 인물도 언급된다. 등장 판정은 원래 컷 설명만 사용한다.
    var rest = String(sceneText || '').split(/(?:<b>)?표정 연기/)[0].toLowerCase();
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
      // 코타는 시트의 의상·무늬 규격도 페이지 프롬프트로 전달한다.
      if (KEY === 'kota') gist = [c.desc, c.spec].filter(Boolean).join('\n');
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
      KEY === 'kota' ? '참조 우선: 위 문자 규격은 기본값이다. 첨부한 각 인물의 실제 얼굴 무늬·옷색·옷 형태를 우선한다. 참조에 없는 무늬를 추가하거나 다른 인물의 무늬·의상을 옮기지 않는다. 명시된 장면 행동에 따른 수건 전달·탈의·맨발만 예외로 한다.' : '',
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
    var world = SHEET_STYLE || ANCHOR.text.replace(/\nSTAGE CLAUSES[\s\S]*?(?=\n[A-Z])/, '');
    return [
      world,
      '',
      // 🔴 매체는 글로 안 전해진다. 유키 시트는 아이가 부드러운 그러데이션 카툰, 할머니가 접힘을 다
      //    그린 사실화로 나왔다 — 앵커에 `SHADING IS ZERO`·`한 획을 두 번 덧긋지 않는다` 가 있는데도.
      //    단권 99권은 화면에 수상작 원본이 떠 있었고 시리즈는 글만 있었다. 그림 한 장이 그 자리를 메운다.
      !SHEET_STYLE && ANCHOR.award ? '[매체 참조] 🔴 이 프롬프트와 함께 **앵커 원본 그림 한 장을 반드시 첨부**한다 — '
        + ANCHOR.award + '. 획·자국·결·가장자리는 아래 글이 아니라 그 그림이 정한다.' : null,
      SHEET_STYLE ? '[참조] 사용자가 확정한 본문 삽화 중 이 인물이 나온 그림을 실제로 첨부한다. 파일명만 적는 것은 이미지 첨부가 아니다. 그 그림의 해당 인물만 따른다.' : null,
      SHEET_STYLE ? '[출력] 정사각 1024x1024. 따뜻한 크림색 배경에 세 방향을 간격 있게 배치한다.' : '[출력] 정사각 1024x1024. 배경은 순수 마젠타 #FF00FF 단색, 인물을 가운데 두고 여백 8%.',
      '바닥 그림자 없음, 글자·라벨 없음, 다른 인물 없음.',
      '[인물] ' + g.name + (g.aliases[1] ? ' — ' + g.aliases[1] : '') + (SHEET_STYLE ? '. 아래 개체 규격과 첨부 본문 그림을 따른다.' : '. 위 CHARACTER DESIGN LANGUAGE 의 규격을 그대로 따른다.'),
      KEY === 'kota' && g.desc ? '[해당 손님의 외형] ' + g.desc : null,
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
    // Keep the episode list closed until the reader opens it.
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
